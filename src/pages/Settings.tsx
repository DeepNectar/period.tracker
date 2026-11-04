import { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { Shield, Flower, Bell, Download, Upload, Trash2, Lock, LogOut } from 'lucide-react';

export default function Settings() {
  const settings = useAppStore(s => s.settings);
  const updateSettings = useAppStore(s => s.updateSettings);
  const localMode = useAppStore(s => s.localMode);
  const toggleLocalMode = useAppStore(s => s.toggleLocalMode);
  const importData = useAppStore(s => s.importData);
  const deleteAccount = useAppStore(s => s.deleteAccount);
  const logout = useAppStore(s => s.logout);
  const addToast = useAppStore(s => s.addToast);
  const setPin = useAppStore(s => s.setPin);
  const removePin = useAppStore(s => s.removePin);
  const pinHash = useAppStore(s => s.pinHash);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pinInput, setPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handlePinSet = async () => {
    if (pinInput.length >= 4 && pinInput.length <= 6 && /^\d+$/.test(pinInput)) {
      await setPin(pinInput);
      addToast('PIN set successfully', 'success');
      setShowPinSetup(false);
      setPinInput('');
    } else {
      addToast('PIN must be 4-6 digits', 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await importData(data);
      addToast(`Imported ${result.entries} entries, ${result.symptoms} logs`, 'success');
    } catch (err) {
      addToast('Failed to import file', 'error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAccount = async () => {
    await deleteAccount();
    addToast('Account deleted', 'info');
    navigate('/signin');
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      {/* Cycle Preferences */}
      <section className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Flower className="w-4 h-4 text-rose-500" />
          Cycle Preferences
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Average Cycle Length: {settings.avgCycleLength} days
            </label>
            <input
              type="range"
              min={15}
              max={60}
              step={1}
              value={settings.avgCycleLength}
              onChange={e => updateSettings({ avgCycleLength: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Luteal Phase Length: {settings.lutealLength} days
            </label>
            <input
              type="range"
              min={8}
              max={16}
              step={1}
              value={settings.lutealLength}
              onChange={e => updateSettings({ lutealLength: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <p className="text-xs text-gray-400 mt-1">Typically 14 days. Used to predict ovulation.</p>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          Notifications
        </h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Daily Reminder</span>
            <input
              type="checkbox"
              checked={settings.dailyReminderOn}
              onChange={e => updateSettings({ dailyReminderOn: e.target.checked })}
              className="w-5 h-5 rounded text-rose-500"
            />
          </label>
          {settings.dailyReminderOn && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Reminder Time</label>
              <input
                type="time"
                value={settings.dailyReminderTime}
                onChange={e => updateSettings({ dailyReminderTime: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Period Alert</span>
            <input
              type="checkbox"
              checked={settings.periodAlertOn}
              onChange={e => updateSettings({ periodAlertOn: e.target.checked })}
              className="w-5 h-5 rounded text-rose-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Fertile Window</span>
            <input
              type="checkbox"
              checked={settings.fertileWindowOn}
              onChange={e => updateSettings({ fertileWindowOn: e.target.checked })}
              className="w-5 h-5 rounded text-rose-500"
            />
          </label>
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          Privacy & Security
        </h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-700">Local-First Mode</span>
              <p className="text-xs text-gray-400">Data stored only on this device</p>
            </div>
            <input
              type="checkbox"
              checked={localMode}
              onChange={toggleLocalMode}
              className="w-5 h-5 rounded text-rose-500"
            />
          </label>

          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  PIN Lock
                </span>
                <p className="text-xs text-gray-400">
                  {pinHash ? 'Enabled' : 'Not set'}
                </p>
              </div>
              {pinHash ? (
                <button
                  onClick={() => { removePin(); addToast('PIN removed', 'info'); }}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => setShowPinSetup(!showPinSetup)}
                  className="text-sm text-rose-500 hover:text-rose-600"
                >
                  Set PIN
                </button>
              )}
            </div>
            {showPinSetup && (
              <div className="mt-3 flex gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder="4-6 digits"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={handlePinSet}
                  className="px-4 py-2 bg-rose-500 text-white text-sm rounded-lg hover:bg-rose-600"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="w-4 h-4 text-blue-500" />
          Data Management
        </h2>
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Upload className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-700">Upload Backup JSON</span>
          </button>
        </div>
      </section>

      {/* Account */}
      <section className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Account</h2>
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-700">Sign Out</span>
          </button>

          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="w-full flex items-center gap-3 p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-600">Delete Account</span>
            </button>
            {showDeleteConfirm && (
              <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-700 mb-3">
                  This will permanently delete all your data. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Delete Everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
