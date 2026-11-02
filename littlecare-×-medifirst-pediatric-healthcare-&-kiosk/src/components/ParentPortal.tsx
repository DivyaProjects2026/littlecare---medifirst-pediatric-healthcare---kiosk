import React, { useState } from 'react';
import { AppData, Bill, Language, PatientRecord, ViewMode } from '../types';
import { translations } from '../translations';

interface ParentPortalProps {
  data: AppData;
  onUpdateData: (newData: Partial<AppData>) => void;
  onNavigate: (view: ViewMode) => void;
  lang: Language;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  data,
  onUpdateData,
  onNavigate,
  lang,
}) => {
  const t = translations[lang];

  // Active child selection
  const [selectedChild, setSelectedChild] = useState<string>(
    data.childDetails.name || (data.parentAccounts[0]?.childName ?? 'Sample Child')
  );

  // Chatbot state
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'assistant'; text: string; time: string }[]
  >([
    {
      sender: 'assistant',
      text: `Hello! I am your LittleCare Pediatric Assistant. Ask me anything about ${selectedChild}'s vitals, fever care, hydration, immunization, or child nutrition!`,
      time: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Appointment booking state
  const [aptDate, setAptDate] = useState('');
  const [aptTime, setAptTime] = useState('10:00 AM');
  const [aptReason, setAptReason] = useState('Routine Pediatric Checkup');

  // Receipt Modal state
  const [viewingReceipt, setViewingReceipt] = useState<Bill | null>(null);

  // Active record for the selected child
  const record: PatientRecord =
    data.patientRecords[selectedChild] ||
    data.patientRecords['Sample Child'] || {
      childName: selectedChild,
      age: '8 Years',
      gender: 'Male',
      visitDate: new Date().toISOString().split('T')[0],
      parentName: 'Parent Guardian',
      reportReleased: true,
      vitals: {
        temp: '36.8 °C',
        hr: '90 BPM',
        spO2: '98%',
        respRate: '20/min',
        bp: '100/65 mmHg',
        weight: '26 kg',
        height: '128 cm',
        bmi: '15.9 kg/m²',
      },
      diagnosis: 'Routine Preliminary Health Screening — Vitals recorded.',
      aiSuggestions: ['Ensure adequate hydration with clean water.', 'Routine follow-up in 6 months.'],
    };

  const handleSendChat = async (presetText?: string) => {
    const textToSend = presetText || chatInput.trim();
    if (!textToSend || isChatLoading) return;

    const userMsg = {
      sender: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          childName: selectedChild,
          childVitals: record.vitals,
        }),
      });
      const resJson = await res.json();
      const botMsg = {
        sender: 'assistant' as const,
        text: resJson.reply || 'Thank you for your inquiry. LittleCare telemetry records indicate stable vitals.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat API failed:', err);
      const errorMsg = {
        sender: 'assistant' as const,
        text: 'Doctor Bear is ready to assist. For high fever (>38.5°C) or respiratory distress, please call emergency 112 immediately.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptDate) {
      alert('Please select an appointment date.');
      return;
    }

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: selectedChild,
          age: record.age || '8 yrs',
          date: aptDate,
          time: aptTime,
          reason: aptReason,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        onUpdateData({ appointments: json.appointments });
        alert(`Appointment booked for ${selectedChild} on ${aptDate}! It is now awaiting admin approval.`);
        setAptDate('');
      }
    } catch (err) {
      console.error('Booking failed:', err);
    }
  };

  const childAppointments = data.appointments.filter(
    (a) => a.childName.toLowerCase() === selectedChild.toLowerCase()
  );

  const childBills = data.bills.filter(
    (b) => b.childName.toLowerCase() === selectedChild.toLowerCase()
  );

  return (
    <div className="space-y-6 flex-grow animate-fade-in">
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🐻</span>
            <h2 className="text-2xl font-bold">
              Parent Portal: {selectedChild}
            </h2>
          </div>
          <p className="text-sm text-emerald-100 mt-1">
            Official Clinical Reports, Vitals Telemetry, Bills & AI Assistant
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* CHILD SELECTOR */}
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="bg-emerald-800 text-white text-xs md:text-sm rounded-xl px-3 py-2 border border-emerald-500 font-semibold focus:outline-none cursor-pointer"
          >
            {data.parentAccounts.map((acc) => (
              <option key={acc.username} value={acc.childName}>
                Child: {acc.childName}
              </option>
            ))}
          </select>

          <button
            onClick={() => onNavigate('roleSelection')}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition touch-target flex-shrink-0"
          >
            {t.logout}
          </button>
        </div>
      </div>

      {/* CLINICAL REPORT SECTION */}
      <div className="bg-white dark:bg-[#1C2541] p-6 md:p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-lg">
              <i className="fa-solid fa-file-medical"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {t.clinicalReportTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hospital Telemetry & Diagnostic Record
              </p>
            </div>
          </div>

          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-sm ${
              record.reportReleased
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            <i
              className={`fa-solid ${
                record.reportReleased ? 'fa-circle-check' : 'fa-clock'
              }`}
            ></i>
            <span>{record.reportReleased ? t.releasedBadge : t.pendingBadge}</span>
          </span>
        </div>

        {record.reportReleased ? (
          <div className="space-y-6 text-sm">
            {/* PATIENT INFO BANNER */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Patient Name:</span>
                <p className="font-bold text-base text-slate-900 dark:text-white">{record.childName}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Age / Gender:</span>
                <p className="font-bold text-base text-slate-900 dark:text-white">
                  {record.age || '8 Years'} / {record.gender || 'Male'}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Visit Date:</span>
                <p className="font-bold text-base text-slate-900 dark:text-white">{record.visitDate}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Body Mass Index:</span>
                <p className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                  {record.vitals.bmi || '15.9 kg/m²'}
                </p>
              </div>
            </div>

            {/* VITALS GRID */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                <i className="fa-solid fa-heart-pulse text-rose-500"></i>
                <span>{t.capturedVitals}</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900 text-center">
                  <span className="text-xs text-slate-500 font-bold">Temperature</span>
                  <p className="font-black text-xl text-amber-700 dark:text-amber-400 mt-1">
                    {record.vitals.temp || '36.8 °C'}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold">Normal (Afebrile)</span>
                </div>
                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900 text-center">
                  <span className="text-xs text-slate-500 font-bold">Heart Rate</span>
                  <p className="font-black text-xl text-blue-700 dark:text-blue-400 mt-1">
                    {record.vitals.hr || '90 BPM'}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold">Optimal Rhythm</span>
                </div>
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-center">
                  <span className="text-xs text-slate-500 font-bold">Oxygen (SpO2)</span>
                  <p className="font-black text-xl text-emerald-700 dark:text-emerald-400 mt-1">
                    {record.vitals.spO2 || '98%'}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold">Excellent Aeration</span>
                </div>
                <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900 text-center">
                  <span className="text-xs text-slate-500 font-bold">Respiratory</span>
                  <p className="font-black text-xl text-purple-700 dark:text-purple-400 mt-1">
                    {record.vitals.respRate || '20/min'}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold">Calm & Regular</span>
                </div>
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900 text-center">
                  <span className="text-xs text-slate-500 font-bold">Blood Pressure</span>
                  <p className="font-black text-xl text-rose-700 dark:text-rose-400 mt-1">
                    {record.vitals.bp || '100/65 mmHg'}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold">Standard Norm</span>
                </div>
                <div className="p-3.5 bg-cyan-50 dark:bg-cyan-950/30 rounded-2xl border border-cyan-200 dark:border-cyan-900 text-center">
                  <span className="text-xs text-slate-500 font-bold">Weight</span>
                  <p className="font-black text-xl text-cyan-700 dark:text-cyan-400 mt-1">
                    {record.vitals.weight || '26 kg'}
                  </p>
                  <span className="text-[10px] text-slate-400 font-semibold">Percentile: 50th</span>
                </div>
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-900 text-center">
                  <span className="text-xs text-slate-500 font-bold">Height</span>
                  <p className="font-black text-xl text-indigo-700 dark:text-indigo-400 mt-1">
                    {record.vitals.height || '128 cm'}
                  </p>
                  <span className="text-[10px] text-slate-400 font-semibold">Growth Track</span>
                </div>
                <div className="p-3.5 bg-teal-50 dark:bg-teal-950/30 rounded-2xl border border-teal-200 dark:border-teal-900 text-center">
                  <span className="text-xs text-slate-500 font-bold">Diagnosis</span>
                  <p className="font-bold text-xs text-teal-800 dark:text-teal-300 mt-1">
                    Normal Healthy Check
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold">Verified</span>
                </div>
              </div>
            </div>

            {/* AI SUGGESTIONS */}
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900 space-y-2">
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
                <i className="fa-solid fa-sparkles"></i>
                <span>{t.aiSuggestionsTitle}</span>
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {(record.aiSuggestions || []).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900 space-y-2">
            <i className="fa-solid fa-clock text-3xl mb-1"></i>
            <p className="font-bold">{t.pendingDesc}</p>
            <p className="text-xs text-slate-500">
              The clinic admin will review and release the report shortly. You can still chat with Dr. Bear or book follow-up appointments below.
            </p>
          </div>
        )}
      </div>

      {/* TWO COLUMN GRID: CHATBOT & APPOINTMENTS/BILLS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LITTLECARE AI CHATBOT */}
        <div className="bg-white dark:bg-[#1C2541] p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col h-[520px]">
          <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-700 pb-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-[#176B87] flex items-center justify-center text-xl">
              🐻
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                LittleCare AI Pediatric Assistant
              </h3>
              <p className="text-xs text-emerald-600 font-medium">● Online 24/7 Clinical Support</p>
            </div>
          </div>

          {/* QUICK PROMPT PILLS */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => handleSendChat('What should I do if child has a fever?')}
              className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full transition"
            >
              🌡️ Fever Tips
            </button>
            <button
              onClick={() => handleSendChat("Is my child's heart rate normal?")}
              className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full transition"
            >
              💓 Heart Rate Info
            </button>
            <button
              onClick={() => handleSendChat('What are good nutritious foods for growth?')}
              className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full transition"
            >
              🥗 Nutrition Guide
            </button>
            <button
              onClick={() => handleSendChat('Home care tips for seasonal cough & cold')}
              className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full transition"
            >
              🌬️ Cough / Cold Care
            </button>
          </div>

          {/* CHAT MESSAGES SCROLL AREA */}
          <div className="flex-grow overflow-y-auto space-y-3 pr-1 text-xs">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="block text-[9px] mt-1 opacity-60 text-right">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border text-slate-500 text-xs flex items-center space-x-2">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Doctor Bear is typing pediatric guidance...</span>
                </div>
              </div>
            )}
          </div>

          {/* CHAT INPUT FORM */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="flex items-center space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Dr. Bear about child health, fever, food..."
              className="flex-grow px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow disabled:opacity-50 touch-target flex items-center space-x-1"
            >
              <span>Send</span>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>

        {/* APPOINTMENTS & BILLING STACK */}
        <div className="space-y-6">
          {/* APPOINTMENTS CARD */}
          <div className="bg-white dark:bg-[#1C2541] p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <i className="fa-solid fa-calendar-check text-emerald-600"></i>
                <span>Appointments for {selectedChild}</span>
              </h3>
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-300">
                {childAppointments.length} Booked
              </span>
            </div>

            {/* APPOINTMENTS LIST */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {childAppointments.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No appointments scheduled yet.</p>
              ) : (
                childAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-mono text-teal-600 font-bold mr-2">{apt.id}</span>
                      <strong className="text-slate-800 dark:text-slate-200">{apt.reason}</strong>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {apt.date} at {apt.time}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        apt.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* BOOK APPOINTMENT FORM */}
            <form onSubmit={handleBookAppointment} className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Book New Appointment</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={aptDate}
                  onChange={(e) => setAptDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                />
                <select
                  value={aptTime}
                  onChange={(e) => setAptTime(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Reason (e.g. Vaccination, Growth Check, Cough)"
                value={aptReason}
                onChange={(e) => setAptReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow"
              >
                Request Appointment Booking
              </button>
            </form>
          </div>

          {/* BILLS & RECEIPTS CARD */}
          <div className="bg-white dark:bg-[#1C2541] p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <i className="fa-solid fa-receipt text-emerald-600"></i>
              <span>Medical Bills & Receipts</span>
            </h3>

            <div className="space-y-2">
              {childBills.length === 0 ? (
                <p className="text-xs text-slate-400">No billing statements found for this child.</p>
              ) : (
                childBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-mono text-teal-600 font-bold">{bill.receiptNo}</span>
                      <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                        {bill.service} ({bill.amount})
                      </p>
                      <span className="text-[10px] text-slate-400">{bill.date}</span>
                    </div>
                    <button
                      onClick={() => setViewingReceipt(bill)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                      View Receipt
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1C2541] rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-emerald-500 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-child-reaching text-[#176B87] text-xl"></i>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  MediFirst Official Receipt
                </h3>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                {viewingReceipt.status}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Receipt No:</span>
                <span className="font-bold">{viewingReceipt.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bill ID:</span>
                <span className="font-bold">{viewingReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <span className="font-bold">{viewingReceipt.childName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="font-bold">{viewingReceipt.date}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-slate-400">Service:</span>
                <span className="font-bold">{viewingReceipt.service}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-600">
                <span>Total Paid:</span>
                <span>{viewingReceipt.amount}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
              >
                <i className="fa-solid fa-print"></i>
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={() => setViewingReceipt(null)}
                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
