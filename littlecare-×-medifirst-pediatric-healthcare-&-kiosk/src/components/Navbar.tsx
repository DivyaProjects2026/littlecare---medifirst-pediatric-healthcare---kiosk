import React from 'react';
import { ViewMode, Language } from '../types';
import { translations } from '../translations';

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenEmergency: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  lang,
  onLanguageChange,
  isDark,
  onToggleTheme,
  onOpenEmergency,
}) => {
  const t = translations[lang];

  return (
    <header className="bg-[#176B87] text-white px-4 md:px-6 py-3.5 shadow-lg flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-[#176B87]/95">
      <div
        className="flex items-center space-x-3 cursor-pointer group"
        onClick={() => onNavigate('roleSelection')}
        title="LittleCare Home"
      >
        <div className="bg-white p-1 rounded-2xl shadow-md glow-effect flex items-center justify-center w-11 h-11 overflow-hidden transition-transform group-hover:scale-105">
          <i className="fa-solid fa-child-reaching text-[#176B87] text-xl"></i>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            LittleCare <span className="text-[#D9F5E8] font-light">× MediFirst</span>
          </h1>
          <p className="text-xs text-[#D9F5E8] font-medium hidden sm:block">
            {t.headerSubtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-3">
        <div className="relative">
          <select
            value={lang}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="bg-teal-800 text-white text-xs md:text-sm rounded-xl px-2.5 md:px-3.5 py-2 border border-teal-600 focus:outline-none focus:ring-2 focus:ring-[#D9F5E8] cursor-pointer"
            aria-label="Select Language"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>

        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white transition touch-target flex items-center justify-center shadow"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'} text-base md:text-lg`}></i>
        </button>

        <button
          onClick={onOpenEmergency}
          className="bg-red-600 hover:bg-red-700 text-white px-3 md:px-4 py-2 rounded-xl font-bold text-xs md:text-sm flex items-center space-x-2 shadow-lg animate-pulse touch-target"
          aria-label="Emergency Assistance"
        >
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span className="hidden sm:inline">{t.emergencyBtn}</span>
        </button>
      </div>
    </header>
  );
};
