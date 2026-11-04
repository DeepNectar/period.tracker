import { useAppStore } from '../store/useAppStore';

export default function Toast() {
  const toasts = useAppStore(s => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-slide-up
            ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-red-500' : 'bg-indigo-500'}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
