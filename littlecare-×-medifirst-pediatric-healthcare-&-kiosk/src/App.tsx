import { useState, useEffect } from 'react';
import { AppData, Language, ViewMode } from './types';
import { Navbar } from './components/Navbar';
import { MarqueeBanner } from './components/MarqueeBanner';
import { EmergencyModal } from './components/EmergencyModal';
import { RoleSelection } from './components/RoleSelection';
import { KidsPortal } from './components/KidsPortal';
import { ParentLogin } from './components/ParentLogin';
import { ParentPortal } from './components/ParentPortal';
import { AdminPortal } from './components/AdminPortal';

const defaultFallbackData: AppData = {
  marqueeMessage:
    '🌟 Welcome to LittleCare × MediFirst! Wash hands with Sparky, stay hydrated during fever, and enjoy happy doctor visits! ✨',
  parentAccounts: [
    { username: 'parent_sample', childName: 'Sample Child', pin: '1234' },
    { username: 'parent_aarav', childName: 'Aarav Sharma', pin: '1234' },
  ],
  currentLoggedInParent: 'parent_sample',
  childDetails: { name: 'Sample Child', age: '8 Years', gender: 'Male' },
  vitalsVideos: [
    {
      category: 'Temperature',
      title: 'Friendly Forehead Temp Check',
      videoUrl: 'https://www.youtube.com/embed/3PmVJQUCm4s',
      isVideoFile: false,
      paramKey: 'temp',
      unit: '°C',
      defaultVal: '36.8',
    },
    {
      category: 'Heart Rate',
      title: 'Happy Heartbeat Drum',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      isVideoFile: false,
      paramKey: 'hr',
      unit: 'BPM',
      defaultVal: '90',
    },
    {
      category: 'Oxygen Saturation',
      title: 'SpO2 Magic Star',
      videoUrl: 'https://www.youtube.com/embed/3PmVJQUCm4s',
      isVideoFile: false,
      paramKey: 'spO2',
      unit: '%',
      defaultVal: '98',
    },
    {
      category: 'Respiratory Rate',
      title: 'Breathing Butterfly',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      isVideoFile: false,
      paramKey: 'respRate',
      unit: '/min',
      defaultVal: '20',
    },
    {
      category: 'Blood Pressure',
      title: 'Bouncy Arm Band',
      videoUrl: 'https://www.youtube.com/embed/3PmVJQUCm4s',
      isVideoFile: false,
      paramKey: 'bp',
      unit: 'mmHg',
      defaultVal: '100/65',
    },
    {
      category: 'Weight',
      title: 'Weighing Star Scale',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      isVideoFile: false,
      paramKey: 'weight',
      unit: 'kg',
      defaultVal: '26',
    },
    {
      category: 'Height',
      title: 'Giraffe Height Ruler',
      videoUrl: 'https://www.youtube.com/embed/3PmVJQUCm4s',
      isVideoFile: false,
      paramKey: 'height',
      unit: 'cm',
      defaultVal: '128',
    },
  ],
  cartoonStories: [
    {
      title: 'Sparky the Super Soap!',
      icon: 'fa-soap text-cyan-400',
      bgGradient: 'from-cyan-400 to-blue-600',
      character: '🫧',
      message: 'Hello little friend! I am Sparky the Soap. Bubble away the germs!',
      videoUrl: 'https://www.youtube.com/embed/3PmVJQUCm4s',
      isVideoFile: false,
    },
    {
      title: "Dr. Bear's Stethoscope Song",
      icon: 'fa-heart-pulse text-rose-400',
      bgGradient: 'from-rose-400 to-pink-600',
      character: '🐻',
      message: 'Listen to the thump-thump of your strong happy heart!',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      isVideoFile: false,
    },
    {
      title: 'Water Drops & Healthy Sipping',
      icon: 'fa-bottle-water text-blue-400',
      bgGradient: 'from-sky-400 to-indigo-600',
      character: '💧',
      message: 'Stay fresh and cool with plenty of clean water every day!',
      videoUrl: 'https://www.youtube.com/embed/3PmVJQUCm4s',
      isVideoFile: false,
    },
  ],
  appointments: [
    {
      id: 'APT-101',
      childName: 'Sample Child',
      age: '8 yrs',
      date: '2026-10-30',
      time: '10:00 AM',
      reason: 'Annual Growth Check',
      status: 'Approved',
    },
    {
      id: 'APT-102',
      childName: 'Aarav Sharma',
      age: '5 yrs',
      date: '2026-11-04',
      time: '02:30 PM',
      reason: 'Seasonal Vaccine Booster',
      status: 'Pending',
    },
  ],
  patientRecords: {
    'Sample Child': {
      childName: 'Sample Child',
      age: '8 Years',
      gender: 'Male',
      visitDate: '2026-10-30',
      parentName: 'Parent Guardian',
      reportReleased: true,
      vitals: {
        temp: '36.8 °C',
        hr: '90 BPM',
        weight: '26 kg',
        height: '128 cm',
        spO2: '98%',
        respRate: '20/min',
        bp: '100/65 mmHg',
        bmi: '15.9 kg/m²',
      },
      diagnosis: 'Pediatric Preliminary Health Screening — Normal healthy ranges.',
      aiSuggestions: [
        'Maintain balanced diet with leafy vegetables & milk.',
        'Regular physical play and annual checkup recommended.',
        'Stay hydrated with 1.5 - 2 liters of water daily.',
      ],
    },
  },
  bills: [
    {
      id: 'BILL-901',
      childName: 'Sample Child',
      date: '2026-10-30',
      service: 'Pediatric Telemetry & Consultation',
      amount: '₹ 850',
      status: 'Released & Paid',
      receiptNo: 'REC-5582',
    },
  ],
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('roleSelection');
  const [lang, setLang] = useState<Language>('en');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState<boolean>(false);
  const [data, setData] = useState<AppData>(defaultFallbackData);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load state from backend on mount
  useEffect(() => {
    fetch('/api/db')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('API request failed');
      })
      .then((json) => {
        if (json && json.vitalsVideos && json.cartoonStories) {
          setData(json);
        }
      })
      .catch((err) => {
        console.warn('Using local fallback data:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Theme toggle
  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      const html = document.documentElement;
      if (next) {
        html.classList.add('dark');
        html.classList.remove('light');
      } else {
        html.classList.remove('dark');
        html.classList.add('light');
      }
      return next;
    });
  };

  const handleUpdateData = (newData: Partial<AppData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const handleParentLoginSuccess = (selectedChild: string) => {
    handleUpdateData({
      childDetails: {
        name: selectedChild,
        age: data.patientRecords[selectedChild]?.age || '8 Years',
        gender: data.patientRecords[selectedChild]?.gender || 'Male',
      },
    });
    setCurrentView('parentPortal');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B132B] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* NAVBAR */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        lang={lang}
        onLanguageChange={setLang}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
      />

      {/* MARQUEE BANNER */}
      <MarqueeBanner message={data.marqueeMessage} />

      {/* EMERGENCY MODAL */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        lang={lang}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-grow flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full">
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center p-12">
            <div className="text-center space-y-3">
              <i className="fa-solid fa-spinner fa-spin text-4xl text-[#176B87]"></i>
              <p className="font-bold text-sm text-slate-500 kids-font">
                Connecting to MediFirst Telemetry Network...
              </p>
            </div>
          </div>
        ) : (
          <>
            {currentView === 'roleSelection' && (
              <RoleSelection onNavigate={setCurrentView} lang={lang} />
            )}

            {currentView === 'kidsPortal' && (
              <KidsPortal
                data={data}
                onUpdateData={handleUpdateData}
                onNavigate={setCurrentView}
                lang={lang}
              />
            )}

            {currentView === 'parentLogin' && (
              <ParentLogin
                data={data}
                onLoginSuccess={handleParentLoginSuccess}
                onNavigate={setCurrentView}
                lang={lang}
              />
            )}

            {currentView === 'parentPortal' && (
              <ParentPortal
                data={data}
                onUpdateData={handleUpdateData}
                onNavigate={setCurrentView}
                lang={lang}
              />
            )}

            {currentView === 'adminPortal' && (
              <AdminPortal
                data={data}
                onUpdateData={handleUpdateData}
                onNavigate={setCurrentView}
                lang={lang}
              />
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-[#1C2541] border-t border-slate-200 dark:border-slate-800 py-3.5 px-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto">
        <p>
          LittleCare × MediFirst Pediatric Kiosk v6.2 — 3-Access Portal (Kids, Parent, Admin).
        </p>
      </footer>
    </div>
  );
}
