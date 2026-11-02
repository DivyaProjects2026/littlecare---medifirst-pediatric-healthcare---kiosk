import React, { useState } from 'react';
import { AppData, Language, ViewMode } from '../types';
import { translations } from '../translations';

interface ParentLoginProps {
  data: AppData;
  onLoginSuccess: (selectedChild: string) => void;
  onNavigate: (view: ViewMode) => void;
  lang: Language;
}

export const ParentLogin: React.FC<ParentLoginProps> = ({
  data,
  onLoginSuccess,
  onNavigate,
  lang,
}) => {
  const t = translations[lang];
  const [selectedUser, setSelectedUser] = useState(
    data.parentAccounts[0]?.username || 'parent_sample'
  );
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const account = data.parentAccounts.find((a) => a.username === selectedUser);
    if (!account) {
      setError('Please select a valid parent account.');
      return;
    }

    if (pin.trim() !== account.pin && pin.trim() !== '1234') {
      setError('Invalid Hospital PIN. Please use master PIN: 1234.');
      return;
    }

    onLoginSuccess(account.childName);
  };

  return (
    <div className="flex items-center justify-center flex-grow py-8 px-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1C2541] p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="text-center">
          <div className="inline-flex bg-emerald-500/10 text-emerald-600 p-3.5 rounded-2xl mb-3 shadow-inner">
            <i className="fa-solid fa-users text-2xl"></i>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t.parentLoginTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.parentLoginDesc}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Select Parent Account / Child
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {data.parentAccounts.map((acc) => (
                <option key={acc.username} value={acc.username}>
                  {acc.username} ({acc.childName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
              {t.hospitalPin}
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="1234"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Default Master PIN: 1234</span>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl transition shadow-lg touch-target text-sm"
          >
            {t.accessParentPortal}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate('roleSelection')}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline font-medium"
          >
            {t.returnHome}
          </button>
        </div>
      </div>
    </div>
  );
};
