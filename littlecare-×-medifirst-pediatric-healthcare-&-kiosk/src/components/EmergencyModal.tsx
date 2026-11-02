import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;
  const t = translations[lang];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-[#1C2541] rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-red-500">
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <i className="fa-solid fa-triangle-exclamation text-3xl animate-bounce"></i>
          <h3 className="text-2xl font-bold">{t.emergencyTitle}</h3>
        </div>

        <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm leading-relaxed">
          {t.emergencyDesc}
        </p>

        <div className="bg-red-50 dark:bg-red-950/40 p-4 rounded-2xl border border-red-200 dark:border-red-900 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-red-700 dark:text-red-300 text-sm">
              {t.nationalHelpline}
            </span>
            <a
              href="tel:112"
              className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 flex items-center space-x-2 shadow transition"
            >
              <i className="fa-solid fa-phone"></i>
              <span>{t.callEmergency}</span>
            </a>
          </div>

          <div className="text-xs text-red-600 dark:text-red-300 pt-2 border-t border-red-200 dark:border-red-900">
            <strong>Urgent Warning Signs:</strong> Blue lips/nails, chest retractions, inability to wake, seizures, temperature over 39.5°C with stiffness.
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
