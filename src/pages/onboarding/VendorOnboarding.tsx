import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const STEPS = ['Business Info', 'Address & Services', 'Finish'];

const SERVICE_OPTIONS = [
  'Cleaning', 'Plumbing', 'Electrical', 'HVAC', 'Landscaping',
  'Security', 'Pest Control', 'Painting', 'Roofing', 'General Maintenance'
];

export function VendorOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    company_name: '',
    address: '',
    service_type: '',
    custom_service: '',
  });

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const selectedService = form.service_type === 'custom'
    ? form.custom_service
    : form.service_type;

  const validateStep = () => {
    if (step === 0) {
      if (!form.full_name.trim()) return 'Full name is required.';
      if (!form.company_name.trim()) return 'Company name is required.';
    }
    if (step === 1) {
      if (!form.address.trim()) return 'Address is required.';
      if (!selectedService.trim()) return 'Please select or enter your service type.';
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) return setError(err);
    setError(null);
    setStep(s => s + 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No active session. Please log in again.');

      // Create or update vendor row
      const { error: vendorError } = await supabase
        .from('vendors')
        .upsert({
          owner_id: user.id,
          contact_email: user.email,
          full_name: form.full_name,
          company_name: form.company_name,
          address: form.address,
          service_type: selectedService,
        }, { onConflict: 'owner_id' });

      if (vendorError) throw new Error('Failed to save vendor profile: ' + vendorError.message);

      // Mark onboarding complete
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_complete: true,
          full_name: form.full_name,
          company_name: form.company_name,
        })
        .eq('id', user.id);

      if (profileError) throw new Error('Failed to mark onboarding complete: ' + profileError.message);

      navigate('/vendor');

    } catch (err: any) {
      console.error('Vendor onboarding error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const progress = Math.round((step / STEPS.length) * 100);

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: 0, letterSpacing: '3px', fontSize: '1.2rem' }}>ANCHORPOINT</h1>
          <p style={{ margin: '4px 0 0 0', color: '#555', fontSize: '0.75rem', letterSpacing: '1px' }}>
            VENDOR ONBOARDING
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            {STEPS.map((label, i) => (
              <span key={label} style={{
                fontSize: '0.7rem', letterSpacing: '0.5px',
                color: i <= step ? 'lime' : '#444',
                fontWeight: i === step ? 'bold' : 'normal'
              }}>
                {label}
              </span>
            ))}
          </div>
          <div style={{ height: '3px', background: '#222', borderRadius: '2px' }}>
            <div style={{
              height: '100%', borderRadius: '2px', background: 'lime',
              width: `${progress}%`, transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        {/* Step 0 — Business Info */}
        {step === 0 && (
          <div>
            <h2 style={stepTitle}>Tell us about your business</h2>
            <label style={labelStyle}>FULL NAME</label>
            <input
              placeholder="Your full name"
              value={form.full_name}
              onChange={e => update('full_name', e.target.value)}
              style={inputStyle}
            />
            <label style={labelStyle}>COMPANY / BUSINESS NAME</label>
            <input
              placeholder="e.g. Ace Plumbing Services"
              value={form.company_name}
              onChange={e => update('company_name', e.target.value)}
              style={inputStyle}
            />
          </div>
        )}

        {/* Step 1 — Address & Services */}
        {step === 1 && (
          <div>
            <h2 style={stepTitle}>Where are you based & what do you do?</h2>
            <label style={labelStyle}>BUSINESS ADDRESS</label>
            <input
              placeholder="123 Trade St, City, State"
              value={form.address}
              onChange={e => update('address', e.target.value)}
              style={inputStyle}
            />
            <label style={labelStyle}>SERVICE TYPE</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {SERVICE_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => update('service_type', s)}
                  style={{
                    padding: '10px', borderRadius: '6px', cursor: 'pointer',
                    background: form.service_type === s ? '#001a00' : '#000',
                    border: form.service_type === s ? '2px solid lime' : '1px solid #333',
                    color: form.service_type === s ? 'lime' : '#666',
                    fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'left'
                  }}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={() => update('service_type', 'custom')}
                style={{
                  padding: '10px', borderRadius: '6px', cursor: 'pointer',
                  background: form.service_type === 'custom' ? '#001a00' : '#000',
                  border: form.service_type === 'custom' ? '2px solid lime' : '1px solid #333',
                  color: form.service_type === 'custom' ? 'lime' : '#666',
                  fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'left'
                }}
              >
                + Other
              </button>
            </div>
            {form.service_type === 'custom' && (
              <input
                placeholder="Describe your service..."
                value={form.custom_service}
                onChange={e => update('custom_service', e.target.value)}
                style={inputStyle}
              />
            )}
          </div>
        )}

        {/* Step 2 — Summary */}
        {step === 2 && (
          <div>
            <h2 style={stepTitle}>You're all set</h2>
            <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '24px' }}>
              Here's a summary of what you entered:
            </p>
            <div style={{ background: '#000', border: '1px solid #222', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
              {[
                { label: 'NAME', value: form.full_name },
                { label: 'COMPANY', value: form.company_name },
                { label: 'ADDRESS', value: form.address },
                { label: 'SERVICE TYPE', value: selectedService },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#555', letterSpacing: '1px' }}>{row.label}</div>
                  <div style={{ color: 'white', fontSize: '0.95rem', marginTop: '2px' }}>{row.value}</div>
                </div>
              ))}
            </div>
            <p style={{ color: '#444', fontSize: '0.8rem' }}>You can edit all of this later in Settings.</p>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          {step > 0 && (
            <button onClick={() => { setError(null); setStep(s => s - 1); }} style={btnSecondary}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={next} style={{ ...btnPrimary, flex: 1 }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleComplete} disabled={loading} style={{ ...btnPrimary, flex: 1 }}>
              {loading ? 'Saving...' : 'Enter Dashboard →'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', backgroundColor: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const cardStyle: React.CSSProperties = { background: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '480px' };
const stepTitle: React.CSSProperties = { margin: '0 0 24px 0', fontSize: '1.1rem', color: 'white', fontWeight: 'bold' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.7rem', color: '#555', letterSpacing: '1px', marginBottom: '8px' };
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', padding: '12px 14px', marginBottom: '20px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '6px', fontSize: '0.95rem', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { padding: '13px', background: 'lime', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' };
const btnSecondary: React.CSSProperties = { padding: '13px 20px', background: 'transparent', color: '#666', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem' };
const errorStyle: React.CSSProperties = { background: '#1a0000', border: '1px solid #ff4444', color: '#ff8888', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '0.85rem' };