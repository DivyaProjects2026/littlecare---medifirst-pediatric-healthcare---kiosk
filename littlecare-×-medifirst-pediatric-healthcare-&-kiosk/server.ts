import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase payload limits for base64 and JSON data
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Set up directory for persistent data and uploads
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(__dirname, 'public', 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded video and media files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer storage for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB video limit
});

const DB_FILE = path.join(DATA_DIR, 'db.json');

const initialDb = {
  marqueeMessage: "🌟 Welcome to LittleCare × MediFirst! Wash hands with Sparky, stay hydrated during fever, and enjoy happy doctor visits! ✨",
  parentAccounts: [
    { username: "parent_sample", childName: "Sample Child", pin: "1234" },
    { username: "parent_aarav", childName: "Aarav Sharma", pin: "1234" },
    { username: "parent_anaya", childName: "Anaya Patel", pin: "1234" }
  ],
  currentLoggedInParent: "parent_sample",
  childDetails: { name: "Sample Child", age: "8 Years", gender: "Male" },
  vitalsVideos: [
    { category: "Temperature", title: "Friendly Forehead Temp Check", videoUrl: "https://www.youtube.com/embed/3PmVJQUCm4s", isVideoFile: false, paramKey: "temp", unit: "°C", defaultVal: "36.8" },
    { category: "Heart Rate", title: "Happy Heartbeat Drum", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", isVideoFile: false, paramKey: "hr", unit: "BPM", defaultVal: "90" },
    { category: "Oxygen Saturation", title: "SpO2 Magic Star", videoUrl: "https://www.youtube.com/embed/3PmVJQUCm4s", isVideoFile: false, paramKey: "spO2", unit: "%", defaultVal: "98" },
    { category: "Respiratory Rate", title: "Breathing Butterfly", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", isVideoFile: false, paramKey: "respRate", unit: "/min", defaultVal: "20" },
    { category: "Blood Pressure", title: "Bouncy Arm Band", videoUrl: "https://www.youtube.com/embed/3PmVJQUCm4s", isVideoFile: false, paramKey: "bp", unit: "mmHg", defaultVal: "100/65" },
    { category: "Weight", title: "Weighing Star Scale", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", isVideoFile: false, paramKey: "weight", unit: "kg", defaultVal: "26" },
    { category: "Height", title: "Giraffe Height Ruler", videoUrl: "https://www.youtube.com/embed/3PmVJQUCm4s", isVideoFile: false, paramKey: "height", unit: "cm", defaultVal: "128" }
  ],
  cartoonStories: [
    {
      title: "Sparky the Super Soap!",
      icon: "fa-soap text-cyan-400",
      bgGradient: "from-cyan-400 to-blue-600",
      character: "🫧",
      message: "Hello little friend! I am Sparky the Soap. Bubble away the germs!",
      videoUrl: "https://www.youtube.com/embed/3PmVJQUCm4s",
      isVideoFile: false
    },
    {
      title: "Dr. Bear's Stethoscope Song",
      icon: "fa-heart-pulse text-rose-400",
      bgGradient: "from-rose-400 to-pink-600",
      character: "🐻",
      message: "Listen to the thump-thump of your strong happy heart!",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      isVideoFile: false
    },
    {
      title: "Water Drops & Healthy Sipping",
      icon: "fa-bottle-water text-blue-400",
      bgGradient: "from-sky-400 to-indigo-600",
      character: "💧",
      message: "Stay fresh and cool with plenty of clean water every day!",
      videoUrl: "https://www.youtube.com/embed/3PmVJQUCm4s",
      isVideoFile: false
    }
  ],
  appointments: [
    { id: "APT-101", childName: "Sample Child", age: "8 yrs", date: "2026-10-30", time: "10:00 AM", reason: "Annual Growth Check", status: "Approved" },
    { id: "APT-102", childName: "Aarav Sharma", age: "5 yrs", date: "2026-11-04", time: "02:30 PM", reason: "Seasonal Vaccine Booster", status: "Pending" }
  ],
  patientRecords: {
    "Sample Child": {
      childName: "Sample Child",
      age: "8 Years",
      gender: "Male",
      visitDate: "2026-10-30",
      parentName: "Parent Guardian",
      reportReleased: true,
      vitals: { temp: "36.8 °C", hr: "90 BPM", weight: "26 kg", height: "128 cm", spO2: "98%", respRate: "20/min", bp: "100/65 mmHg", bmi: "15.9 kg/m²" },
      diagnosis: "Pediatric Preliminary Health Screening — Normal healthy ranges.",
      aiSuggestions: ["Maintain balanced diet with leafy vegetables & milk.", "Regular physical play and annual checkup recommended.", "Stay hydrated with 1.5 - 2 liters of water daily."]
    },
    "Aarav Sharma": {
      childName: "Aarav Sharma",
      age: "5 Years",
      gender: "Male",
      visitDate: "2026-10-28",
      parentName: "Rohit Sharma",
      reportReleased: true,
      vitals: { temp: "37.0 °C", hr: "96 BPM", weight: "19 kg", height: "110 cm", spO2: "99%", respRate: "22/min", bp: "95/60 mmHg", bmi: "15.7 kg/m²" },
      diagnosis: "Mild seasonal congestion — Clear chest sounds, good oxygenation.",
      aiSuggestions: ["Warm fluid intake and steam inhalation as needed.", "Continue multivitamins and adequate rest."]
    }
  },
  bills: [
    { id: "BILL-901", childName: "Sample Child", date: "2026-10-30", service: "Pediatric Telemetry & Consultation", amount: "₹ 850", status: "Released & Paid", receiptNo: "REC-5582" },
    { id: "BILL-902", childName: "Aarav Sharma", date: "2026-10-28", service: "Pediatric Vitals Check & Booster", amount: "₹ 600", status: "Released & Paid", receiptNo: "REC-5583" }
  ]
};

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  return initialDb;
}

function writeDb(data: typeof initialDb) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

// Initialize db
let database = readDb();

// Setup Gemini AI client if GEMINI_API_KEY is available
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI();
  } catch (err) {
    console.warn('Gemini client initialization failed:', err);
  }
}

// REST API ROUTES
app.get('/api/db', (req, res) => {
  database = readDb();
  res.json(database);
});

// Single or multiple video file upload endpoint for admin
app.post('/api/upload-video', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }
  const relativeUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url: relativeUrl,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
    isVideoFile: true,
  });
});

// Add or update Interactive Vitals Guide video
app.post('/api/videos/vitals', (req, res) => {
  database = readDb();
  const { category, title, videoUrl, isVideoFile, paramKey, unit, defaultVal, mode, targetIndex } = req.body;
  if (!category || !videoUrl) {
    return res.status(400).json({ error: 'Category and videoUrl are required' });
  }

  let finalUrl = videoUrl;
  if (!isVideoFile && finalUrl.includes('watch?v=')) {
    finalUrl = finalUrl.replace('watch?v=', 'embed/');
  }

  const finalTitle = title || `${category} Check Video`;
  const finalParamKey = paramKey || category.toLowerCase().replace(/[^a-z0-9]/g, '') || 'custom';
  const finalUnit = unit || (category === 'Temperature' ? '°C' : category === 'Weight' ? 'kg' : 'unit');

  // If a specific targetIndex is specified
  if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < database.vitalsVideos.length) {
    database.vitalsVideos[targetIndex] = {
      ...database.vitalsVideos[targetIndex],
      category,
      title: finalTitle,
      videoUrl: finalUrl,
      isVideoFile: !!isVideoFile,
      paramKey: database.vitalsVideos[targetIndex].paramKey || finalParamKey,
      unit: database.vitalsVideos[targetIndex].unit || finalUnit,
      defaultVal: defaultVal || database.vitalsVideos[targetIndex].defaultVal || '0',
    };
  } else if (mode !== 'add_new') {
    // Default: update matching existing category if found, else push new
    const existingIdx = database.vitalsVideos.findIndex(
      (v: { category: string }) => v.category.trim().toLowerCase() === category.trim().toLowerCase()
    );

    if (existingIdx >= 0) {
      database.vitalsVideos[existingIdx] = {
        ...database.vitalsVideos[existingIdx],
        title: finalTitle,
        videoUrl: finalUrl,
        isVideoFile: !!isVideoFile,
        defaultVal: defaultVal || database.vitalsVideos[existingIdx].defaultVal || '0',
      };
    } else {
      database.vitalsVideos.push({
        category,
        title: finalTitle,
        videoUrl: finalUrl,
        isVideoFile: !!isVideoFile,
        paramKey: finalParamKey,
        unit: finalUnit,
        defaultVal: defaultVal || '0',
      });
    }
  } else {
    // Explicitly add as a new vital step
    database.vitalsVideos.push({
      category,
      title: finalTitle,
      videoUrl: finalUrl,
      isVideoFile: !!isVideoFile,
      paramKey: finalParamKey,
      unit: finalUnit,
      defaultVal: defaultVal || '0',
    });
  }

  writeDb(database);
  res.json({ success: true, vitalsVideos: database.vitalsVideos });
});

// Delete a vitals guide video
app.delete('/api/videos/vitals/:index', (req, res) => {
  database = readDb();
  const idx = parseInt(req.params.index, 10);
  if (isNaN(idx) || idx < 0 || idx >= database.vitalsVideos.length) {
    return res.status(404).json({ error: 'Index out of bounds' });
  }
  database.vitalsVideos.splice(idx, 1);
  writeDb(database);
  res.json({ success: true, vitalsVideos: database.vitalsVideos });
});

// Add new Cartoon Health video
app.post('/api/videos/cartoon', (req, res) => {
  database = readDb();
  const { title, message, videoUrl, isVideoFile, character, icon, bgGradient } = req.body;
  if (!title || !message || !videoUrl) {
    return res.status(400).json({ error: 'Title, message, and videoUrl are required' });
  }

  let finalUrl = videoUrl;
  if (!isVideoFile && finalUrl.includes('watch?v=')) {
    finalUrl = finalUrl.replace('watch?v=', 'embed/');
  }

  const newCartoonStory = {
    title,
    character: character || '🐻',
    message,
    videoUrl: finalUrl,
    isVideoFile: !!isVideoFile,
    icon: icon || 'fa-film text-amber-400',
    bgGradient: bgGradient || 'from-amber-400 to-orange-500',
  };

  database.cartoonStories.push(newCartoonStory);
  writeDb(database);
  res.json({ success: true, cartoonStories: database.cartoonStories });
});

// Delete a cartoon video
app.delete('/api/videos/cartoon/:index', (req, res) => {
  database = readDb();
  const idx = parseInt(req.params.index, 10);
  if (isNaN(idx) || idx < 0 || idx >= database.cartoonStories.length) {
    return res.status(404).json({ error: 'Index out of bounds' });
  }
  database.cartoonStories.splice(idx, 1);
  writeDb(database);
  res.json({ success: true, cartoonStories: database.cartoonStories });
});

// Save/Update patient vitals & record
app.post('/api/patient-records', (req, res) => {
  database = readDb();
  const record = req.body;
  if (!record || !record.childName) {
    return res.status(400).json({ error: 'Child name is required' });
  }

  database.patientRecords[record.childName] = {
    childName: record.childName,
    age: record.age || '8 Years',
    gender: record.gender || 'Male',
    visitDate: record.visitDate || new Date().toISOString().split('T')[0],
    parentName: record.parentName || 'Parent Guardian',
    reportReleased: record.reportReleased !== undefined ? record.reportReleased : true,
    vitals: record.vitals || {},
    diagnosis: record.diagnosis || 'Pediatric Health Screening — All vitals recorded.',
    aiSuggestions: record.aiSuggestions || [
      'Maintain adequate hydration with clean water.',
      'Promote nutrient-rich meals and regular active play.',
      'Follow up for routine growth check in 6 months.',
    ],
  };

  // Sync active child details
  database.childDetails = {
    name: record.childName,
    age: record.age || '8 Years',
    gender: record.gender || 'Male',
  };

  writeDb(database);
  res.json({ success: true, record: database.patientRecords[record.childName] });
});

// Toggle report release status
app.patch('/api/patient-records/:name/toggle-release', (req, res) => {
  database = readDb();
  const childName = req.params.name;
  if (!database.patientRecords[childName]) {
    return res.status(404).json({ error: 'Patient record not found' });
  }
  database.patientRecords[childName].reportReleased = !database.patientRecords[childName].reportReleased;
  writeDb(database);
  res.json({
    success: true,
    reportReleased: database.patientRecords[childName].reportReleased,
  });
});

// Add parent account
app.post('/api/parent-accounts', (req, res) => {
  database = readDb();
  const { username, childName, pin } = req.body;
  if (!username || !childName) {
    return res.status(400).json({ error: 'Username and childName are required' });
  }

  const existingIndex = database.parentAccounts.findIndex((a: { username: string }) => a.username === username);
  if (existingIndex >= 0) {
    database.parentAccounts[existingIndex] = { username, childName, pin: pin || '1234' };
  } else {
    database.parentAccounts.push({ username, childName, pin: pin || '1234' });
  }

  // If patient record doesn't exist for child, create a starter one
  if (!database.patientRecords[childName]) {
    database.patientRecords[childName] = {
      childName,
      age: '7 Years',
      gender: 'Child',
      visitDate: new Date().toISOString().split('T')[0],
      parentName: username,
      reportReleased: true,
      vitals: {
        temp: '36.7 °C',
        hr: '88 BPM',
        spO2: '99%',
        respRate: '19/min',
        bp: '98/62 mmHg',
        weight: '24 kg',
        height: '124 cm',
        bmi: '15.6 kg/m²',
      },
      diagnosis: 'Initial Pediatric Registration — Ready for vitals telemetry.',
      aiSuggestions: ['Perform interactive vitals in Kids Adventure Zone.', 'Keep emergency numbers handy.'],
    };
  }

  writeDb(database);
  res.json({ success: true, parentAccounts: database.parentAccounts });
});

// Delete parent account
app.delete('/api/parent-accounts/:username', (req, res) => {
  database = readDb();
  database.parentAccounts = database.parentAccounts.filter((a: { username: string }) => a.username !== req.params.username);
  writeDb(database);
  res.json({ success: true, parentAccounts: database.parentAccounts });
});

// Add appointment
app.post('/api/appointments', (req, res) => {
  database = readDb();
  const { childName, age, date, time, reason } = req.body;
  const newApt = {
    id: `APT-${100 + database.appointments.length + 1}`,
    childName: childName || 'Sample Child',
    age: age || '8 yrs',
    date: date || new Date().toISOString().split('T')[0],
    time: time || '11:00 AM',
    reason: reason || 'Routine Checkup',
    status: 'Pending',
  };
  database.appointments.push(newApt);
  writeDb(database);
  res.json({ success: true, appointments: database.appointments, appointment: newApt });
});

// Update appointment status
app.patch('/api/appointments/:id/status', (req, res) => {
  database = readDb();
  const apt = database.appointments.find((a: { id: string }) => a.id === req.params.id);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  apt.status = req.body.status || 'Approved';
  writeDb(database);
  res.json({ success: true, appointments: database.appointments });
});

// Add bill
app.post('/api/bills', (req, res) => {
  database = readDb();
  const { childName, service, amount, status } = req.body;
  const newBill = {
    id: `BILL-${900 + database.bills.length + 1}`,
    receiptNo: `REC-${5500 + database.bills.length + 1}`,
    childName: childName || 'Sample Child',
    date: new Date().toISOString().split('T')[0],
    service: service || 'Pediatric Consultation',
    amount: amount || '₹ 500',
    status: status || 'Released & Paid',
  };
  database.bills.push(newBill);
  writeDb(database);
  res.json({ success: true, bills: database.bills });
});

// Update bill status
app.patch('/api/bills/:id/status', (req, res) => {
  database = readDb();
  const bill = database.bills.find((b: { id: string }) => b.id === req.params.id);
  if (!bill) {
    return res.status(404).json({ error: 'Bill not found' });
  }
  bill.status = req.body.status || 'Released & Paid';
  writeDb(database);
  res.json({ success: true, bills: database.bills });
});

// Update marquee banner message
app.post('/api/marquee', (req, res) => {
  database = readDb();
  if (req.body.message) {
    database.marqueeMessage = req.body.message;
    writeDb(database);
  }
  res.json({ success: true, marqueeMessage: database.marqueeMessage });
});

// LittleCare Pediatric AI Chatbot endpoint for parents
app.post('/api/ai-chat', async (req, res) => {
  const { message, childName, childVitals } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // If Gemini API is available, generate response
  if (aiClient && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are "LittleCare Pediatric Assistant" by MediFirst. You provide kind, evidence-based, pediatric clinical advice to parents.
Child Name: ${childName || 'Child'}
Current Vitals: ${JSON.stringify(childVitals || {})}
Parent question: "${message}"

Keep response reassuring, accurate, concise (2-4 bullet points or short paragraphs), highlight any red flags (fever >38.5°C, breathing difficulty, lethargy), and always remind that for emergency symptoms call 112 immediately.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return res.json({ reply: response.text });
    } catch (err) {
      console.error('Gemini API call failed, using fallback:', err);
    }
  }

  // Expert pediatric knowledge fallback
  const lower = message.toLowerCase();
  let reply = '';
  if (lower.includes('fever') || lower.includes('temperature') || lower.includes('hot')) {
    reply = `🌡️ **Pediatric Fever Care:**
• Normal body temperature in children is 36.5°C – 37.5°C (97.7°F – 99.5°F).
• Keep your child hydrated with water, clear soups, ORS, or breastmilk.
• Dress child in light, breathable cotton clothes. Avoid cold-water baths; lukewarm sponge baths may be used if needed.
• ⚠️ Consult emergency if fever exceeds 38.5°C (101.3°F), lasts >3 days, or if child shows convulsions or extreme lethargy.`;
  } else if (lower.includes('heart') || lower.includes('pulse') || lower.includes('bpm')) {
    reply = `💓 **Heart Rate & Telemetry Guide:**
• Normal resting heart rate for children aged 5–10 years ranges between 70 to 110 BPM.
• Activity, excitement, or mild fever naturally increases heart rate.
• If resting rate remains above 140 BPM with shortness of breath or dizziness, notify pediatric triage immediately.`;
  } else if (lower.includes('cough') || lower.includes('cold') || lower.includes('breath')) {
    reply = `🌬️ **Respiratory Health:**
• Normal respiratory rate for school-age children is 18–25 breaths/min. Oxygen saturation (SpO2) should ideally be 95%–100%.
• Offer warm fluids, honey (for children > 1 year), and mild saline nasal drops for stuffy noses.
• ⚠️ Seek urgent care if you notice chest retractions (ribs pulling in), wheezing, or bluish lips.`;
  } else if (lower.includes('food') || lower.includes('diet') || lower.includes('nutrition') || lower.includes('eat')) {
    reply = `🥗 **Pediatric Nutrition Advice:**
• Encourage colorful fruits, vegetables, dairy or fortified plant milk, whole grains, and lean proteins.
• Limit sugary beverages and packaged snacks.
• Ensure adequate daily water intake (approx. 1.5 liters for school-age kids).`;
  } else {
    reply = `🐻 **LittleCare Pediatric Guidance:**
Thank you for reaching out!
• Your child's recorded vitals are monitored in MediFirst's electronic telemetry database.
• For routine questions, ensure good hydration, balanced nutrition, and up-to-date vaccinations.
• For any sudden illness or severe respiratory discomfort, call 112 or visit our emergency desk immediately.`;
  }

  res.json({ reply });
});

// Start dev Vite server or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
