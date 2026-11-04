import type { Entry, SymptomLog } from './cycle';
import { INTENSITY_LABELS } from './cycle';

function csvEscape(v: string | number | null | undefined | boolean): string {
  if (v === null || v === undefined || v === '') return '';
  const s = String(v);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportCSV(entries: Entry[], logs: SymptomLog[]): string {
  const headers = [
    'Date', 'Period Start', 'Period End', 'Flow',
    'Cramps (0-3)', 'Bloating', 'Headache', 'Breast Tenderness',
    'Fatigue (0-5)', 'Acne', 'Libido', 'Moods',
    'Sleep Quality (1-5)', 'Water Intake', 'Exercise', 'Sexual Activity',
    'Contraception Note', 'Notes'
  ];

  const rows: string[][] = [];
  const logByDate = new Map(logs.map(l => [l.date, l]));

  // Span rows first
  for (const entry of entries) {
    const log = logByDate.get(entry.startDate);
    const row = [
      entry.startDate,
      entry.endDate || '',
      '',
      INTENSITY_LABELS[entry.intensity] || entry.intensity,
      log?.cramps ? String(log.cramps) : '',
      log?.bloating ? 'yes' : '',
      log?.headache ? 'yes' : '',
      log?.breastTenderness ? 'yes' : '',
      log?.fatigue ? String(log.fatigue) : '',
      log?.acne ? 'yes' : '',
      log?.libido || '',
      log?.mood?.join('; ') || '',
      log?.sleepQuality ? String(log.sleepQuality) : '',
      log?.waterIntake ? String(log.waterIntake) : '',
      log?.exercise || '',
      log?.sexualActivity ? 'yes' : '',
      log?.contraception || '',
      entry.notes || log?.notes || '',
    ];
    rows.push(row);
  }

  // Symptom rows for days not covered by spans
  for (const log of logs) {
    const coveredBySpan = entries.some(e => {
      const end = e.endDate || e.startDate;
      return log.date >= e.startDate && log.date <= end;
    });
    if (!coveredBySpan) {
      rows.push([
        log.date,
        '', '', '',
        log.cramps ? String(log.cramps) : '',
        log.bloating ? 'yes' : '',
        log.headache ? 'yes' : '',
        log.breastTenderness ? 'yes' : '',
        log.fatigue ? String(log.fatigue) : '',
        log.acne ? 'yes' : '',
        log.libido || '',
        (log.mood || []).join('; '),
        log.sleepQuality ? String(log.sleepQuality) : '',
        log.waterIntake ? String(log.waterIntake) : '',
        log.exercise || '',
        log.sexualActivity ? 'yes' : '',
        log.contraception || '',
        log.notes || '',
      ]);
    }
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(csvEscape).join(','))
  ].join('\n');

  return csvContent;
}

export function downloadCSV(entries: Entry[], logs: SymptomLog[]) {
  const csv = exportCSV(entries, logs);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bloom-history.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportJSON(entries: Entry[], logs: SymptomLog[], settings: any) {
  const data = {
    settings,
    entries: entries.map(e => ({
      startDate: e.startDate,
      endDate: e.endDate,
      intensity: e.intensity,
      notes: e.notes,
    })),
    symptoms: logs.map(l => ({
      date: l.date,
      cramps: l.cramps,
      bloating: l.bloating,
      headache: l.headache,
      breastTenderness: l.breastTenderness,
      fatigue: l.fatigue,
      acne: l.acne,
      libido: l.libido,
      mood: l.mood,
      sleepQuality: l.sleepQuality,
      waterIntake: l.waterIntake,
      exercise: l.exercise,
      sexualActivity: l.sexualActivity,
      contraception: l.contraception,
      notes: l.notes,
      periodStart: l.periodStart,
      periodEnd: l.periodEnd,
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bloom-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportPDF(entries: Entry[], logs: SymptomLog[]) {
  import('jspdf').then(({ default: jsPDF }) => {
    const doc = new jsPDF();
    let y = 20;
    const lineHeight = 7;
    const margin = 20;
    const pageHeight = 280;

    const checkPage = () => {
      if (y > pageHeight) {
        doc.addPage();
        y = margin;
      }
    };

    doc.setFontSize(18);
    doc.text('Bloom Health Summary', margin, y);
    y += lineHeight * 2;

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`, margin, y);
    y += lineHeight * 2;

    doc.setFontSize(14);
    doc.text('History', margin, y);
    y += lineHeight;

    doc.setFontSize(10);
    for (const entry of entries) {
      checkPage();
      const end = entry.endDate || 'ongoing';
      const line = `${entry.startDate} → ${end}  Flow: ${entry.intensity}  Notes: ${entry.notes || '—'}`;
      doc.text(line.substring(0, 92), margin, y);
      y += lineHeight;
    }

    y += lineHeight;
    checkPage();
    doc.setFontSize(14);
    doc.text('Daily Logs', margin, y);
    y += lineHeight;

    doc.setFontSize(10);
    for (const log of logs) {
      checkPage();
      const parts: string[] = [];
      if (log.cramps) parts.push(`Cramps: ${log.cramps}`);
      if (log.bloating) parts.push('Bloating');
      if (log.headache) parts.push('Headache');
      if (log.fatigue) parts.push(`Fatigue: ${log.fatigue}`);
      if (log.mood.length) parts.push(`Mood: ${log.mood.join(', ')}`);
      const line = `${log.date} - ${parts.join(', ') || 'no symptoms'}`;
      doc.text(line.substring(0, 92), margin, y);
      y += lineHeight;
    }

    doc.save('bloom-health-summary.pdf');
  });
}
