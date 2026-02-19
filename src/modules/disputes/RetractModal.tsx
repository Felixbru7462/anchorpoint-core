import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface RetractModalProps {
  job: any;
  onCancel: () => void;
  onComplete: () => void;
}

export function RetractModal({ job, onCancel, onComplete }: RetractModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRetract = async () => {
    if (!reason) return alert("Please provide a reason for the retraction.");
    setLoading(true);

    try {
      // 1. Update the dispute ledger (The Truth Vault)
      const { error: disputeError } = await supabase.from('disputes')
        .update({ retraction_reason: reason, resolved_at: new Date() })
        .eq('job_id', job.id);
      
      if (disputeError) throw disputeError;

      // 2. Move job to VERIFIED (Permanent Record)
      const { error: jobError } = await supabase.from('jobs')
        .update({ status: 'VERIFIED' })
        .eq('id', job.id);

      if (jobError) throw jobError;

      onComplete();
    } catch (error) {
      console.error('Retraction failed:', error);
      alert('Error processing retraction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#0a0a0a', border: '1px solid lime', padding: '30px', maxWidth: '500px', width: '90%', boxShadow: '0 0 30px rgba(0,255,0,0.1)', color: 'white', fontFamily: 'monospace' }}>
        <h3 style={{ color: 'lime', marginTop: 0, fontSize: '1.2em' }}>RETRACT DISPUTE & VERIFY</h3>
        <p style={{ fontSize: '0.85em', color: '#888', lineHeight: '1.4' }}>
          This will move the job to the **Verified Vault**. You must provide a reason for the record (e.g., "Vendor returned and fixed the leak" or "Negotiated 20% credit").
        </p>
        
        <textarea 
          placeholder="Reason for resolution..." 
          value={reason}
          onChange={e => setReason(e.target.value)}
          style={{ width: '100%', height: '100px', background: '#000', color: 'white', border: '1px solid #333', padding: '15px', marginBottom: '20px', fontSize: '0.9em' }}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} disabled={loading} style={{ flex: 1, padding: '12px', background: 'none', border: '1px solid #333', color: '#888', cursor: 'pointer' }}>CANCEL</button>
          <button onClick={handleRetract} disabled={loading} style={{ flex: 1, padding: '12px', background: 'lime', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
            {loading ? 'PROCESSING...' : 'VERIFY & VAULT'}
          </button>
        </div>
      </div>
    </div>
  );
}