import React, { useState } from 'react';
import { FileText, Download, Calendar, TrendingUp, CheckCircle2, XCircle, Pill, Target } from 'lucide-react';
import {
  buildDailyChartData, getLast7Days, getLast30Days,
  computeStats, getMostMissedMedicines, getMostMissedSlots,
  formatDate, getShortDate,
} from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import DemoBanner from './DemoBanner';

function ReportCard({ title, children }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary-500" />
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function Reports({ medicines, doseRecords }) {
  const [period, setPeriod] = useState('weekly');

  const days = period === 'weekly' ? getLast7Days() : getLast30Days();
  const rangeRecords = doseRecords.filter(r => days.includes(r.date));
  const stats = computeStats(rangeRecords, null);
  const chartData = buildDailyChartData(doseRecords, days);
  const missedMeds = getMostMissedMedicines(rangeRecords);
  const missedSlots = getMostMissedSlots(rangeRecords);

  // Per-medicine adherence
  const perMedStats = medicines.map(med => {
    const recs = rangeRecords.filter(r => r.medicineId === med.id);
    const taken = recs.filter(r => r.status === 'taken').length;
    const missed = recs.filter(r => r.status === 'missed').length;
    const total = taken + missed;
    const pct = total > 0 ? Math.round((taken / total) * 100) : 0;
    return { ...med, taken, missed, total, pct };
  });

  const startDate = days[0];
  const endDate = days[days.length - 1];

  function handleDownload() {
    const lines = [
      `MediTrack AI — ${period === 'weekly' ? 'Weekly' : 'Monthly'} Adherence Report`,
      `Period: ${formatDate(startDate)} to ${formatDate(endDate)}`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `DISCLAIMER: This report is based on fictional demo data for demonstration purposes only.`,
      `It is NOT a medical document. Do not use it for clinical decisions.`,
      ``,
      `--- SUMMARY ---`,
      `Total Doses Scheduled: ${stats.total}`,
      `Taken: ${stats.taken}`,
      `Missed: ${stats.missed}`,
      `Overall Adherence: ${stats.adherence}%`,
      ``,
      `--- PER-MEDICINE BREAKDOWN ---`,
      ...perMedStats.map(m => `${m.name}: ${m.taken} taken, ${m.missed} missed (${m.pct}% adherence)`),
      ``,
      `--- MOST MISSED MEDICINES ---`,
      ...(missedMeds.length > 0 ? missedMeds.map(m => `${m.name}: ${m.count} times`) : ['None']),
      ``,
      `--- MOST MISSED SLOTS ---`,
      ...(missedSlots.length > 0 ? missedSlots.map(s => `${s.slot}: ${s.count} times`) : ['None']),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediTrack_Report_${period}_${endDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Adherence summaries for review</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setPeriod('weekly')}
              className={`text-sm px-4 py-1.5 rounded-md transition-colors ${period === 'weekly' ? 'bg-white shadow text-primary-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >Weekly</button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`text-sm px-4 py-1.5 rounded-md transition-colors ${period === 'monthly' ? 'bg-white shadow text-primary-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >Monthly</button>
          </div>
          <button onClick={handleDownload} className="btn-secondary text-sm">
            <Download className="w-4 h-4" /> Download Report
          </button>
        </div>
      </div>

      <DemoBanner />

      {/* Period header banner */}
      <div
        style={{ background: 'linear-gradient(to right, #0284c7, #0d9488)' }}
        className="rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" style={{ opacity: 0.85 }} />
          <div>
            <p className="text-sm font-medium" style={{ opacity: 0.85 }}>
              {period === 'weekly' ? 'Weekly' : 'Monthly'} Adherence Report
            </p>
            <p className="text-lg font-bold tracking-tight">
              {formatDate(startDate)} — {formatDate(endDate)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold">{stats.adherence}%</p>
          <p className="text-xs" style={{ opacity: 0.8 }}>Overall Adherence</p>
        </div>
      </div>

      {/* Four summary stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1 – Total Scheduled Doses */}
        <div className="card flex items-start gap-4 border-l-4" style={{ borderLeftColor: '#0284c7' }}>
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#e0f2fe' }}>
            <Pill className="w-6 h-6" style={{ color: '#0284c7' }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Scheduled</p>
            <p className="text-3xl font-extrabold text-gray-800 leading-none mt-1">{stats.total}</p>
            <p className="text-xs text-gray-400 mt-1">doses in period</p>
          </div>
        </div>

        {/* Card 2 – Taken */}
        <div className="card flex items-start gap-4 border-l-4" style={{ borderLeftColor: '#0d9488' }}>
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#ccfbf1' }}>
            <CheckCircle2 className="w-6 h-6" style={{ color: '#0d9488' }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Taken</p>
            <p className="text-3xl font-extrabold leading-none mt-1" style={{ color: '#0d9488' }}>{stats.taken}</p>
            <p className="text-xs text-gray-400 mt-1">confirmed doses</p>
          </div>
        </div>

        {/* Card 3 – Missed */}
        <div className="card flex items-start gap-4 border-l-4" style={{ borderLeftColor: '#ef4444' }}>
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#fee2e2' }}>
            <XCircle className="w-6 h-6" style={{ color: '#ef4444' }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Missed</p>
            <p className="text-3xl font-extrabold leading-none mt-1" style={{ color: '#ef4444' }}>{stats.missed}</p>
            <p className="text-xs text-gray-400 mt-1">recorded missed</p>
          </div>
        </div>

        {/* Card 4 – Adherence % */}
        <div
          className="card flex items-start gap-4 border-l-4"
          style={{
            borderLeftColor:
              stats.adherence >= 85 ? '#0d9488' :
              stats.adherence >= 70 ? '#d97706' : '#ef4444',
          }}
        >
          <div
            className="p-2.5 rounded-xl"
            style={{
              backgroundColor:
                stats.adherence >= 85 ? '#ccfbf1' :
                stats.adherence >= 70 ? '#fef3c7' : '#fee2e2',
            }}
          >
            <Target
              className="w-6 h-6"
              style={{
                color:
                  stats.adherence >= 85 ? '#0d9488' :
                  stats.adherence >= 70 ? '#d97706' : '#ef4444',
              }}
            />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Adherence</p>
            <p
              className="text-3xl font-extrabold leading-none mt-1"
              style={{
                color:
                  stats.adherence >= 85 ? '#0d9488' :
                  stats.adherence >= 70 ? '#d97706' : '#ef4444',
              }}
            >
              {stats.adherence}%
            </p>
            {/* Mini progress bar */}
            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${stats.adherence}%`,
                  backgroundColor:
                    stats.adherence >= 85 ? '#0d9488' :
                    stats.adherence >= 70 ? '#d97706' : '#ef4444',
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {stats.taken} / {stats.total} doses taken
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ReportCard title={`Daily Adherence — ${period === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}`}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={period === 'weekly' ? 'label' : 'shortDate'} tick={{ fontSize: 11 }} interval={period === 'monthly' ? 4 : 0} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(val, name) => [val, name === 'taken' ? 'Taken' : 'Missed']} />
            <Legend formatter={v => v === 'taken' ? 'Taken' : 'Missed'} />
            <Bar dataKey="taken" fill="#14b8a6" radius={[3, 3, 0, 0]} name="taken" />
            <Bar dataKey="missed" fill="#ef4444" radius={[3, 3, 0, 0]} name="missed" />
          </BarChart>
        </ResponsiveContainer>
      </ReportCard>

      {/* Per-medicine */}
      <ReportCard title="Per-Medicine Adherence">
        {perMedStats.length === 0 ? (
          <p className="text-gray-400 text-sm">No medicines found.</p>
        ) : (
          <div className="space-y-4">
            {perMedStats.map(med => (
              <div key={med.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: med.color || '#0ea5e9' }} />
                    <span className="text-sm font-medium text-gray-700">{med.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="text-teal-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{med.taken}</span>
                    <span className="text-red-500 flex items-center gap-1"><XCircle className="w-3 h-3" />{med.missed}</span>
                    <span className={`font-bold ${med.pct >= 85 ? 'text-teal-600' : med.pct >= 70 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {med.pct}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${med.pct >= 85 ? 'bg-teal-500' : med.pct >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${med.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </ReportCard>

      {/* Pattern summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportCard title="Most Missed Medicines">
          {missedMeds.length === 0
            ? <p className="text-gray-400 text-sm">No missed doses 🎉</p>
            : missedMeds.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                <span className="text-gray-700">{m.name}</span>
                <span className="badge-missed">{m.count}×</span>
              </div>
            ))
          }
        </ReportCard>
        <ReportCard title="Most Missed Time Slots">
          {missedSlots.length === 0
            ? <p className="text-gray-400 text-sm">No missed slots 🎉</p>
            : missedSlots.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                <span className="text-gray-700">{s.slot}</span>
                <span className="badge-missed">{s.count}×</span>
              </div>
            ))
          }
        </ReportCard>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
        ⚠️ <strong>Report Disclaimer:</strong> This report is generated from fictional demo data for demonstration purposes only. It is not a medical document and should not be used for clinical decisions. Always consult your healthcare provider regarding your medication adherence.
      </div>
    </div>
  );
}

