import React from 'react';
import { ViewMode, Language } from '../types';
import { translations } from '../translations';

interface RoleSelectionProps {
  onNavigate: (view: ViewMode) => void;
  lang: Language;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onNavigate, lang }) => {
  const t = translations[lang];

  return (
    <div className="flex flex-col items-center justify-center flex-grow py-8 px-4 space-y-8 animate-fade-in">
      {/* HERO MASCOT & LOGO BANNER WITH DOCTOR BEAR */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 bg-white dark:bg-[#1C2541] p-6 md:p-8 rounded-3xl shadow-xl border-2 border-[#176B87]/30 max-w-4xl w-full">
        <div className="w-44 h-44 md:w-48 md:h-48 rounded-3xl overflow-hidden shadow-lg border-4 border-[#176B87]/20 flex-shrink-0 bg-amber-50 flex items-center justify-center p-1 floating-cartoon">
          <img
            src="/doctor-bear.svg"
            alt="LittleCare Doctor Bear Mascot"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="text-center md:text-left space-y-3">
          <div className="flex items-center justify-center md:justify-start space-x-3">
            <div className="bg-[#176B87] p-2.5 rounded-2xl text-white text-2xl shadow-md">
              <i className="fa-solid fa-child-reaching"></i>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#176B87] dark:text-teal-400 kids-font">
              LittleCare <span className="text-emerald-600 font-light text-xl">× MediFirst</span>
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-lg">
            Compassionate pediatric care with interactive gamified vitals telemetry, joyful cartoon health guides, and secure parent/admin portals.
          </p>
          <div>
            <span className="inline-block bg-[#D9F5E8] text-teal-800 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm">
              {t.doctorBearWelcome}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white kids-font">
          {t.welcomeHeading}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl">
        {/* KIDS PORTAL CARD */}
        <div
          onClick={() => onNavigate('kidsPortal')}
          className="bg-gradient-to-br from-amber-400 to-orange-500 p-7 md:p-8 rounded-3xl shadow-xl border-4 border-white/40 hover:scale-[1.03] transition-transform cursor-pointer flex flex-col justify-between text-white group"
        >
          <div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              ⭐
            </div>
            <h3 className="text-2xl font-bold mb-2 kids-font">
              {t.kidsPortalTitle}
            </h3>
            <p className="text-white/95 text-sm leading-relaxed mb-6">
              {t.kidsPortalDesc}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('kidsPortal');
            }}
            className="w-full bg-white text-orange-600 hover:bg-yellow-50 font-bold py-3.5 px-4 rounded-2xl transition shadow-lg touch-target kids-font text-base"
          >
            {t.kidsBtn}
          </button>
        </div>

        {/* PARENT PORTAL CARD */}
        <div
          onClick={() => onNavigate('parentLogin')}
          className="bg-white dark:bg-[#1C2541] p-7 md:p-8 rounded-3xl shadow-xl border-2 border-emerald-500 hover:border-emerald-600 transition-all transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6">
              <i className="fa-solid fa-users"></i>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {t.parentPortalTitle}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
              {t.parentPortalDesc}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('parentLogin');
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 touch-target shadow"
          >
            <span>{t.parentBtn}</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        {/* ADMIN PORTAL CARD */}
        <div
          onClick={() => onNavigate('adminPortal')}
          className="bg-white dark:bg-[#1C2541] p-7 md:p-8 rounded-3xl shadow-xl border-2 border-slate-700 hover:border-slate-900 dark:hover:border-slate-500 transition-all transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-14 h-14 bg-slate-800 text-white rounded-2xl flex items-center justify-center text-2xl mb-6">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {t.adminPortalTitle}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
              {t.adminPortalDesc}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('adminPortal');
            }}
            className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold py-3.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 touch-target shadow"
          >
            <span>{t.adminBtn}</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
