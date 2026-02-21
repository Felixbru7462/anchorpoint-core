import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface DisputePortalProps {
  job: any;
  onClose: () => void;
  onDisputeFiled: () => void;
}

const CATEGORIES = [
  'Work not completed',
  'Work done incorrectly',
  'No-show / access issue',
  'Property damage',
  'Safety concern',
  'Other',
];

const SEVERITIES = ['low', 'medium', 'high', 'critical'];

export function DisputePortal({ job, onClose, onDisputeFiled }: DisputePortalProps) {
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [failedObjectives, setFailedObjectives] = useState('');
  const [accessIssues, setAccessIssues] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!category) return alert('Please select a category.');
    if (!description) return alert('Please describe the issue.');
    setLoading(true);

    try {
      const { error: disputeError } = await supabase.from('disputes').insert({
        job_id: job.id,
        category,
        severity,
        failed_objectives: failedObjectives || null,
        access_issues: accessIssues || null,
        description,
      });

      if (disputeError) throw disputeError;

      await supabase.from('jobs').update({ status: 'FLAGGED' }).eq('id', job.id);

      onDisputeFiled();
      onClose();
    } catch (err: any) {
      alert('Failed to file dispute: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const severityColor = (s: string, active: boolean) => {
    if (!active) return { color: '#555', border: '1px solid #333', background: 'transparent' };
    const colors: Record<string, string> = { low: '#4488ff', medium: '#ffaa00', high: '#ff6600', critical: '#ff2222' };
    return { color: colors[s], border: `1px solid ${colors[s]}`, background: 'transparent' };
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#0a0a0a', border: '1px solid #ff222244', borderRadius: '8px', padding: '30px', width: '100%', maxWidth: '480px', color: 'white', fontFamily: 'sans-serif', maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9rem', letterSpacing: '1px', color: '#ff4444' }}>FILE A DISPUTE</h3>
            <p style={{ margin: '4px 0 0 0', color: '#555', fontSize: '0.8rem' }}>{job.description}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
        </div>

        <label style={labelStyle}>CATEGORY *</label>
        <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
          <option value="">— Select category —</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label style={labelStyle}>SEVERITY</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {SEVERITIES.map(s => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              style={{ flex: 1, padding: '7px 4px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase', ...severityColor(s, severity === s) }}
            >
              {s}
            </button>
          ))}
        </div>

        <label style={labelStyle}>FAILED OBJECTIVES</label>
        <textarea
          value={failedObjectives}
          onChange={e => setFailedObjectives(e.target.value)}
          placeholder="Which objectives were not met?"
          style={{ ...inputStyle, height: '60px', resize: 'vertical' }}
        />

        <label style={labelStyle}>ACCESS ISSUES</label>
        <input
          type="text"
          value={accessIssues}
          onChange={e => setAccessIssues(e.target.value)}
          placeholder="e.g. Vendor couldn't access unit 4B"
          style={inputStyle}
        />

        <label style={labelStyle}>DESCRIPTION *</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe the issue in detail..."
          style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ ...btnDanger, flex: 1 }}>
            {loading ? 'FILING...' : 'FILE DISPUTE'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '11px 14px',
  marginBottom: '16px', background: '#000', border: '1px solid #2a2a2a',
  color: 'white', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box'
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', color: '#555',
  letterSpacing: '1px', marginBottom: '7px'
};
const btnSecondary: React.CSSProperties = {
  background: 'transparent', color: '#666', border: '1px solid #333',
  padding: '10px 18px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.85rem'
};
const btnDanger: React.CSSProperties = {
  background: '#1a0000', color: '#ff4444', border: '1px solid #ff4444',
  padding: '10px 18px', borderRadius: '5px', cursor: 'pointer',
  fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.5px'
};