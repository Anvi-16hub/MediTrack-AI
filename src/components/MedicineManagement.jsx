import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Pill, Clock, X, Save } from 'lucide-react';
import { generateId, formatDate, formatTime } from '../utils/helpers';
import DemoBanner from './DemoBanner';

const SCHEDULE_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const COLORS = ['#0ea5e9', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#f97316', '#6366f1'];

function MedicineForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', condition: '', prescribedBy: '', dosage: '', instructions: '',
    schedule: [], reminderTimes: [], startDate: '', endDate: '', color: '#0ea5e9',
  });

  function toggleSchedule(slot) {
    const times = { Morning: '08:00', Afternoon: '13:00', Evening: '18:00', Night: '21:00' };
    if (form.schedule.includes(slot)) {
      const idx = form.schedule.indexOf(slot);
      setForm(f => ({
        ...f,
        schedule: f.schedule.filter(s => s !== slot),
        reminderTimes: f.reminderTimes.filter((_, i) => i !== idx),
      }));
    } else {
      setForm(f => ({
        ...f,
        schedule: [...f.schedule, slot],
        reminderTimes: [...f.reminderTimes, times[slot]],
      }));
    }
  }

  function setReminderTime(slotIdx, value) {
    setForm(f => {
      const rt = [...f.reminderTimes];
      rt[slotIdx] = value;
      return { ...f, reminderTimes: rt };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return alert('Medicine name is required.');
    if (form.schedule.length === 0) return alert('Select at least one schedule slot.');
    onSave({ ...form, id: form.id || generateId('med') });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{form.id ? 'Edit Medicine' : 'Add Medicine'}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Medicine Name *</label>
              <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Amoxicillin 500mg" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Condition / Use</label>
              <input className="input-field" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} placeholder="e.g. Bacterial Infection" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Prescribed By</label>
              <input className="input-field" value={form.prescribedBy} onChange={e => setForm(f => ({ ...f, prescribedBy: e.target.value }))} placeholder="e.g. Dr. Smith" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Dosage</label>
              <input className="input-field" value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 500mg" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Instructions</label>
              <input className="input-field" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="e.g. Take with food" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Start Date</label>
              <input type="date" className="input-field" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">End Date</label>
              <input type="date" className="input-field" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Color Label</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Prescribed Schedule *</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {SCHEDULE_OPTIONS.map(slot => (
                <button key={slot} type="button"
                  onClick={() => toggleSchedule(slot)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.schedule.includes(slot)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
            {form.schedule.map((slot, i) => (
              <div key={slot} className="flex items-center gap-3 mb-2">
                <span className="text-xs text-gray-500 w-20 flex-shrink-0">{slot} time:</span>
                <input type="time" className="input-field flex-1" value={form.reminderTimes[i] || ''}
                  onChange={e => setReminderTime(i, e.target.value)} />
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            ⚠️ This app does not provide medical advice. Do not change your prescription based on this app. Always follow your doctor's instructions.
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">
              <Save className="w-4 h-4" /> Save Medicine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MedicineManagement({ medicines, onSave, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function handleSave(med) {
    onSave(med);
    setShowForm(false);
    setEditMed(null);
  }

  function handleDelete(id) {
    onDelete(id);
    setConfirmDelete(null);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Medicine Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Add and manage your prescribed medicines</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditMed(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Add Medicine
        </button>
      </div>

      <DemoBanner />

      {medicines.length === 0 ? (
        <div className="card text-center py-12">
          <Pill className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No medicines added yet.</p>
          <button className="btn-primary mt-4 mx-auto" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Add Your First Medicine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {medicines.map(med => (
            <div key={med.id} className="card hover:shadow-md transition-shadow">
              {/* Color bar + name */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: med.color || '#0ea5e9' }} />
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{med.name}</h3>
                    <p className="text-xs text-gray-400">{med.condition || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditMed(med); setShowForm(true); }}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirmDelete(med.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5 text-gray-400" />
                  <span>{med.dosage || '—'} · {med.instructions || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{(med.schedule || []).join(', ') || '—'}</span>
                </div>
                <div className="flex gap-1 flex-wrap mt-2">
                  {(med.reminderTimes || []).map((t, i) => (
                    <span key={i} className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full text-xs">
                      {formatTime(t)} ({med.schedule?.[i] || `Dose ${i+1}`})
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between text-xs text-gray-400">
                <span>Dr. {med.prescribedBy?.replace(/^Dr\.\s*/, '') || '—'}</span>
                <span>{formatDate(med.startDate)} → {formatDate(med.endDate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Medicine form modal */}
      {showForm && (
        <MedicineForm
          initial={editMed}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditMed(null); }}
        />
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-2">Delete Medicine?</h3>
            <p className="text-sm text-gray-500 mb-4">This will remove the medicine and all its dose records. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="btn-danger flex-1 justify-center">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

