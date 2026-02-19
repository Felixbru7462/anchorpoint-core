import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// Use 'export function' to match the import { VendorDashboard } in App.tsx
export function VendorDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorInfo, setVendorInfo] = useState<{name: string, id: string} | null>(null);

  useEffect(() => {
    async function loadVendorData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, company_name')
        .eq('contact_email', user.email)
        .single();

      if (vendor) {
        setVendorInfo({ name: vendor.company_name, id: vendor.id });
        // STICK TO THESE COLUMNS: No 'created_at' in schema
        const { data } = await supabase
          .from('jobs')
          .select('*, locations(label, address)')
          .eq('vendor_id', vendor.id);
        
        setJobs(data || []);
      }
      setLoading(false);
    }
    loadVendorData();
  }, []);

  if (loading) return <div style={{ color: 'white', padding: '40px' }}>Syncing...</div>;

  return (
    <div style={{ padding: '30px', color: 'white', backgroundColor: '#050505', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{vendorInfo?.name} Dashboard</h1>
      <p style={{ color: 'lime', fontSize: '0.8rem' }}>Vendor ID: {vendorInfo?.id.slice(0, 8)}</p>

      <div style={{ display: 'grid', gap: '20px', marginTop: '30px' }}>
        {jobs.length === 0 ? <p style={{ color: '#444' }}>No work orders assigned.</p> : jobs.map(job => (
          <div key={job.id} style={{ border: '1px solid #333', padding: '20px', borderRadius: '12px', background: '#0a0a0a' }}>
            <div style={{ color: 'lime', fontSize: '0.7rem', fontWeight: 'bold' }}>{job.status}</div>
            <h3 style={{ margin: '10px 0 5px 0' }}>{job.locations?.label}</h3>
            <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>{job.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}