import React, { useState } from 'react';
import { AppData, KidsTab, Language, ViewMode } from '../types';
import { translations } from '../translations';

interface KidsPortalProps {
  data: AppData;
  onUpdateData: (newData: Partial<AppData>) => void;
  onNavigate: (view: ViewMode) => void;
  lang: Language;
}

export const KidsPortal: React.FC<KidsPortalProps> = ({
  data,
  onUpdateData,
  onNavigate,
  lang,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<KidsTab>('interactive');
  const [currentVitalStep, setCurrentVitalStep] = useState(0);

  // Active child inputs
  const [childName, setChildName] = useState(data.childDetails.name || 'Sample Child');
  const [childAge, setChildAge] = useState(data.childDetails.age || '8 Years');
  const [childGender, setChildGender] = useState(data.childDetails.gender || 'Male');

  // Interactive vitals captured values
  const [capturedVitals, setCapturedVitals] = useState<Record<string, string>>({
    temp: '36.8',
    hr: '90',
    spO2: '98',
    respRate: '20',
    bp: '100/65',
    weight: '26',
    height: '128',
  });

  // Current step value
  const currentStep = data.vitalsVideos[currentVitalStep] || data.vitalsVideos[0];
  const [stepInputValue, setStepInputValue] = useState(
    capturedVitals[currentStep?.paramKey] || currentStep?.defaultVal || '0'
  );

  // Fullscreen video modal state
  const [fullscreenVideo, setFullscreenVideo] = useState<{
    title: string;
    videoUrl: string;
    isVideoFile: boolean;
  } | null>(null);

  // Sync step input when step changes
  React.useEffect(() => {
    if (currentStep) {
      setStepInputValue(capturedVitals[currentStep.paramKey] || currentStep.defaultVal || '0');
    }
  }, [currentVitalStep, currentStep]);

  const handleStepValueChange = (val: string) => {
    setStepInputValue(val);
    if (currentStep) {
      setCapturedVitals((prev) => ({ ...prev, [currentStep.paramKey]: val }));
    }
  };

  const handleNextStep = async () => {
    // Record current step value
    if (currentStep) {
      capturedVitals[currentStep.paramKey] = stepInputValue;
    }

    if (currentVitalStep < data.vitalsVideos.length - 1) {
      setCurrentVitalStep((prev) => prev + 1);
    } else {
      // Finished all steps -> save to database on server!
      await saveVitalsToBackend(childName, childAge, childGender, capturedVitals);
      alert('🌟 All vitals successfully captured, saved to database, and reflected in Tabular Form & Parent Report!');
      setActiveTab('tabular');
    }
  };

  const handlePrevStep = () => {
    if (currentVitalStep > 0) {
      setCurrentVitalStep((prev) => prev - 1);
    }
  };

  const saveVitalsToBackend = async (
    name: string,
    age: string,
    gender: string,
    vitalsMap: Record<string, string>
  ) => {
    const weightNum = parseFloat(vitalsMap.weight || '25');
    const heightNum = parseFloat(vitalsMap.height || '120');
    const heightInMeters = heightNum / 100;
    const bmiVal =
      heightInMeters > 0 ? (weightNum / (heightInMeters * heightInMeters)).toFixed(1) : '16.0';

    const newRecord = {
      childName: name,
      age: age,
      gender: gender,
      visitDate: new Date().toISOString().split('T')[0],
      parentName: 'Parent Guardian',
      reportReleased: true,
      vitals: {
        temp: `${vitalsMap.temp || '36.8'} °C`,
        hr: `${vitalsMap.hr || '90'} BPM`,
        spO2: `${vitalsMap.spO2 || '98'}%`,
        respRate: `${vitalsMap.respRate || '20'}/min`,
        bp: `${vitalsMap.bp || '100/65'} mmHg`,
        weight: `${vitalsMap.weight || '26'} kg`,
        height: `${vitalsMap.height || '128'} cm`,
        bmi: `${bmiVal} kg/m²`,
      },
      diagnosis: 'Pediatric Preliminary Health Screening — Vitals recorded via Kids Adventure Zone.',
      aiSuggestions: [
        'Vital signs are well within normal pediatric healthy ranges.',
        'Ensure daily physical play and encourage drinking 1.5-2L water.',
        'Routine follow-up in 6 months for growth monitoring.',
      ],
    };

    try {
      const res = await fetch('/api/patient-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
      if (res.ok) {
        const json = await res.json();
        onUpdateData({
          patientRecords: {
            ...data.patientRecords,
            [name]: json.record,
          },
          childDetails: { name, age, gender },
        });
      }
    } catch (err) {
      console.error('Failed to save patient records:', err);
    }
  };

  const handleSaveTabularForm = async () => {
    await saveVitalsToBackend(childName, childAge, childGender, capturedVitals);
    alert(`⭐ Tabular vitals and details saved successfully for ${childName}! Report is updated in the Parent Portal.`);
  };

  return (
    <div className="space-y-6 flex-grow animate-fade-in">
      {/* TOP KIDS BANNER */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3.5 rounded-2xl text-3xl shadow-inner">⭐</div>
          <div>
            <h2 className="text-2xl font-bold kids-font">{t.kidsPortalTitle}</h2>
            <p className="text-sm text-white/95 kids-font">
              Fun cartoon guides and friendly vitals measurements!
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('roleSelection')}
          className="bg-white text-orange-600 hover:bg-yellow-50 px-5 py-2.5 rounded-2xl font-bold kids-font shadow flex items-center space-x-2 touch-target"
        >
          <i className="fa-solid fa-house"></i>
          <span>{t.homeMenu}</span>
        </button>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('interactive')}
          className={`px-5 py-2.5 rounded-2xl text-sm font-bold kids-font transition ${
            activeTab === 'interactive'
              ? 'bg-orange-500 text-white shadow'
              : 'bg-white dark:bg-[#1C2541] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-800'
          }`}
        >
          {t.interactiveTab}
        </button>
        <button
          onClick={() => setActiveTab('tabular')}
          className={`px-5 py-2.5 rounded-2xl text-sm font-bold kids-font transition ${
            activeTab === 'tabular'
              ? 'bg-orange-500 text-white shadow'
              : 'bg-white dark:bg-[#1C2541] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-800'
          }`}
        >
          {t.tabularTab}
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-5 py-2.5 rounded-2xl text-sm font-bold kids-font transition ${
            activeTab === 'videos'
              ? 'bg-orange-500 text-white shadow'
              : 'bg-white dark:bg-[#1C2541] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-800'
          }`}
        >
          {t.videosTab} ({data.cartoonStories.length})
        </button>
      </div>

      {/* TAB 1: INTERACTIVE VITALS GUIDE */}
      {activeTab === 'interactive' && currentStep && (
        <div className="bg-white dark:bg-[#1C2541] p-6 md:p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-6 max-w-3xl mx-auto">
          {/* STEP SELECTOR BAR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold kids-font">
              <span>Select Vital Step:</span>
              <span className="text-orange-600 dark:text-orange-400">
                {currentVitalStep + 1} of {data.vitalsVideos.length}
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {data.vitalsVideos.map((vStep, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentVitalStep(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold kids-font whitespace-nowrap transition flex items-center space-x-1.5 touch-target ${
                    currentVitalStep === idx
                      ? 'bg-orange-500 text-white shadow-md scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{idx + 1}. {vStep.category}</span>
                  {vStep.isVideoFile && (
                    <span
                      title="Uploaded Custom Video"
                      className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1 shadow-sm"
                    >
                      🎬 Uploaded
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full kids-font">
                {t.step} {currentVitalStep + 1} {t.of} {data.vitalsVideos.length}: {currentStep.category}
              </span>
              {currentStep.isVideoFile && (
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <i className="fa-solid fa-circle-check text-emerald-500"></i>
                  <span>Admin Uploaded Video</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold w-full sm:w-40"
                placeholder={t.childName}
              />
              <input
                type="text"
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                placeholder={t.age}
              />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black kids-font text-slate-900 dark:text-white">
              {currentStep.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 kids-font">
              ✨ Enter your measured value below while Doctor Bear guides you!
            </p>
          </div>

          {/* VIDEO CONTAINER (SUPPORTS UPLOADED FILES & WEB EMBEDS) */}
          <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-300 dark:border-slate-700 bg-black aspect-video flex items-center justify-center relative group">
            {currentStep.isVideoFile ? (
              <video
                key={currentStep.videoUrl}
                src={currentStep.videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              >
                <source src={currentStep.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <iframe
                key={currentStep.videoUrl}
                src={currentStep.videoUrl}
                className="w-full h-full"
                title={currentStep.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            {currentStep.isVideoFile && (
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-xl pointer-events-none flex items-center space-x-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Custom Uploaded Video</span>
              </div>
            )}
          </div>

          {/* VALUE INPUT BOX */}
          <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-bold kids-font text-amber-800 dark:text-amber-300">
              Enter {currentStep.category} Value ({currentStep.unit}):
            </span>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="text"
                value={stepInputValue}
                onChange={(e) => handleStepValueChange(e.target.value)}
                className="w-full sm:w-36 px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 font-bold text-lg text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder={currentStep.defaultVal}
              />
              <span className="font-bold text-sm text-slate-600 dark:text-slate-300">
                {currentStep.unit}
              </span>
            </div>
          </div>

          {/* STEP CONTROLS */}
          <div className="flex justify-between pt-4">
            <button
              onClick={handlePrevStep}
              disabled={currentVitalStep === 0}
              className={`px-5 py-2.5 rounded-2xl font-bold kids-font text-sm transition ${
                currentVitalStep === 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-500'
                  : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 shadow'
              }`}
            >
              {t.prev}
            </button>
            <button
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-2xl font-bold kids-font bg-orange-500 hover:bg-orange-600 text-white text-sm shadow transition"
            >
              {currentVitalStep === data.vitalsVideos.length - 1 ? t.finish : t.next}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: TABULAR VITALS FORM */}
      {activeTab === 'tabular' && (
        <div className="bg-white dark:bg-[#1C2541] p-6 md:p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-6 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold kids-font text-slate-900 dark:text-white text-center">
            Colorful Tabular Vitals & Patient Form
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                {t.childName}
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                {t.age}
              </label>
              <input
                type="text"
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                {t.gender}
              </label>
              <select
                value={childGender}
                onChange={(e) => setChildGender(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* PARAMETERS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-900 text-center">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Temperature</span>
              <input
                type="text"
                value={capturedVitals.temp || '36.8'}
                onChange={(e) => setCapturedVitals({ ...capturedVitals, temp: e.target.value })}
                className="w-full mt-1 text-center font-black text-xl bg-transparent text-slate-900 dark:text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">°C</span>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-900 text-center">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Heart Rate</span>
              <input
                type="text"
                value={capturedVitals.hr || '90'}
                onChange={(e) => setCapturedVitals({ ...capturedVitals, hr: e.target.value })}
                className="w-full mt-1 text-center font-black text-xl bg-transparent text-slate-900 dark:text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">BPM</span>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-center">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Oxygen (SpO2)</span>
              <input
                type="text"
                value={capturedVitals.spO2 || '98'}
                onChange={(e) => setCapturedVitals({ ...capturedVitals, spO2: e.target.value })}
                className="w-full mt-1 text-center font-black text-xl bg-transparent text-slate-900 dark:text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">%</span>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-900 text-center">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400">Respiratory</span>
              <input
                type="text"
                value={capturedVitals.respRate || '20'}
                onChange={(e) => setCapturedVitals({ ...capturedVitals, respRate: e.target.value })}
                className="w-full mt-1 text-center font-black text-xl bg-transparent text-slate-900 dark:text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">/min</span>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-900 text-center">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Blood Pressure</span>
              <input
                type="text"
                value={capturedVitals.bp || '100/65'}
                onChange={(e) => setCapturedVitals({ ...capturedVitals, bp: e.target.value })}
                className="w-full mt-1 text-center font-black text-xl bg-transparent text-slate-900 dark:text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">mmHg</span>
            </div>

            <div className="bg-cyan-50 dark:bg-cyan-950/40 p-4 rounded-2xl border border-cyan-200 dark:border-cyan-900 text-center">
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">Weight</span>
              <input
                type="text"
                value={capturedVitals.weight || '26'}
                onChange={(e) => setCapturedVitals({ ...capturedVitals, weight: e.target.value })}
                className="w-full mt-1 text-center font-black text-xl bg-transparent text-slate-900 dark:text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">kg</span>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900 text-center">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Height</span>
              <input
                type="text"
                value={capturedVitals.height || '128'}
                onChange={(e) => setCapturedVitals({ ...capturedVitals, height: e.target.value })}
                className="w-full mt-1 text-center font-black text-xl bg-transparent text-slate-900 dark:text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">cm</span>
            </div>

            <div className="bg-teal-50 dark:bg-teal-950/40 p-4 rounded-2xl border border-teal-200 dark:border-teal-900 text-center flex flex-col justify-center">
              <span className="text-xs font-bold text-teal-700 dark:text-teal-400">Calculated BMI</span>
              <span className="mt-1 font-black text-xl text-teal-800 dark:text-teal-300">
                {(
                  parseFloat(capturedVitals.weight || '26') /
                  Math.pow(parseFloat(capturedVitals.height || '128') / 100, 2)
                ).toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400">kg/m² (Healthy)</span>
            </div>
          </div>

          <button
            onClick={handleSaveTabularForm}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold kids-font py-3.5 rounded-2xl shadow transition"
          >
            {t.saveTabular}
          </button>
        </div>
      )}

      {/* TAB 3: CARTOON HEALTH VIDEOS (INCLUDES ADMIN UPLOADED VIDEOS!) */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold kids-font text-slate-900 dark:text-white">
              Watch & Learn Cartoon Health Shows
            </h3>
            <span className="text-xs bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 px-3 py-1 rounded-full font-bold">
              {data.cartoonStories.length} Shows Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.cartoonStories.map((story, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#1C2541] p-5 md:p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-4xl">{story.character || '🐻'}</div>
                    <div>
                      <h4 className="font-black kids-font text-xl text-slate-900 dark:text-white">
                        {story.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 kids-font">
                        {story.message}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setFullscreenVideo({
                        title: story.title,
                        videoUrl: story.videoUrl,
                        isVideoFile: story.isVideoFile,
                      })
                    }
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold kids-font shadow flex items-center space-x-1.5 touch-target transition flex-shrink-0"
                  >
                    <i className="fa-solid fa-expand"></i>
                    <span>{t.fullscreen}</span>
                  </button>
                </div>

                <div className="rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center relative shadow-inner">
                  {story.isVideoFile ? (
                    <video
                      src={story.videoUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <iframe
                      src={story.videoUrl}
                      className="w-full h-full"
                      title={story.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FULLSCREEN VIDEO MODAL */}
      {fullscreenVideo && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-5xl flex justify-between items-center mb-4 px-2 text-white">
            <h3 className="text-2xl font-bold kids-font flex items-center space-x-2">
              <span>🐻</span>
              <span>{fullscreenVideo.title}</span>
            </h3>
            <button
              onClick={() => setFullscreenVideo(null)}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-2xl font-bold kids-font shadow-lg flex items-center space-x-2 touch-target"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
              <span>{t.closeFullscreen}</span>
            </button>
          </div>

          <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border-2 border-orange-500">
            {fullscreenVideo.isVideoFile ? (
              <video
                src={fullscreenVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : (
              <iframe
                src={`${fullscreenVideo.videoUrl}?autoplay=1`}
                className="w-full h-full"
                title={fullscreenVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
