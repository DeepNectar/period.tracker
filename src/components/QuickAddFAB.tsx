import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import LogModal from './LogModal';

export default function QuickAddFAB() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-6 z-40 w-14 h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Quick log symptoms"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showModal && (
        <LogModal
          date={format(new Date(), 'yyyy-MM-dd')}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
