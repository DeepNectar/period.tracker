import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAppStore } from '../store/useAppStore';
import { format } from 'date-fns';
import { X } from 'lucide-react';

interface LogFormData {
  date: string;
  cramps: number;
  bloating: boolean;
  headache: boolean;
  breastTenderness: boolean;
  fatigue: number;
  acne: boolean;
  libido: 'low' | 'normal' | 'high' | null;
  sleepQuality: number | null;
  waterIntake: number | null;
  exercise: string;
  sexualActivity: boolean;
  contraception: string;
  notes: string;
  periodStart: boolean;
  periodEnd: boolean;
}

const MOOD_OPTIONS = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Sad', emoji: '😢' },
  { label: 'Anxious', emoji: '😰' },
  { label: 'Irritable', emoji: '😤' },
  { label: 'Calm', emoji: '😌' },
  { label: 'Energetic', emoji: '⚡' },
  { label: 'Tired', emoji: '😴' },
  { label: 'Sensitive', emoji: '🥺' },
  { label: 'Confident', emoji: '💪' },
  { label: 'Misty', emoji: '🌫️' },
];

interface Props {
  date?: string;
  existingLog?: any;
  onClose: () => void;
}

export default function LogModal({ date, existingLog, onClose }: Props) {
  const saveLog = useAppStore(s => s.saveLog);
  const deleteLog = useAppStore(s => s.deleteLog);
  const addToast = useAppStore(s => s.addToast);
  const [selectedMoods, setSelectedMoods] = useState<string[]>(existingLog?.mood || []);

  const defaultDate = date || format(new Date(), 'yyyy-MM-dd');

  const { register, handleSubmit, setValue, watch } = useForm<LogFormData>({
    defaultValues: {
      date: defaultDate,
      cramps: existingLog?.cramps || 0,
      bloating: existingLog?.bloating || false,
      headache: existingLog?.headache || false,
      breastTenderness: existingLog?.breastTenderness || false,
      fatigue: existingLog?.fatigue || 0,
      acne: existingLog?.acne || false,
      libido: existingLog?.libido || null,
      sleepQuality: existingLog?.sleepQuality || null,
      waterIntake: existingLog?.waterIntake || null,
      exercise: existingLog?.exercise || '',
      sexualActivity: existingLog?.sexualActivity || false,
      contraception: existingLog?.contraception || '',
      notes: existingLog?.notes || '',
      periodStart: existingLog?.periodStart || false,
      periodEnd: existingLog?.periodEnd || false,
    },
  });

  const onSubmit = async (data: LogFormData) => {
    await saveLog({ ...data, mood: selectedMoods });
    addToast('Log saved!', 'success');
    onClose();
  };

  const handleDelete = async () => {
    if (confirm('Delete this log?')) {
      await deleteLog(defaultDate);
      addToast('Log deleted', 'info');
      onClose();
    }
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const cramps = watch('cramps');
  const fatigue = watch('fatigue');
  const waterIntake = watch('waterIntake');
  const sleepQuality = watch('sleepQuality');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {existingLog ? 'Edit Log' : 'Log Symptoms'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              {...register('date')}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          {/* Period flags */}
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
            <p className="text-xs text-rose-600 font-medium mb-3">Period tracking</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 bg-white rounded-lg cursor-pointer hover:bg-rose-50 border border-rose-100">
                <input type="checkbox" {...register('periodStart')} className="w-4 h-4 rounded text-rose-500" />
                <span className="text-sm text-rose-700 font-medium">Period Started</span>
              </label>
              <label className="flex items-center gap-2 p-3 bg-white rounded-lg cursor-pointer hover:bg-rose-50 border border-rose-100">
                <input type="checkbox" {...register('periodEnd')} className="w-4 h-4 rounded text-rose-500" />
                <span className="text-sm text-rose-700 font-medium">Period Ended</span>
              </label>
            </div>
          </div>

          {/* Cramps */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cramps: {cramps}/3
            </label>
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              {...register('cramps', { valueAsNumber: true })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>None</span>
              <span>Mild</span>
              <span>Moderate</span>
              <span>Severe</span>
            </div>
          </div>

          {/* Fatigue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fatigue: {fatigue}/5
            </label>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              {...register('fatigue', { valueAsNumber: true })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Physical symptoms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Physical Symptoms</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                <input type="checkbox" {...register('bloating')} className="w-4 h-4 rounded text-rose-500" />
                <span className="text-sm text-gray-700">Bloating</span>
              </label>
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                <input type="checkbox" {...register('headache')} className="w-4 h-4 rounded text-rose-500" />
                <span className="text-sm text-gray-700">Headache</span>
              </label>
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                <input type="checkbox" {...register('breastTenderness')} className="w-4 h-4 rounded text-rose-500" />
                <span className="text-sm text-gray-700">Breast Tenderness</span>
              </label>
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                <input type="checkbox" {...register('acne')} className="w-4 h-4 rounded text-rose-500" />
                <span className="text-sm text-gray-700">Acne</span>
              </label>
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mood</label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map(m => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => toggleMood(m.label)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all
                    ${selectedMoods.includes(m.label)
                      ? 'bg-rose-100 text-rose-700 border-2 border-rose-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'}`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Libido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Libido</label>
            <div className="flex gap-2">
              {(['low', 'normal', 'high'] as const).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setValue('libido', watch('libido') === level ? null : level)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize
                    ${watch('libido') === level
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sleep Quality: {sleepQuality || '—'}/5
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setValue('sleepQuality', sleepQuality === q ? null : q)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                    ${sleepQuality === q
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Water Intake */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Water Intake: {waterIntake || 0} glasses
            </label>
            <input
              type="range"
              min={0}
              max={16}
              step={1}
              value={waterIntake || 0}
              onChange={e => setValue('waterIntake', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Exercise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exercise</label>
            <input
              type="text"
              maxLength={64}
              {...register('exercise')}
              placeholder="e.g., yoga, 30min walk"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          {/* Sexual Activity */}
          <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
            <input type="checkbox" {...register('sexualActivity')} className="w-4 h-4 rounded text-rose-500" />
            <span className="text-sm text-gray-700">Sexual Activity</span>
          </label>

          {/* Contraception */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraception <span className="text-xs text-gray-400">(encrypted)</span>
            </label>
            <input
              type="text"
              {...register('contraception')}
              placeholder="e.g., pill, IUD"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-xs text-gray-400">(encrypted at rest)</span>
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Private notes..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {existingLog && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-md"
            >
              {existingLog ? 'Update' : 'Save'} Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
