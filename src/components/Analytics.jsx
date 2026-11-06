import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { TrendingUp, AlertTriangle, Brain, Info } from 'lucide-react';
import {
  buildDailyChartData, getLast7Days, computeStats,
  getMostMissedMedicines, getMostMissedSlots,
} from '../utils/helpers';
import DemoBanner from './DemoBanner';

const COLORS_PIE = ['#14b8a6', '#ef4444'];

function InsightCard({ icon: Icon, title, text, color }) {
  return (
    <div className={`rounded-xl border p-4 ${color || 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0 text-current" />
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs mt-1 text-current opacity-80">{text}</p>
        </div>
      </div>
    </div>
  );
}

export default function Analytics({ doseRecords }) {
  const [range, setRange] = useState('7');
  const days = getLast7Days();
  const chartData = buildDailyChartData(doseRecords, days);
  const stats = computeStats(doseRecords, days);
  const mostMissedMeds = getMostMissedMedicines(doseRecords.filter(r => days.includes(r.date)));
  const mostMissedSlots = getMostMissedSlots(doseRecords.filter(r => days.includes(r.date)));

  const pieData = [
    { name: 'Taken', value: stats.taken },
    { name: 'Missed', value: stats.missed },
  ];

  // Demo AI insights – clearly labeled as demo analysis
  function generateInsights() {
    const insights = [];
    if (mostMissedSlots[0]) {
      insights.push({
        icon: AlertTriangle,
        title: `Most missed slot: ${mostMissedSlots[0].slot}`,
        text: `You missed ${mostMissedSlots[0].count} dose(s) during the ${mostMissedSlots[0].slot} slot this week. Consider setting an extra reminder.`,
        color: 'bg-amber-50 border-amber-200 text-amber-800',
      });
    }
    if (mostMissedMeds[0]) {
      insights.push({
        icon: AlertTriangle,
        title: `Most missed medicine: ${mostMissedMeds[0].name}`,
        text: `This medicine was missed ${mostMissedMeds[0].count} time(s) this week. Speak with your doctor if you're having difficulty remembering it.`,
        color: 'bg-red-50 border-red-200 text-red-700',
      });
    }
    if (stats.adherence >= 85) {
      insights.push({
        icon: TrendingUp,
        title: 'Great adherence this week!',
        text: `Your adherence rate is ${stats.adherence}%. Keep up the excellent work staying consistent with your prescriptions.`,
        color: 'bg-teal-50 border-teal-200 text-teal-800',
      });
    } else if (stats.adherence >= 70) {
      insights.push({
        icon: Info,
        title: 'Good adherence, room to improve',
        text: `Your adherence is ${stats.adherence}% this week. Try linking dose times to daily habits like meals or bedtime.`,
        color: 'bg-blue-50 border-blue-200 text-blue-800',
      });
    } else {
      insights.push({
        icon: AlertTriangle,
        title: 'Low adherence detected',
        text: `Your adherence is ${stats.adherence}% this week. Talk to your healthcare provider about strategies to improve consistency.`,
        color: 'bg-red-50 border-red-200 text-red-700',
      });
    }
    // Best day
    const best = [...chartData].sort((a, b) => b.adherence - a.adherence)[0];
    if (best && best.total > 0) {
      insights.push({
        icon: TrendingUp,
        title: `Best day this week: ${best.label} (${best.shortDate})`,
        text: `You achieved ${best.adherence}% adherence with ${best.taken} doses taken.`,
        color: 'bg-green-50 border-green-200 text-green-800',
      });
    }
    return insights;
  }

  const insights = generateInsights();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Adherence Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Visual breakdown of your dose history</p>
        </div>
      </div>

      <DemoBanner />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Doses', value: stats.total, color: 'text-gray-800' },
          { label: 'Taken', value: stats.taken, color: 'text-teal-600' },
          { label: 'Missed', value: stats.missed, color: 'text-red-500' },
          { label: 'Adherence', value: `${stats.adherence}%`, color: stats.adherence >= 85 ? 'text-teal-600' : stats.adherence >= 70 ? 'text-yellow-600' : 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">Daily Taken vs Missed (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(val, name) => [val, name === 'taken' ? 'Taken' : 'Missed']}
              labelFormatter={label => `Day: ${label}`}
            />
            <Legend formatter={v => v === 'taken' ? 'Taken' : 'Missed'} />
            <Bar dataKey="taken" fill="#14b8a6" radius={[4, 4, 0, 0]} name="taken" />
            <Bar dataKey="missed" fill="#ef4444" radius={[4, 4, 0, 0]} name="missed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Taken vs Missed Breakdown</h3>
          {stats.total === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line chart – adherence trend */}
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Daily Adherence % Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={v => [`${v}%`, 'Adherence']} labelFormatter={l => `Day: ${l}`} />
              <Line type="monotone" dataKey="adherence" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Most-missed tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3">Most Missed Medicines</h3>
          {mostMissedMeds.length === 0 ? (
            <p className="text-gray-400 text-sm">No missed doses this week 🎉</p>
          ) : (
            <div className="space-y-2">
              {mostMissedMeds.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{m.name}</span>
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{m.count} missed</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3">Most Missed Time Slots</h3>
          {mostMissedSlots.length === 0 ? (
            <p className="text-gray-400 text-sm">No missed slots this week 🎉</p>
          ) : (
            <div className="space-y-2">
              {mostMissedSlots.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{s.slot}</span>
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{s.count} missed</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Demo AI Insights */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-700">Demo AI Insights</h3>
          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">DEMO ANALYSIS</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-700">
          ⚠️ The following insights are auto-generated based on demo data patterns. This is NOT clinical analysis and should NOT be used to make medical decisions. Always consult your healthcare provider.
        </div>
        <div className="space-y-3">
          {insights.map((ins, i) => (
            <InsightCard key={i} {...ins} />
          ))}
        </div>
      </div>
    </div>
  );
}

