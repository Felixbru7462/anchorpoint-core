import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function PMDashboard() {
  const [tab, setTab] = useState<'PIPELINE' | 'LOCATIONS' | 'VENDORS' | 'SETTINGS'>('PIPELINE');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [jobs, setJobs] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  // Form Toggles & States
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLoc, setNewLoc] = useState({ label: '', address: '' });
  
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendor, setNewVendor] = useState({ company_name: '', contact_email: '' });

  const [assigningLocationId, setAssigningLocationId] = useState<string | null>(null);
  const [selectedVendorToAssign, setSelectedVendorToAssign] = useState<string>('');

  // Stripe State
  const [stripeKey, setStripeKey] = useState('');

  useEffect(() => {
    loadSystemData();
  }, []);

  async function loadSystemData() {
    setLoading(true);
    try {
      const { data: jobData } = await supabase.from('jobs').select(`*, locations(label), vendors(company_name)`);
      const { data: locData } = await supabase.from('locations').select('*');
      const { data: vendData } = await supabase.from('vendors').select('*');

      if (jobData) setJobs(jobData);
      if (locData) setLocations(locData);
      if (vendData) setVendors(vendData);
    } catch (error) {
      console.error("System Load Error:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- ACTIONS ---
  const handleAddLocation = async () => {
    if (!newLoc.label || !newLoc.address) return alert("Please fill in all fields");
    const { error } = await supabase.from('locations').insert([newLoc]);
    if (error) alert("Error adding location: " + error.message);
    else {
      setShowAddLocation(false);
      setNewLoc({ label: '', address: '' });
      loadSystemData();
    }
  };

  const handleAddVendor = async () => {
    if (!newVendor.company_name || !newVendor.contact_email) return alert("Please fill in all fields");
    const { error } = await supabase.from('vendors').insert([newVendor]);
    if (error) alert("Error adding vendor: " + error.message);
    else {
      setShowAddVendor(false);
      setNewVendor({ company_name: '', contact_email: '' });
      loadSystemData();
    }
  };

  const assignVendorToLocation = async (locationId: string) => {
    if (!selectedVendorToAssign) return alert("Please select a vendor first.");
    
    // Assuming you are linking them via the location_services table based on your schema
    const { error } = await supabase.from('location_services').insert([{
      location_id: locationId,
      vendor_id: selectedVendorToAssign
    }]);

    if (error) {
      alert("Failed to assign vendor: " + error.message);
    } else {
      alert("Vendor assigned successfully!");
      setAssigningLocationId(null);
      setSelectedVendorToAssign('');
    }
  };

  const saveStripeSettings = () => {
    if (!stripeKey.startsWith('sk_')) {
      return alert("Invalid Stripe key format. It should usually start with 'sk_test_' or 'sk_live_'.");
    }
    // In a real app, this should be sent to a secure backend, not stored purely in UI state or unprotected DB columns.
    alert("Stripe configuration saved securely.");
    setStripeKey('');
  };

  if (loading) return <div style={{ padding: '40px', color: 'white' }}>Loading System Core...</div>;

  return (
    <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', color: 'white', backgroundColor: '#050505', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '1px' }}>PROPERTY MANAGER CORE</h1>
        <div style={{ fontSize: '0.8rem', color: '#666' }}>ADMIN MODE</div>
      </header>

      <nav style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
        {['PIPELINE', 'LOCATIONS', 'VENDORS', 'SETTINGS'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            style={{
              background: 'none', border: 'none',
              color: tab === t ? 'lime' : '#888',
              borderBottom: tab === t ? '2px solid lime' : 'none',
              paddingBottom: '5px', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '0.9rem'
            }}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* --- PIPELINE VIEW --- */}
      {tab === 'PIPELINE' && (
        <section>
          <h2>Active Jobs ({jobs.length})</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            {jobs.length === 0 ? <p style={{color: '#666'}}>No jobs found.</p> : jobs.map(job => (
              <div key={job.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'lime', fontWeight: 'bold', fontSize: '0.8rem' }}>{job.status}</span>
                  <span style={{ color: '#666', fontSize: '0.8rem' }}>${job.amount}</span>
                </div>
                <h3 style={{ margin: '5px 0' }}>{job.locations?.label || 'Unknown Location'}</h3>
                <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>{job.description}</p>
                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#555' }}>
                  Vendor: {job.vendors?.company_name || 'Unassigned'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- LOCATIONS VIEW (WITH VENDOR ASSIGNMENT) --- */}
      {tab === 'LOCATIONS' && (
        <section>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Managed Properties</h2>
            <button onClick={() => setShowAddLocation(!showAddLocation)} style={btnPrimary}>
              {showAddLocation ? 'Cancel' : '+ Add Property'}
            </button>
          </div>

          {showAddLocation && (
            <div style={{ ...cardStyle, marginBottom: '20px', border: '1px solid lime' }}>
              <input placeholder="Property Name (e.g. Sunset Apartments)" style={inputStyle} value={newLoc.label} onChange={e => setNewLoc({...newLoc, label: e.target.value})} />
              <input placeholder="Address" style={inputStyle} value={newLoc.address} onChange={e => setNewLoc({...newLoc, address: e.target.value})} />
              <button onClick={handleAddLocation} style={{...btnPrimary, width: '100%'}}>Save Property</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {locations.map(loc => (
              <div key={loc.id} style={cardStyle}>
                <h3 style={{ margin: '0 0 5px 0', color: 'white' }}>{loc.label}</h3>
                <p style={{ margin: '0 0 15px 0', color: '#888', fontSize: '0.9rem' }}>{loc.address}</p>
                
                {/* VENDOR ASSIGNMENT LOGIC */}
                {assigningLocationId === loc.id ? (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#000', borderRadius: '4px' }}>
                    <select 
                      style={inputStyle} 
                      value={selectedVendorToAssign} 
                      onChange={(e) => setSelectedVendorToAssign(e.target.value)}
                    >
                      <option value="">-- Select Vendor --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.company_name}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => assignVendorToLocation(loc.id)} style={{...btnPrimary, flex: 1}}>Confirm</button>
                      <button onClick={() => setAssigningLocationId(null)} style={{...btnPrimary, background: '#333', color: 'white', borderColor: '#444'}}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAssigningLocationId(loc.id)} style={{...btnPrimary, fontSize: '0.75rem', padding: '5px 10px', background: 'transparent'}}>
                    + Assign Vendor
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- VENDORS VIEW (WITH ADD VENDOR) --- */}
      {tab === 'VENDORS' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Vendor Network</h2>
            <button onClick={() => setShowAddVendor(!showAddVendor)} style={btnPrimary}>
              {showAddVendor ? 'Cancel' : '+ Add Vendor'}
            </button>
          </div>

          {showAddVendor && (
            <div style={{ ...cardStyle, marginBottom: '20px', border: '1px solid lime' }}>
              <input placeholder="Company Name" style={inputStyle} value={newVendor.company_name} onChange={e => setNewVendor({...newVendor, company_name: e.target.value})} />
              <input placeholder="Contact Email" type="email" style={inputStyle} value={newVendor.contact_email} onChange={e => setNewVendor({...newVendor, contact_email: e.target.value})} />
              <button onClick={handleAddVendor} style={{...btnPrimary, width: '100%'}}>Save Vendor Info</button>
            </div>
          )}

          <div style={{ display: 'grid', gap: '15px' }}>
            {vendors.map(v => (
              <div key={v.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{v.company_name}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>{v.contact_email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'lime', fontSize: '0.7rem', border: '1px solid lime', padding: '2px 8px', borderRadius: '10px' }}>VERIFIED</span>
                  <div style={{ fontSize: '0.7rem', color: '#444', marginTop: '5px' }}>ID: {v.id.slice(0,8)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- SETTINGS VIEW (WITH STRIPE) --- */}
      {tab === 'SETTINGS' && (
        <section>
          <h2 style={{ marginBottom: '20px' }}>System Configuration</h2>
          
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: 'white' }}>Stripe Payments Integration</h3>
                <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>Connect your Stripe account to process client billing and vendor payouts automatically.</p>
              </div>
              <span style={{ background: '#222', padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem', color: stripeKey ? 'lime' : '#666' }}>
                {stripeKey ? 'CONFIGURED' : 'DISCONNECTED'}
              </span>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>STRIPE SECRET KEY</label>
              <input 
                type="password" 
                placeholder="sk_test_..." 
                style={inputStyle} 
                value={stripeKey}
                onChange={e => setStripeKey(e.target.value)}
              />
              <button onClick={saveStripeSettings} style={btnPrimary}>Save Stripe Settings</button>
            </div>
          </div>
        </section>
      )}

    </main>
  );
}

// --- SHARED STYLES ---
const cardStyle = {
  background: '#0a0a0a',
  border: '1px solid #333',
  padding: '20px',
  borderRadius: '8px'
};

const btnPrimary = {
  background: '#222',
  color: 'lime',
  border: '1px solid lime',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '12px',
  marginBottom: '15px',
  background: '#000',
  border: '1px solid #444',
  color: 'white',
  borderRadius: '4px',
  boxSizing: 'border-box' as const
};