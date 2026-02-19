import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Job {
  id: string;
  description: string;
  status: string;
  amount: number;
  locations: {
    label: string;
    address: string;
  } | null;
}

export function VendorDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorInfo, setVendorInfo] = useState<{name: string, id: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Identify the Vendor
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active session.");

      const { data: vendor, error: vError } = await supabase
        .from('vendors')
        .select('id, company_name')
        .eq('contact_email', user.email)
        .single();

      if (vError || !vendor) throw new Error("Vendor profile not found.");
      setVendorInfo({ name: vendor.company_name, id: vendor.id });

      // 2. Fetch Jobs (NO .order('created_at') to prevent 400 error)
      const { data: jobsData, error: jError } = await supabase
        .from('jobs')
        .select(`
          id,
          description,
          status,
          amount,
          locations (
            label,
            address
          )
        `)
        .eq('vendor_id', vendor.id);

      if (jError) throw jError;
      setJobs(jobsData || []);

    } catch (err: any) {
      console.error("Dashboard Load Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (jobId: string, nextStatus: string) => {
    const { error } = await supabase
      .from('jobs')
      .update({ status: nextStatus })
      .eq('id', jobId);
    
    if (!error) loadDashboard();
  };

  // Calculate quick stats for the "Dashboard" feel
  const activeJobs = jobs.filter(j => j.status !== 'COMPLETED').length;
  const totalEarnings = jobs.filter(j => j.status === 'COMPLETED').reduce((acc, curr) => acc + curr.amount, 0);

  if (loading) return <div style={{ padding: '50px', color: 'white' }}>Syncing Dashboard...</div>;

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', color: 'white', backgroundColor: '#050505', minHeight: '100vh' }}>
      
      {/* Dashboard Header */}
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, letterSpacing: '2px' }}>VENDOR DASHBOARD</h1>
          <p style={{ color: 'lime', margin: '5px 0 0 0' }}>{vendorInfo?.name} • Official Partner</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>ID: {vendorInfo?.id.slice(0,8)}...</div>
        </div>
      </header>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: '#111', padding: '20px', borderRadius: '8px', borderLeft: '4px solid lime' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>ACTIVE REQUESTS</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{activeJobs}</div>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #333' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>TOTAL COMPLETED</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{jobs.length - activeJobs}</div>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '8px', borderLeft: '4px solid gold' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>TOTAL EARNINGS</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'gold' }}>${totalEarnings.toFixed(2)}</div>
        </div>
      </div>

      {error && <div style={{ padding: '15px', background: '#311', border: '1px solid red', color: 'white', marginBottom: '20px' }}>{error}</div>}

      {/* Job Board */}
      <section>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '10px' }}>CURRENT WORK ORDERS</h2>
        
        {jobs.length === 0 ? (
          <p style={{ color: '#444', textAlign: 'center', marginTop: '50px' }}>No jobs assigned to this profile.</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {jobs.map((job) => (
              <div key={job.id} style={{ border: '1px solid #222', background: '#0a0a0a', padding: '20px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ color: 'lime', fontSize: '0.75rem', fontWeight: 'bold' }}>{job.status}</span>
                  <span style={{ color: '#444', fontSize: '0.75rem' }}>#{job.id.slice(0,8)}</span>
                </div>

                <h3 style={{ margin: '0 0 5px 0' }}>{job.locations?.label || 'Direct Service'}</h3>
                <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>{job.locations?.address}</p>

                <div style={{ margin: '20px 0', padding: '15px', background: '#111', borderRadius: '6px' }}>
                  <label style={{ fontSize: '0.6rem', color: '#555' }}>SERVICE DESCRIPTION</label>
                  <p style={{ margin: '5px 0 0 0', fontSize: '1rem' }}>{job.description}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: 'lime', fontSize: '1.2rem', fontWeight: 'bold' }}>${job.amount}</div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {job.status === 'REPORTED' && (
                      <button onClick={() => updateStatus(job.id, 'ACCEPTED')} style={btnStyle}>Accept</button>
                    )}
                    {job.status === 'ACCEPTED' && (
                      <button onClick={() => updateStatus(job.id, 'IN_PROGRESS')} style={btnStyle}>Start Work</button>
                    )}
                    {job.status === 'IN_PROGRESS' && (
                      <button onClick={() => updateStatus(job.id, 'COMPLETED')} style={{ ...btnStyle, background: 'white', color: 'black' }}>Finish & Bill</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const btnStyle = {
  padding: '8px 20px',
  background: '#222',
  color: 'white',
  border: '1px solid #444',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem'
};