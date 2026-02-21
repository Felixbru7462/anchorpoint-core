import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface SmartBookingProps {
  locationId: string;
  onClose: () => void;
  onJobCreated: () => void;
}

export function SmartBooking({ locationId, onClose, onJobCreated }: SmartBookingProps) {
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [vendors, setVendors] = useState<any[]>([]);
  const [locationLabel, setLocationLabel] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [locationId]);

  async function loadData() {
    const { data: loc } = await supabase
      .from('locations')
      .select('label')
      .eq('id', locationId)
      .single();
    if (loc) setLocationLabel(loc.label);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: vendData } = await supabase
      .from('vendors')
      .select('id, company_name, full_name, service_type')
      .eq('owner_id', user.id);
    if (vendData) setVendors(vendData);
  }

  async function handleDispatch() {
    if (!description) return alert('Please describe the issue.');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('jobs').insert({
        owner_id: user.id,
        location_id: locationId,
        vendor_id: selectedVendor || null,
        description,
        objectives: objectives || null,
        amount: amount ? parseFloat(amount) : null,
        status: 'REPORTED',
        payment_status: 'unpaid',
      });

      if (error) throw error;

      onJobCreated();
    } catch (err: any) {
      alert('Failed to create job: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '30px', width: '100%', maxWidth: '480px', color: 'white', fontFamily: 'sans-serif' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9rem', letterSpacing: '1px' }}>NEW SERVICE REQUEST</h3>
            {locationLabel && <p style={{ margin: '4px 0 0 0', color: '#555', fontSize: '0.8rem' }}>{locationLabel}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
        </div>

        <label style={labelStyle}>DESCRIPTION *</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe the work to be done..."
          style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
        />

        <label style={labelStyle}>OBJECTIVES / CHECKLIST</label>
        <textarea
          value={objectives}
          onChange={e => setObjectives(e.target.value)}
          placeholder="e.g. Clean all units, Fix HVAC in unit 3..."
          style={{ ...inputStyle, height: '60px', resize: 'vertical' }}
        />

        <label style={labelStyle}>ASSIGN VENDOR</label>
        <select
          value={selectedVendor}
          onChange={e => setSelectedVendor(e.target.value)}
          style={inputStyle}
        >
          <option value="">— Unassigned —</option>
          {vendors.map(v => (
            <option key={v.id} value={v.id}>
              {v.company_name || v.full_name}{v.service_type ? ` · ${v.service_type}` : ''}
            </option>
          ))}
        </select>

        <label style={labelStyle}>ESTIMATED AMOUNT ($)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          style={inputStyle}
        />
        <p style={{ margin: '-10px 0 16px 0', fontSize: '0.7rem', color: '#444' }}>Payment processing coming soon.</p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
          <button onClick={handleDispatch} disabled={loading} style={{ ...btnPrimary, flex: 1 }}>
            {loading ? 'CREATING...' : 'CREATE JOB'}
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