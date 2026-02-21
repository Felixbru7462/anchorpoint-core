import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface RetractModalProps {
  jobId: string;
  disputeId: string;
  onClose: () => void;
  onRetracted: () => void;
}

export function RetractModal({ jobId, disputeId, onClose, onRetracted }: RetractModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRetract() {
    if (!reason.trim()) return alert('Please provide a reason for retracting.');
    setLoading(true);

    try {
      const { error: disputeError } = await supabase
        .from('disputes')
        .update({
          retraction_reason: reason,
          resolution: 'retracted',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', disputeId);

      if (disputeError) throw disputeError;

      await supabase.from('jobs').update({ status: 'COMPLETED' }).eq('id', jobId);

      onRetracted();
      onClose();
    } catch (err: any) {
      alert('Failed to retract: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '30px', width: '100%', maxWidth: '420px', color: 'white', fontFamily: 'sans-serif' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', letterSpacing: '1px' }}>RETRACT DISPUTE</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
        </div>

        <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.5 }}>
          Retracting will restore the job to <span style={{ color: 'lime' }}>COMPLETED</span> status. This is logged and cannot be undone.
        </p>

        <label style={labelStyle}>REASON FOR RETRACTION *</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Issue was resolved directly with the vendor..."
          style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
          <button onClick={handleRetract} disabled={loading} style={{ ...btnPrimary, flex: 1 }}>
            {loading ? 'RETRACTING...' : 'CONFIRM RETRACT'}
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
const btnPrimary: React.CSSProperties = {
  background: '#111', color: 'lime', border: '1px solid lime',
  padding: '10px 18px', borderRadius: '5px', cursor: 'pointer',
  fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.5px'
};
const btnSecondary: React.CSSProperties = {
  background: 'transparent', color: '#666', border: '1px solid #333',
  padding: '10px 18px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.85rem'
};