import React from 'react';
import { Pill, CalendarCheck, CheckCircle2, XCircle, TrendingUp, Clock } from 'lucide-react';
import { computeStats, todayStr, getAdherenceColor, getAdherenceBg } from '../utils/helpers';
import DemoBanner from './DemoBanner';

function StatCard({ icon: Icon, label, value, sub, colorClass, bgClass }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${bgClass || 'bg-primary-100'}`}>
        <Icon className={`w-6 h-6 ${colorClass || 'text-primary-600'}`} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard({ medicines, doseRecords, onNavigate }) {
  const today = todayStr();
  const todayRecords = doseRecords.filter(r => r.date === today);
  const allTimeStats = computeStats(doseRecords, null);
  const todayStats = computeStats(todayRecords, null);

  // Count today's scheduled doses from medicines
  const totalScheduledToday = medicines.reduce((sum, m) => sum + (m.schedule?.length || 0), 0);

  // Upcoming doses today (not yet recorded)
  const upcomingToday = medicines.flatMap(med =>
    (med.reminderTimes || []).map((time, i) => ({
      medicineId: med.id,
      medicineName: med.name,
      slot: med.schedule?.[i] || `Dose ${i + 1}`,
      time,
      color: med.color || '#0ea5e9',
    }))
  ).filter(dose => {
    const alreadyRecorded = todayRecords.find(
      r => r.medicineId === dose.medicineId && r.slot === dose.slot
    );
    return !alreadyRecorded;
  }).sort((a, b) => a.time.localeCompare(b.time));

  const adherencePct = allTimeStats.adherence;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          className="btn-primary hidden sm:flex"
          onClick={() => onNavigate('tracking')}
        >
          <CheckCircle2 className="w-4 h-4" />
          Log Dose
        </button>
      </div>

      <DemoBanner />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          icon={Pill}
          label="Total Medicines"
          value={medicines.length}
          sub="In your medication list"
          bgClass="bg-primary-100"
          colorClass="text-primary-600"
        />
        <StatCard
          icon={CalendarCheck}
          label="Scheduled Today"
          value={totalScheduledToday}
          sub="Doses across all medicines"
          bgClass="bg-teal-100"
          colorClass="text-teal-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Taken Today"
          value={todayStats.taken}
          sub="Confirmed by you"
          bgClass="bg-green-100"
          colorClass="text-green-600"
        />
        <StatCard
          icon={XCircle}
          label="Missed Today"
          value={todayStats.missed}
          sub="Recorded as missed"
          bgClass="bg-red-100"
          colorClass="text-red-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Overall Adherence"
          value={`${adherencePct}%`}
          sub="Based on all recorded doses"
          bgClass={adherencePct >= 85 ? 'bg-teal-100' : adherencePct >= 70 ? 'bg-yellow-100' : 'bg-red-100'}
          colorClass={adherencePct >= 85 ? 'text-teal-600' : adherencePct >= 70 ? 'text-yellow-600' : 'text-red-500'}
        />
        <StatCard
          icon={Clock}
          label="Pending Today"
          value={upcomingToday.length}
          sub="Doses not yet logged"
          bgClass="bg-purple-100"
          colorClass="text-purple-600"
        />
      </div>

      {/* Adherence progress bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700">Overall Adherence Rate</h3>
          <span className={`text-lg font-bold ${getAdherenceColor(adherencePct)}`}>{adherencePct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getAdherenceBg(adherencePct)}`}
            style={{ width: `${adherencePct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>0%</span>
          <span className="text-yellow-500 font-medium">70% — Good</span>
          <span className="text-teal-500 font-medium">85% — Excellent</span>
          <span>100%</span>
        </div>
        <p className="text-xs text-gray-400 mt-3 italic">
          ℹ️ This is a demo calculation based on fictional sample data. It is not a clinical measurement.
        </p>
      </div>

      {/* Upcoming doses */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Pending Doses Today</h3>
          <button className="text-xs text-primary-600 hover:underline" onClick={() => onNavigate('tracking')}>
            Log doses →
          </button>
        </div>
        {upcomingToday.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">All doses for today have been logged!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingToday.map((dose, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dose.color }} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{dose.medicineName}</p>
                    <p className="text-xs text-gray-400">{dose.slot}</p>
                  </div>
                </div>
                <span className="badge-pending">{dose.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Add Medicine', page: 'medicines', color: 'bg-primary-50 text-primary-700 hover:bg-primary-100' },
          { label: 'Log a Dose', page: 'tracking', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
          { label: 'View Analytics', page: 'analytics', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
          { label: 'View Reports', page: 'reports', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
        ].map(link => (
          <button
            key={link.page}
            onClick={() => onNavigate(link.page)}
            className={`rounded-xl p-4 text-sm font-medium transition-colors ${link.color}`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </div>
  );
}

