import React, { useState, useRef } from 'react';
import { AdminTab, AppData, Language, ViewMode } from '../types';
import { translations } from '../translations';

interface AdminPortalProps {
  data: AppData;
  onUpdateData: (newData: Partial<AppData>) => void;
  onNavigate: (view: ViewMode) => void;
  lang: Language;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  data,
  onUpdateData,
  onNavigate,
  lang,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<AdminTab>('videos');

  // Account creation state
  const [newParentUser, setNewParentUser] = useState('');
  const [newChildName, setNewChildName] = useState('');
  const [newHospitalPin, setNewHospitalPin] = useState('1234');

  // Vitals video CMS state
  const [vitalCat, setVitalCat] = useState('Temperature');
  const [vitalCustomCat, setVitalCustomCat] = useState('');
  const [vitalMode, setVitalMode] = useState<'update' | 'add_new'>('update');
  const [vitalTitle, setVitalTitle] = useState('');
  const [vitalUrl, setVitalUrl] = useState('');
  const [vitalFile, setVitalFile] = useState<File | null>(null);
  const [isUploadingVital, setIsUploadingVital] = useState(false);
  const vitalFileInputRef = useRef<HTMLInputElement | null>(null);
  const vitalFormRef = useRef<HTMLDivElement | null>(null);

  // Cartoon video CMS state
  const [cartoonTitle, setCartoonTitle] = useState('');
  const [cartoonMsg, setCartoonMsg] = useState('');
  const [cartoonCharacter, setCartoonCharacter] = useState('🐻');
  const [cartoonUrl, setCartoonUrl] = useState('');
  const [cartoonFile, setCartoonFile] = useState<File | null>(null);
  const [isUploadingCartoon, setIsUploadingCartoon] = useState(false);
  const cartoonFileInputRef = useRef<HTMLInputElement | null>(null);

  // Bill creation state
  const [billChild, setBillChild] = useState(data.parentAccounts[0]?.childName || 'Sample Child');
  const [billService, setBillService] = useState('Pediatric Consultation & Telemetry');
  const [billAmount, setBillAmount] = useState('₹ 850');

  // Marquee edit state
  const [marqueeInput, setMarqueeInput] = useState(data.marqueeMessage);

  // 1. ADD PARENT ACCOUNT
  const handleAddParentAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentUser || !newChildName) return;

    try {
      const res = await fetch('/api/parent-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newParentUser.trim(),
          childName: newChildName.trim(),
          pin: newHospitalPin.trim() || '1234',
        }),
      });
      if (res.ok) {
        const json = await res.json();
        onUpdateData({ parentAccounts: json.parentAccounts });
        alert(`Parent account '${newParentUser}' created for child '${newChildName}'!`);
        setNewParentUser('');
        setNewChildName('');
      }
    } catch (err) {
      console.error('Failed to create parent account:', err);
    }
  };

  // DELETE PARENT ACCOUNT
  const handleDeleteParentAccount = async (username: string) => {
    if (!confirm(`Are you sure you want to remove account '${username}'?`)) return;
    try {
      const res = await fetch(`/api/parent-accounts/${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const json = await res.json();
        onUpdateData({ parentAccounts: json.parentAccounts });
      }
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  // 2. APPROVE APPOINTMENT
  const handleApproveAppointment = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' }),
      });
      if (res.ok) {
        const json = await res.json();
        onUpdateData({ appointments: json.appointments });
        alert(`Appointment ${id} has been Approved!`);
      }
    } catch (err) {
      console.error('Failed to approve appointment:', err);
    }
  };

  // 3. TOGGLE CLINICAL REPORT RELEASE
  const handleToggleReportRelease = async (childName: string) => {
    try {
      const res = await fetch(`/api/patient-records/${encodeURIComponent(childName)}/toggle-release`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const json = await res.json();
        const updatedRecords = { ...data.patientRecords };
        if (updatedRecords[childName]) {
          updatedRecords[childName].reportReleased = json.reportReleased;
        }
        onUpdateData({ patientRecords: updatedRecords });
        alert(
          `Clinical report for ${childName} is now: ${
            json.reportReleased ? 'RELEASED to parent portal' : 'HIDDEN / PENDING'
          }`
        );
      }
    } catch (err) {
      console.error('Failed to toggle report release:', err);
    }
  };

  // 4. ADD NEW BILL
  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: billChild,
          service: billService,
          amount: billAmount,
          status: 'Released & Paid',
        }),
      });
      if (res.ok) {
        const json = await res.json();
        onUpdateData({ bills: json.bills });
        alert(`New invoice bill created for ${billChild}!`);
      }
    } catch (err) {
      console.error('Failed to create bill:', err);
    }
  };

  // 5. ADD OR UPDATE INTERACTIVE VITALS GUIDE VIDEO
  const handleAddVitalVideo = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetCategory = vitalCat === 'Custom Vital' ? (vitalCustomCat.trim() || 'Custom Vital') : vitalCat;
    let targetTitle = vitalTitle.trim();
    if (!targetTitle) {
      if (vitalFile) {
        targetTitle = vitalFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      } else {
        targetTitle = `${targetCategory} Guide Video`;
      }
    }

    setIsUploadingVital(true);
    try {
      let finalUrl = vitalUrl.trim();
      let isFile = false;

      // If user selected a video file from device
      if (vitalFile) {
        const formData = new FormData();
        formData.append('video', vitalFile);
        const uploadRes = await fetch('/api/upload-video', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) {
          throw new Error('Video file upload failed');
        }
        const uploadJson = await uploadRes.json();
        finalUrl = uploadJson.url;
        isFile = true;
      }

      if (!finalUrl) {
        alert('Please provide either a video file or a YouTube / video link.');
        setIsUploadingVital(false);
        return;
      }

      const res = await fetch('/api/videos/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: targetCategory,
          title: targetTitle,
          videoUrl: finalUrl,
          isVideoFile: isFile,
          paramKey: targetCategory.toLowerCase().replace(/[^a-z0-9]/g, '') || 'custom',
          unit: targetCategory === 'Temperature' ? '°C' : targetCategory === 'Weight' ? 'kg' : targetCategory === 'Height' ? 'cm' : 'unit',
          defaultVal: '0',
          mode: vitalMode,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        onUpdateData({ vitalsVideos: json.vitalsVideos });
        alert(`✅ Interactive vitals guide video for "${targetCategory}" saved successfully! It is now live in Kids Adventure Zone -> Interactive Vitals Guide.`);
        setVitalTitle('');
        setVitalUrl('');
        setVitalFile(null);
        setVitalCustomCat('');
        if (vitalFileInputRef.current) vitalFileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to add vital video:', err);
      alert('Error uploading or adding video. Please try again.');
    } finally {
      setIsUploadingVital(false);
    }
  };

  // DELETE VITALS GUIDE VIDEO
  const handleDeleteVitalVideo = async (index: number) => {
    if (!confirm('Are you sure you want to remove this vitals guide video?')) return;
    try {
      const res = await fetch(`/api/videos/vitals/${index}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const json = await res.json();
        onUpdateData({ vitalsVideos: json.vitalsVideos });
      }
    } catch (err) {
      console.error('Failed to delete vital video:', err);
    }
  };

  // 6. ADD CARTOON HEALTH VIDEO (CRITICAL REQUIREMENT)
  const handleAddCartoonVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartoonTitle || !cartoonMsg) return;

    setIsUploadingCartoon(true);
    try {
      let finalUrl = cartoonUrl.trim();
      let isFile = false;

      // If user selected a video file from device
      if (cartoonFile) {
        const formData = new FormData();
        formData.append('video', cartoonFile);
        const uploadRes = await fetch('/api/upload-video', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) {
          throw new Error('Video upload failed');
        }
        const uploadJson = await uploadRes.json();
        finalUrl = uploadJson.url;
        isFile = true;
      }

      if (!finalUrl) {
        alert('Please provide either a video file or a YouTube / web embed link.');
        setIsUploadingCartoon(false);
        return;
      }

      const res = await fetch('/api/videos/cartoon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cartoonTitle,
          message: cartoonMsg,
          character: cartoonCharacter,
          videoUrl: finalUrl,
          isVideoFile: isFile,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        onUpdateData({ cartoonStories: json.cartoonStories });
        alert(`🎉 Cartoon video "${cartoonTitle}" uploaded & saved! It is immediately displayed in the Kids module.`);
        setCartoonTitle('');
        setCartoonMsg('');
        setCartoonUrl('');
        setCartoonFile(null);
        if (cartoonFileInputRef.current) cartoonFileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to add cartoon video:', err);
      alert('Error uploading cartoon video. Please check connection and try again.');
    } finally {
      setIsUploadingCartoon(false);
    }
  };

  // DELETE CARTOON VIDEO
  const handleDeleteCartoonVideo = async (index: number) => {
    if (!confirm('Are you sure you want to remove this cartoon health show?')) return;
    try {
      const res = await fetch(`/api/videos/cartoon/${index}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const json = await res.json();
        onUpdateData({ cartoonStories: json.cartoonStories });
      }
    } catch (err) {
      console.error('Failed to delete cartoon video:', err);
    }
  };

  // 7. UPDATE MARQUEE MESSAGE
  const handleUpdateMarquee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/marquee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: marqueeInput }),
      });
      if (res.ok) {
        const json = await res.json();
        onUpdateData({ marqueeMessage: json.marqueeMessage });
        alert('Scrolling marquee banner updated across all app views!');
      }
    } catch (err) {
      console.error('Failed to update marquee:', err);
    }
  };

  return (
    <div className="space-y-6 flex-grow animate-fade-in">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-slate-800 text-teal-400">
              <i className="fa-solid fa-shield-halved text-xl"></i>
            </span>
            <h2 className="text-2xl font-bold">{t.adminHubTitle}</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">{t.adminHubDesc}</p>
        </div>
        <button
          onClick={() => onNavigate('roleSelection')}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition touch-target flex-shrink-0"
        >
          {t.logoutAdmin}
        </button>
      </div>

      {/* ADMIN SUB-TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'videos'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white dark:bg-[#1C2541] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>{t.tabVideos}</span>
          <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
            CMS
          </span>
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition ${
            activeTab === 'accounts'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white dark:bg-[#1C2541] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t.tabAccounts}
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition ${
            activeTab === 'appointments'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white dark:bg-[#1C2541] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t.tabAppointments}
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition ${
            activeTab === 'reports'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white dark:bg-[#1C2541] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t.tabReports}
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition ${
            activeTab === 'billing'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white dark:bg-[#1C2541] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t.tabBilling}
        </button>
        <button
          onClick={() => setActiveTab('marquee')}
          className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition ${
            activeTab === 'marquee'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white dark:bg-[#1C2541] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t.tabMarquee}
        </button>
      </div>

      {/* TAB 1: VIDEOS CMS (PRIMARY FUNCTIONALITY) */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-300 dark:border-amber-800 flex items-center space-x-3 text-xs text-amber-900 dark:text-amber-200 font-medium">
            <i className="fa-solid fa-circle-info text-amber-600 text-base"></i>
            <span>
              All video files uploaded or links saved here will be stored in the MediFirst backend and instantly displayed & playable in the Kids Adventure Zone!
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CARTOON HEALTH VIDEO CMS (FOR KIDS SHOWS) */}
            <div className="bg-white dark:bg-[#1C2541] p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white">
                <span className="text-2xl">📺</span>
                <div>
                  <h3 className="font-bold text-lg">Add Cartoon Health Video</h3>
                  <p className="text-xs text-slate-500">Shows up in Kids Module &gt; Cartoon Health Videos</p>
                </div>
              </div>

              <form onSubmit={handleAddCartoonVideo} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Show Title
                  </label>
                  <input
                    type="text"
                    required
                    value={cartoonTitle}
                    onChange={(e) => setCartoonTitle(e.target.value)}
                    placeholder="e.g. Sparky's Toothbrush Party"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Character Message / Tip
                    </label>
                    <input
                      type="text"
                      required
                      value={cartoonMsg}
                      onChange={(e) => setCartoonMsg(e.target.value)}
                      placeholder="e.g. Brush circles twice a day!"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Mascot Emoji
                    </label>
                    <select
                      value={cartoonCharacter}
                      onChange={(e) => setCartoonCharacter(e.target.value)}
                      className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold"
                    >
                      <option value="🐻">🐻 Doctor Bear</option>
                      <option value="🫧">🫧 Sparky Soap</option>
                      <option value="🐰">🐰 Benny Bunny</option>
                      <option value="🦁">🦁 Leo Lion</option>
                      <option value="⭐">⭐ Star Pal</option>
                      <option value="🍎">🍎 Apple Hero</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Option A: YouTube Link or Web Video URL
                  </label>
                  <input
                    type="text"
                    value={cartoonUrl}
                    onChange={(e) => setCartoonUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or direct MP4 URL"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Option B: Upload Video File from Device (MP4, WebM, MOV)
                  </label>
                  <input
                    ref={cartoonFileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => setCartoonFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#176B87] file:text-white hover:file:bg-teal-800 cursor-pointer"
                  />
                  {cartoonFile && (
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      Selected: {cartoonFile.name} ({(cartoonFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isUploadingCartoon}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl text-xs transition shadow flex items-center justify-center space-x-2"
                >
                  {isUploadingCartoon ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Uploading Video to Server...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      <span>Save & Publish Cartoon Show to Kids Zone</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* INTERACTIVE VITALS GUIDE CMS */}
            <div ref={vitalFormRef} className="bg-white dark:bg-[#1C2541] p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white">
                <span className="text-2xl">🩺</span>
                <div>
                  <h3 className="font-bold text-lg">Add or Update Interactive Vitals Guide Video</h3>
                  <p className="text-xs text-slate-500">Updates live video guides in Kids Adventure Zone</p>
                </div>
              </div>

              <form onSubmit={handleAddVitalVideo} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Select Target Vital Step
                  </label>
                  <select
                    value={vitalCat}
                    onChange={(e) => {
                      setVitalCat(e.target.value);
                      const matching = data.vitalsVideos.find(
                        (v) => v.category.toLowerCase() === e.target.value.toLowerCase()
                      );
                      if (matching && !vitalTitle) {
                        setVitalTitle(matching.title);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold"
                  >
                    {data.vitalsVideos.map((v, idx) => (
                      <option key={idx} value={v.category}>
                        Step {idx + 1}: {v.category} ({v.isVideoFile ? '🎬 Uploaded File' : '🌐 YouTube'})
                      </option>
                    ))}
                    <option value="Custom Vital">➕ Add New Custom Vital Step...</option>
                  </select>
                </div>

                {vitalCat === 'Custom Vital' && (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900">
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        Custom Vital Category
                      </label>
                      <input
                        type="text"
                        required
                        value={vitalCustomCat}
                        onChange={(e) => setVitalCustomCat(e.target.value)}
                        placeholder="e.g. Glucose, Reflexes"
                        className="w-full px-3 py-2 rounded-lg border text-xs bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. mg/dL, score"
                        className="w-full px-3 py-2 rounded-lg border text-xs bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* Mode Selector */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Action:</span>
                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name="vitalMode"
                        value="update"
                        checked={vitalMode === 'update'}
                        onChange={() => setVitalMode('update')}
                        className="text-orange-500 focus:ring-orange-400"
                      />
                      <span>Update / Replace video for this step (Recommended)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name="vitalMode"
                        value="add_new"
                        checked={vitalMode === 'add_new'}
                        onChange={() => setVitalMode('add_new')}
                        className="text-orange-500 focus:ring-orange-400"
                      />
                      <span>Add as new additional step</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Video Title (Optional - auto-generated if blank)
                  </label>
                  <input
                    type="text"
                    value={vitalTitle}
                    onChange={(e) => setVitalTitle(e.target.value)}
                    placeholder="e.g. Friendly Thermometer Video Check"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Option A: YouTube Link or Web Video URL
                  </label>
                  <input
                    type="text"
                    value={vitalUrl}
                    onChange={(e) => setVitalUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Option B: Upload Video File from Device (MP4, WebM, MOV)
                  </label>
                  <input
                    ref={vitalFileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files ? e.target.files[0] : null;
                      setVitalFile(file);
                      if (file && !vitalTitle) {
                        const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                        setVitalTitle(clean);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#176B87] file:text-white hover:file:bg-teal-800 cursor-pointer"
                  />
                  {vitalFile && (
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      Selected: {vitalFile.name} ({(vitalFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isUploadingVital}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl text-xs transition shadow flex items-center justify-center space-x-2"
                >
                  {isUploadingVital ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Uploading & Saving Video to Kids Zone...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      <span>
                        {vitalMode === 'update' ? `Save & Update ${vitalCat} Video` : 'Add New Vitals Video Step'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ACTIVE VIDEO INVENTORY LIST */}
          <div className="bg-white dark:bg-[#1C2541] p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
              <i className="fa-solid fa-list-check text-orange-500"></i>
              <span>Active Videos Live in Kids Adventure Zone</span>
            </h3>

            <div className="space-y-6">
              {/* Interactive Vitals Videos List */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">
                  Interactive Vitals Guide Videos ({data.vitalsVideos.length} Steps)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.vitalsVideos.map((vital, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                            Step {idx + 1}: {vital.category}
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                              vital.isVideoFile
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {vital.isVideoFile ? '🎬 Uploaded File' : '🌐 YouTube'}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white mt-1.5 truncate">
                          {vital.title}
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setVitalCat(vital.category);
                            setVitalTitle(vital.title);
                            setVitalMode('update');
                            if (vitalFormRef.current) {
                              vitalFormRef.current.scrollIntoView({ behavior: 'smooth' });
                            }
                            if (vitalFileInputRef.current) {
                              vitalFileInputRef.current.click();
                            }
                          }}
                          className="text-teal-600 dark:text-teal-400 hover:underline font-bold text-[11px] flex items-center space-x-1"
                        >
                          <i className="fa-solid fa-arrow-up-from-bracket"></i>
                          <span>Replace Video</span>
                        </button>
                        {data.vitalsVideos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteVitalVideo(idx)}
                            className="text-red-500 hover:text-red-700 font-bold text-[11px] flex items-center space-x-1"
                          >
                            <i className="fa-solid fa-trash"></i>
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cartoon Stories List */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">
                  Cartoon Health Shows ({data.cartoonStories.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.cartoonStories.map((story, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{story.character}</span>
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {story.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{story.message}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded font-mono">
                          {story.isVideoFile ? '🎬 Local File' : '🌐 Embed'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCartoonVideo(idx)}
                          className="text-red-500 hover:text-red-700 font-bold text-[11px] flex items-center space-x-1"
                        >
                          <i className="fa-solid fa-trash"></i>
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARENT ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1C2541] p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
              <i className="fa-solid fa-user-plus text-emerald-600"></i>
              <span>Register Parent & Child Account</span>
            </h3>
            <form onSubmit={handleAddParentAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Parent Username
                </label>
                <input
                  type="text"
                  required
                  value={newParentUser}
                  onChange={(e) => setNewParentUser(e.target.value)}
                  placeholder="e.g. parent_john"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Child Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Master Hospital PIN
                </label>
                <input
                  type="password"
                  value={newHospitalPin}
                  onChange={(e) => setNewHospitalPin(e.target.value)}
                  placeholder="1234"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs transition"
              >
                Save Parent Account
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-[#1C2541] p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
              <i className="fa-solid fa-users text-teal-600"></i>
              <span>Registered Accounts ({data.parentAccounts.length})</span>
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {data.parentAccounts.map((acc) => (
                <div
                  key={acc.username}
                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs"
                >
                  <div>
                    <strong className="text-slate-900 dark:text-white">{acc.username}</strong>
                    <p className="text-slate-500 mt-0.5">Child: {acc.childName}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      Active
                    </span>
                    {data.parentAccounts.length > 1 && (
                      <button
                        onClick={() => handleDeleteParentAccount(acc.username)}
                        className="text-red-500 hover:text-red-700 text-xs p-1"
                        title="Remove Account"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-white dark:bg-[#1C2541] p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
            <i className="fa-solid fa-calendar-check text-emerald-600"></i>
            <span>Pediatric Clinic Appointments</span>
          </h3>

          <div className="space-y-3">
            {data.appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
              >
                <div>
                  <span className="font-mono text-teal-600 font-bold mr-2">{apt.id}</span>
                  <strong className="text-base text-slate-900 dark:text-white">{apt.childName} ({apt.age})</strong>
                  <p className="text-slate-500 mt-1">
                    📅 {apt.date} at {apt.time} — <span className="font-semibold">{apt.reason}</span>
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      apt.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {apt.status}
                  </span>
                  {apt.status !== 'Approved' && (
                    <button
                      onClick={() => handleApproveAppointment(apt.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow transition"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CLINICAL REPORTS RELEASE */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-[#1C2541] p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
              <i className="fa-solid fa-file-waveform text-teal-600"></i>
              <span>Clinical Telemetry Report Release Center</span>
            </h3>
            <span className="text-xs text-slate-500">
              Control what parents can view in their portal
            </span>
          </div>

          <div className="space-y-3">
            {Object.keys(data.patientRecords).map((name) => {
              const rec = data.patientRecords[name];
              return (
                <div
                  key={name}
                  className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                      {rec.childName} ({rec.age || '8 Yrs'}, {rec.gender || 'Child'})
                    </h4>
                    <p className="text-slate-500 mt-0.5">
                      Last Visit: {rec.visitDate} | Temp: {rec.vitals.temp} | HR: {rec.vitals.hr} | SpO2: {rec.vitals.spO2}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        rec.reportReleased
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {rec.reportReleased ? 'Released' : 'Pending / Hidden'}
                    </span>
                    <button
                      onClick={() => handleToggleReportRelease(name)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow"
                    >
                      {rec.reportReleased ? 'Hide from Parent' : 'Release to Parent'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: BILLING & RECEIPTS */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1C2541] p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Issue New Medical Bill</h3>
            <form onSubmit={handleAddBill} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Patient Child</label>
                <select
                  value={billChild}
                  onChange={(e) => setBillChild(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  {data.parentAccounts.map((a) => (
                    <option key={a.username} value={a.childName}>
                      {a.childName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Service Description</label>
                <input
                  type="text"
                  required
                  value={billService}
                  onChange={(e) => setBillService(e.target.value)}
                  placeholder="e.g. Pediatric Telemetry & Consultation"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Amount</label>
                <input
                  type="text"
                  required
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="₹ 850"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="md:col-span-4">
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-6 rounded-xl text-xs transition"
                >
                  Create & Release Bill
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-[#1C2541] p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Active Bills & Receipts</h3>
            <div className="space-y-3 text-xs">
              {data.bills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center"
                >
                  <div>
                    <span className="font-mono text-teal-600 font-bold mr-2">{bill.id} ({bill.receiptNo})</span>
                    <strong className="text-sm text-slate-900 dark:text-white">{bill.childName} — {bill.service}</strong>
                    <p className="text-slate-500 mt-0.5 font-bold text-emerald-600">{bill.amount}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {bill.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MARQUEE BANNER EDIT */}
      {activeTab === 'marquee' && (
        <div className="bg-white dark:bg-[#1C2541] p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
            <i className="fa-solid fa-bullhorn text-amber-500"></i>
            <span>Edit Scrolling Marquee Banner</span>
          </h3>
          <p className="text-xs text-slate-500">
            This message continuously scrolls across the top banner in all views for kids, parents, and clinic visitors.
          </p>

          <form onSubmit={handleUpdateMarquee} className="space-y-3">
            <textarea
              rows={3}
              required
              value={marqueeInput}
              onChange={(e) => setMarqueeInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-6 rounded-xl text-xs transition"
            >
              Update Marquee Announcement
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
