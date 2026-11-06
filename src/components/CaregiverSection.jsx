import React, { useState } from 'react';
import { Users, Shield, Eye, Edit2, Mail, Phone, AlertTriangle, Lock, CheckCircle2, X } from 'lucide-react';
import DemoBanner from './DemoBanner';

export default function CaregiverSection({ caregiver, onSaveCaregiver, supabaseMode = false }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(caregiver || {
    name: '', relationship: '', email: '', phone: '', accessLevel: 'View Only', consentGiven: false, consentDate: '',
  });

  function handleSave(e) {
    e.preventDefault();
    onSaveCaregiver({ ...form, consentDate: form.consentDate || new Date().toISOString().split('T')[0] });
    setEditing(false);
  }

  function revokeConsent() {
    const updated = { ...caregiver, consentGiven: false };
    onSaveCaregiver(updated);
    setForm(updated);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Caregiver Access</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage who can view your medication data</p>
        </div>
      </div>

      <DemoBanner message={supabaseMode
        ? 'Caregiver access is protected by Supabase Row Level Security. Access is limited to the permissions shown and requires patient consent plus caregiver acceptance.'
        : 'DEMO ONLY — Caregiver access is simulated. No real data sharing or secure authorization is implemented.'} />

      {/* How it would work */}
      <div className="card border-primary-100 bg-primary-50">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-primary-800 mb-2">{supabaseMode ? 'Caregiver access and consent' : 'How Caregiver Access Works (Demo Explanation)'}</h3>
            <ul className="text-sm text-primary-700 space-y-1.5 list-disc list-inside">
              <li>You choose who gets access — a family member, friend, or healthcare provider.</li>
              <li>You set the access level: View Only or Full Access.</li>
              <li>{supabaseMode ? 'The invitation is limited to an existing MediTrack account and must be accepted by that account.' : 'Your caregiver would receive a secure invite (not implemented in demo).'}</li>
              <li>You can revoke access at any time.</li>
              <li><strong>Your explicit consent is required</strong> before any data is shared.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Important disclaimer */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-700">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
        <div>
          {supabaseMode
            ? <><strong>Permission boundary:</strong> The caregiver cannot access records until the invitation is accepted. Revoking consent removes access through RLS.</>
            : <><strong>Not implemented:</strong> Real caregiver access requires secure server-side authorization. This demo only simulates the UI. <strong>No data is actually shared</strong> with anyone in this demo.</>}
        </div>
      </div>

      {/* Caregiver card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-700">{supabaseMode ? 'Caregiver invitation' : 'Demo Caregiver'}</h3>
          </div>
          {!editing && (
            <button onClick={() => { setForm(caregiver || { name: '', relationship: '', email: '', phone: '', accessLevel: 'View Only', consentGiven: false, consentDate: '' }); setEditing(true); }} className="btn-secondary text-xs py-1.5 px-3">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name</label>
                <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Caregiver name" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Relationship (optional)</label>
                <input className="input-field" value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} placeholder="e.g. Family member" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">{supabaseMode ? 'MediTrack account email' : 'Email (Demo)'}</label>
                <input type="email" className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Phone (optional)</label>
                <input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555 000 0000" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Access Level</label>
                <select className="input-field" value={form.accessLevel} onChange={e => setForm(f => ({ ...f, accessLevel: e.target.value }))}>
                  <option>View Only</option>
                  <option>Full Access</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="consent" checked={form.consentGiven} onChange={e => setForm(f => ({ ...f, consentGiven: e.target.checked }))} className="rounded" />
              <label htmlFor="consent" className="text-sm text-gray-700">
                {supabaseMode ? 'I consent to sharing the selected medication records with this account.' : 'I consent to demo sharing (Demo only — no real sharing occurs)'}
              </label>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1 justify-center">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button type="submit" className="btn-primary flex-1 justify-center">
                <CheckCircle2 className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {caregiver?.name ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xl text-primary-600 font-bold">
                      {caregiver.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{caregiver.name}</p>
                    <p className="text-sm text-gray-400">{caregiver.relationship}</p>
                  </div>
                  <div className="ml-auto">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      caregiver.consentGiven
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {caregiver.status === 'active' ? '✓ Access Active' : caregiver.consentGiven ? 'Invitation Pending' : '✗ No Consent'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {caregiver.email || '—'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {caregiver.phone || '—'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Eye className="w-4 h-4 text-gray-400" />
                    Access Level: <strong>{caregiver.accessLevel}</strong>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="w-4 h-4 text-gray-400" />
                    Consent Date: {caregiver.consentDate || '—'}
                  </div>
                </div>

                {caregiver.consentGiven && (
                  <button onClick={revokeConsent}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 underline flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {supabaseMode ? 'Revoke access' : 'Revoke Consent (Demo)'}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No caregiver set up. Click Edit to add one.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* What data would be shared */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-500" />
          {supabaseMode ? 'Permission scope' : 'What a Caregiver Would See (Demo Mockup)'}
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          {[
            { label: 'Medication List', perm: 'View Only' },
            { label: 'Today\'s Dose Status', perm: 'View Only' },
            { label: 'Weekly Adherence Summary', perm: 'View Only' },
            { label: 'Missed Dose Alerts', perm: 'View Only' },
            { label: 'Add/Edit Medicines', perm: 'Full Access only' },
            { label: 'Mark Doses', perm: 'Full Access only' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span>{item.label}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.perm}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 italic">
          🔒 In a production app, all data sharing would be encrypted and require a secure login from the caregiver.
        </p>
      </div>
    </div>
  );
}

