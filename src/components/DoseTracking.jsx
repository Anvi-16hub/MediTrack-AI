import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Calendar, Pill, AlertTriangle } from 'lucide-react';
import { todayStr, formatTime, formatDate, generateId } from '../utils/helpers';
import DemoBanner from './DemoBanner';

export default function DoseTracking({ medicines, doseRecords, onSaveDose }) {
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const today = todayStr();
  const isToday = selectedDate === today;

  // Build today's dose schedule from medicines
  const scheduledDoses = medicines.flatMap(med =>
    (med.schedule || []).map((slot, i) => ({
      medicineId: med.id,
      medicineName: med.name,
      slot,
      scheduledTime: med.reminderTimes?.[i] || '00:00',
      color: med.color || '#0ea5e9',
      dosage: med.dosage,
      instructions: med.instructions,
    }))
  ).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  // For selected date, check existing records
  const dateRecords = doseRecords.filter(r => r.date === selectedDate);

  function getRecord(medId, slot) {
    return dateRecords.find(r => r.medicineId === medId && r.slot === slot);
  }

  function handleMark(dose, status) {
    const existing = getRecord(dose.medicineId, dose.slot);
    const now = new Date();
    const timeNow = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

    const record = {
      id: existing?.id || generateId('dr'),
      medicineId: dose.medicineId,
      medicineName: dose.medicineName,
      date: selectedDate,
      time: status === 'taken' ? timeNow : null,
      scheduledTime: dose.scheduledTime,
      slot: dose.slot,
      status,
    };
    onSaveDose(record);
  }

  function getSlotIcon(slot) {
    const icons = { Morning: '🌅', Afternoon: '☀️', Evening: '🌆', Night: '🌙' };
    return icons[slot] || '💊';
  }

  // Group by slot
  const slots = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const groupedBySlot = slots.reduce((acc, slot) => {
    const doses = scheduledDoses.filter(d => d.slot === slot);
    if (doses.length > 0) acc[slot] = doses;
    return acc;
  }, {});

  // Other slots not in predefined list
  scheduledDoses.forEach(d => {
    if (!slots.includes(d.slot)) {
      if (!groupedBySlot[d.slot]) groupedBySlot[d.slot] = [];
      groupedBySlot[d.slot].push(d);
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dose Tracking</h2>
          <p className="text-sm text-gray-500 mt-0.5">Mark each dose as taken or missed</p>
        </div>
        {/* Date picker */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            className="input-field w-auto"
            value={selectedDate}
            max={today}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <DemoBanner />

      {/* Important note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-3 text-sm text-blue-800">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 text-blue-500 mt-0.5" />
        <div>
          <strong>Important:</strong> You must manually confirm each dose. A reminder notification being sent does <strong>NOT</strong> mean the dose was taken. Only mark a dose as "Taken" after you have actually taken it.
        </div>
      </div>

      {medicines.length === 0 ? (
        <div className="card text-center py-12">
          <Pill className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No medicines added yet. Add medicines first.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBySlot).map(([slot, doses]) => (
            <div key={slot} className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{getSlotIcon(slot)}</span>
                <h3 className="font-semibold text-gray-700">{slot}</h3>
                <span className="text-xs text-gray-400">({doses[0]?.scheduledTime})</span>
                <div className="flex-1" />
                <span className="text-xs text-gray-400">
                  {doses.filter(d => getRecord(d.medicineId, d.slot)?.status === 'taken').length}/{doses.length} taken
                </span>
              </div>
              <div className="space-y-3">
                {doses.map(dose => {
                  const record = getRecord(dose.medicineId, dose.slot);
                  const status = record?.status;
                  return (
                    <div
                      key={`${dose.medicineId}-${dose.slot}`}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-colors ${
                        status === 'taken'
                          ? 'bg-teal-50 border-teal-200'
                          : status === 'missed'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dose.color }} />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{dose.medicineName}</p>
                          <p className="text-xs text-gray-400">{dose.dosage} · {dose.instructions}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {status && (
                          <span className={status === 'taken' ? 'badge-taken' : 'badge-missed'}>
                            {status === 'taken'
                              ? `✓ Taken ${record?.time ? `at ${formatTime(record.time)}` : ''}`
                              : '✗ Missed'}
                          </span>
                        )}
                        {!status && (
                          <span className="badge-pending">Pending</span>
                        )}
                        <button
                          onClick={() => handleMark(dose, 'taken')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            status === 'taken'
                              ? 'bg-teal-500 text-white'
                              : 'bg-white border border-gray-200 text-gray-400 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-300'
                          }`}
                          title="Mark as Taken"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleMark(dose, 'missed')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            status === 'missed'
                              ? 'bg-red-500 text-white'
                              : 'bg-white border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-300'
                          }`}
                          title="Mark as Missed"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary for selected day */}
      {dateRecords.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3">
            Summary for {formatDate(selectedDate)}
          </h3>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2 text-teal-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>{dateRecords.filter(r => r.status === 'taken').length} taken</span>
            </div>
            <div className="flex items-center gap-2 text-red-500">
              <XCircle className="w-4 h-4" />
              <span>{dateRecords.filter(r => r.status === 'missed').length} missed</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{dateRecords.length} total recorded</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

