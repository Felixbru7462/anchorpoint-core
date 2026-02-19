import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface DisputePortalProps {
  job: any;
  onBack: () => void;
  onComplete: () => void;
}

export function DisputePortal({ job, onBack, onComplete }: DisputePortalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '', 
    failedObjectives: [] as string[], 
    resolution: '', 
    severity: 'Moderate', 
    utilitiesAvailable: true, 
    accessProvided: true, 
    description: ''
  });

  const categories = ["No-Show", "Late Arrival", "Incomplete", "Poor Quality", "Wrong Service", "Damage", "Safety"];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Log the structured dispute
      const { error: disputeError } = await supabase.from('disputes').insert({
        job_id: job.id, 
        category: formData.category, 
        failed_objectives: formData.failedObjectives,
        severity: formData.severity, 
        access_issues: { utilities: formData.utilitiesAvailable, access: formData.accessProvided },
        description: formData.description
      });
      if (disputeError) throw disputeError;

      // 2. Flag the job
      const { error: jobError } = await supabase.from('jobs')
        .update({ status: 'FLAGGED' })
        .eq('id', job.id);
      if (jobError) throw jobError;

      onComplete();
    } catch (err) {
      console.error(err);
      alert("Failed to submit dispute.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', background: '#050505', minHeight: '100vh', color: 'white', fontFamily: 'monospace' }}>
      <button onClick={onBack} style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '10px 20px', cursor: 'pointer', marginBottom: '20px' }}>← EXIT DISPUTE</button>
      <div style={{ maxWidth: '600px', margin: '0 auto', border: '1px solid #333', padding: '30px', background: '#0a0a0a' }}>
        <h2 style={{ color: 'red', marginTop: 0 }}>STRUCTURED DISPUTE</h2>
        <p style={{ color: '#444', fontSize: '0.8em' }}>ID: {job.id}</p>

        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '1em', marginBottom: '20px' }}>1. PRIMARY FAILURE CATEGORY</h3>
            {categories.map(c => (
              <button key={c} onClick={() => { setFormData({...formData, category: c}); setStep(2); }}
                style={{ width: '100%', padding: '15px', textAlign: 'left', background: '#111', border: '1px solid #222', color: 'white', marginBottom: '10px', cursor: 'pointer' }}>{c}</button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '1em' }}>2. FAILED OBJECTIVES</h3>
            <div style={{ background: '#000', padding: '20px', border: '1px solid #333', marginBottom: '20px' }}>
              {job.objectives?.length > 0 ? job.objectives.map((obj: string) => (
                <div key={obj} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <input type="checkbox" onChange={(e) => {
                    const next = e.target.checked ? [...formData.failedObjectives, obj] : formData.failedObjectives.filter(o => o !== obj);
                    setFormData({...formData, failedObjectives: next});
                  }} />
                  <span style={{ fontSize: '0.9em' }}>{obj}</span>
                </div>
              )) : <div style={{color: '#666'}}>No specific objectives defined for this job.</div>}
            </div>
            <button onClick={() => setStep(3)} style={{ width: '100%', padding: '15px', background: 'white', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>NEXT</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '1em' }}>3. RESOLUTION & CONTEXT</h3>
            <select onChange={e => setFormData({...formData, resolution: e.target.value})}
              style={{ width: '100%', padding: '15px', background: '#111', color: 'white', border: '1px solid #333', marginBottom: '20px' }}>
              <option value="">Select Action...</option>
              <option value="revisit">Vendor Must Revisit</option>
              <option value="refund">Partial Refund/Credit</option>
              <option value="new_vendor">Re-assign to New Vendor</option>
            </select>
            <textarea placeholder="Specifics for the audit trail..." onChange={e => setFormData({...formData, description: e.target.value})}
              style={{ width: '100%', padding: '15px', background: '#000', color: 'white', border: '1px solid #333', height: '100px', marginBottom: '20px' }} />
            <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '15px', background: 'red', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
              {loading ? 'COMMITTING...' : 'COMMIT DISPUTE'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}