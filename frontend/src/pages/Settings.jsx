import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useStudy } from '../context/StudyContext';
import {
  User,
  Moon,
  Sun,
  Bell,
  Shield,
  Save
} from 'lucide-react';

export const Settings = () => {
  const { user, updateUserProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useStudy();

  const [name, setName] = useState(user?.name || '');

  // Notification states
  const [notifyQuizzes, setNotifyQuizzes] = useState(true);
  const [notifyflashcards, setNotifyflashcards] = useState(true);
  
  

  const handleProfileSave = (e) => {
    e.preventDefault();
    if (!name) {
      addToast('Profile name and email cannot be empty.', 'error');
      return;
    }

    updateUserProfile({ name });
    addToast('Profile changes saved successfully!', 'success');
  };

  

  return (
    <div className="space-y-8 font-sans max-w-4xl">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          Platform Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Customize your student profile, visual preferences, notifications, and security logs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Profile Card & Info (Left Column) */}
        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 backdrop-blur-md shadow-sm text-center">
          <img
            src={user?.avatar}
            alt="Avatar"
            className="w-24 h-24 rounded-full border border-indigo-500/30 object-cover mx-auto mb-4"
          />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">{user?.name}</h3>
          <p className="text-xs text-slate-400 mt-1">{user?.email}</p>

          <div className="w-full h-px bg-slate-100 dark:bg-slate-850 my-4" />

          <div className="space-y-3.5 text-left text-xs">
            
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Joined Date</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{user?.joinedAt || 'May 20, 2026'}</span>
            </div>
          </div>
        </div>

        {/* Inputs settings Form (Right Column) */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile form */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 backdrop-blur-md shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Student Profile
            </h3>
            <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">Profile Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl font-bold bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save profile changes
                </button>
              </div>
            </form>
          </div>

          {/* Theme Preferences card */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 backdrop-blur-md shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Sun className="w-4 h-4 text-indigo-500" />
              Theme Preferences
            </h3>
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-350">Toggle Visual Mode</p>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">Switch between dark slate themes and clean off-white layouts</p>
              </div>

              <button
                onClick={toggleTheme}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-slate-700 dark:text-white"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-500" />
                    Dark Mode
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Notifications toggles card */}
          {/* notifications based on this project in simple */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 backdrop-blur-md shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              Platform Notifications
            </h3>

            <div className="space-y-4 text-xs font-semibold text-slate-655 dark:text-slate-350">
              <div className="flex items-center justify-between">
                <div>
                  <p>Smart Quiz Reminders</p>
    
                </div>
                <input
                  type="checkbox"
                  checked={notifyQuizzes}
                  onChange={(e) => setNotifyQuizzes(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p>Ai Flashcards </p> {/* This paragraph based on industry */}
                
                </div>
                <input
                  type="checkbox"
                  checked={notifyflashcards}
                  onChange={(e) => setNotifyflashcards(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                
                
              </div>
            </div>
          </div>

         
        </div>
      </div>
    </div>
  );
};
