import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function AppLock() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const unlock = useAppStore(s => s.unlock);
  const verifyPin = useAppStore(s => s.verifyPin);
  const pinHash = useAppStore(s => s.pinHash);

  if (!pinHash) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      setError(true);
      return;
    }

    const valid = await verifyPin(pin);
    if (valid) {
      unlock();
      setError(false);
      setAttempts(0);
    } else {
      setError(true);
      setAttempts(a => a + 1);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-rose-950 via-pink-900 to-purple-950 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 w-full max-w-sm mx-4 border border-white/20 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Bloom Locked</h2>
          <p className="text-rose-200 text-sm mt-1">Enter your PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={e => { setPin(e.target.value); setError(false); }}
            placeholder="••••"
            className="w-full text-center text-2xl tracking-[0.5em] bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-rose-400"
            autoFocus
          />
          {error && (
            <p className="text-red-300 text-sm text-center">
              {attempts >= 5 ? 'Too many attempts. Try again later.' : 'Incorrect PIN'}
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-rose-500 hover:bg-rose-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
