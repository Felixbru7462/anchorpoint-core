import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface VendorProfile {
  id: string;
  company_name: string;
  full_name: string;
  service_type: string;
  address: string;
  contact_email: string;
}

interface Job {
  id: string;
  description: string;
  status: string;
  amount: number;
  locations: { id: string; label: string; address: string } | null;
}

interface PMInvite {
  id: string;
  pm_id: string;
  status: string;
  pmProfile: { full_name: string; company_name: string } | null;
}

interface ClientConnection {
  pmId: string;
  pmProfile: { full_name: string; company_name: string } | null;
  locations: { id: string; label: string; address: string }[];
}

export function VendorDashboard() {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PMInvite[]>([]);
  const [clientConnections, setClientConnections] = useState<ClientConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const [tab, setTab] = useState<'JOBS' | 'CLIENTS' | 'SETTINGS'>('JOBS');
  const [editVendor, setEditVendor] = useState<VendorProfile | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No active session.');

      const { data: vendorData, error: vError } = await supabase
        .from('vendors').select('*').eq('owner_id', user.id).single();
      if (vError || !vendorData) throw new Error('Vendor profile not found.');

      setVendor(vendorData);
      setEditVendor(vendorData);

      // Jobs
      const { data: jobsData, error: jError } = await supabase
        .from('jobs')
        .select(`id, description, status, amount, locations(id, label, address)`)
        .eq('vendor_id', vendorData.id);
      if (jError) throw jError;
      setJobs(jobsData || []);

      // Pending invites from PMs via pm_vendor_connections
      const { data: inviteData } = await supabase
        .from('pm_vendor_connections')
        .select('id, pm_id, status')
        .eq('vendor_id', vendorData.id)
        .eq('status', 'pending');

      if (inviteData && inviteData.length > 0) {
        const pmIds = inviteData.map((i: any) => i.pm_id);
        const { data: pmProfiles } = await supabase
          .from('pm_profiles')
          .select('id, full_name, company_name')
          .in('id', pmIds);
        const pmMap = Object.fromEntries((pmProfiles || []).map((p: any) => [p.id, p]));
        setPendingInvites(inviteData.map((i: any) => ({
          ...i,
          pmProfile: pmMap[i.pm_id] || null,
        })));
      } else {
        setPendingInvites([]);
      }

      // Accepted PM connections + their assigned locations
      const { data: acceptedConns } = await supabase
        .from('pm_vendor_connections')
        .select('id, pm_id, status')
        .eq('vendor_id', vendorData.id)
        .eq('status', 'accepted');

      if (acceptedConns && acceptedConns.length > 0) {
        const pmIds = acceptedConns.map((c: any) => c.pm_id);

        const [{ data: pmProfiles }, { data: lsData }] = await Promise.all([
          supabase.from('pm_profiles').select('id, full_name, company_name').in('id', pmIds),
          supabase.from('location_services')
            .select(`locations(id, label, address, owner_id)`)
            .eq('vendor_id', vendorData.id)
            .eq('status', 'accepted'),
        ]);

        const pmMap = Object.fromEntries((pmProfiles || []).map((p: any) => [p.id, p]));

        // Group locations by PM owner
        const locsByPM: Record<string, any[]> = {};
        (lsData || []).forEach((ls: any) => {
          const ownerId = ls.locations?.owner_id;
          if (ownerId) {
            if (!locsByPM[ownerId]) locsByPM[ownerId] = [];
            locsByPM[ownerId].push(ls.locations);
          }
        });

        setClientConnections(acceptedConns.map((c: any) => ({
          pmId: c.pm_id,
          pmProfile: pmMap[c.pm_id] || null,
          locations: locsByPM[c.pm_id] || [],
        })));
      } else {
        setClientConnections([]);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async (inviteId: string) => {
    setAcceptingId(inviteId);
    const { error } = await supabase
      .from('pm_vendor_connections')
      .update({ status: 'accepted' })
      .eq('id', inviteId);
    if (error) alert('Failed to accept: ' + error.message);
    else loadDashboard();
    setAcceptingId(null);
  };

  const updateJobStatus = async (jobId: string, nextStatus: string) => {
    const { error } = await supabase.from('jobs').update({ status: nextStatus }).eq('id', jobId);
    if (!error) loadDashboard();
  };

  const handleSaveProfile = async () => {
    if (!vendor || !editVendor) return;
    setSavingProfile(true);
    const { error } = await supabase.from('vendors').update({
      full_name: editVendor.full_name,
      company_name: editVendor.company_name,
      address: editVendor.address,
      service_type: editVendor.service_type,
    }).eq('id', vendor.id);
    if (error) alert('Failed to save: ' + error.message);
    else { setVendor(editVendor); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); }
    setSavingProfile(false);
  };

  const activeJobs = jobs.filter(j => !['COMPLETED', 'VERIFIED'].includes(j.status)).length;
  const totalEarnings = jobs.filter(j => j.status === 'COMPLETED').reduce((acc, j) => acc + (j.amount || 0), 0);

  if (loading) return <div style={{ padding: '50px', color: 'white', backgroundColor: '#050505', minHeight: '100vh' }}>Loading...</div>;

  if (error) return (
    <div style={{ padding: '50px', color: 'white', backgroundColor: '#050505', minHeight: '100vh' }}>
      <div style={{ color: '#ff4444', background: '#1a0000', border: '1px solid #ff4444', padding: '20px', borderRadius: '8px' }}>{error}</div>
    </div>
  );

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', color: 'white', backgroundColor: '#050505', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', letterSpacing: '2px' }}>{vendor?.company_name || 'VENDOR DASHBOARD'}</h1>
          <p style={{ margin: '4px 0 0 0', color: '#555', fontSize: '0.8rem' }}>{vendor?.full_name} · {vendor?.service_type}</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#333' }}>ANCHORPOINT CORE</div>
      </header>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '30px' }}>
        {[
          { label: 'ACTIVE JOBS', value: activeJobs, color: 'lime' },
          { label: 'COMPLETED', value: jobs.filter(j => j.status === 'COMPLETED').length, color: 'white' },
          { label: 'TOTAL EARNINGS', value: `$${totalEarnings.toFixed(2)}`, color: 'gold' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.65rem', color: '#444', letterSpacing: '1px', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', gap: '30px', marginBottom: '30px', borderBottom: '1px solid #111', paddingBottom: '15px' }}>
        {(['JOBS', 'CLIENTS', 'SETTINGS'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none',
            color: tab === t ? 'lime' : '#555',
            borderBottom: tab === t ? '2px solid lime' : '2px solid transparent',
            paddingBottom: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '1px'
          }}>{t}</button>
        ))}
      </nav>

      {/* JOBS TAB */}
      {tab === 'JOBS' && (
        <section>

          {/* Pending PM invites */}
          {pendingInvites.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.8rem', color: '#ffaa00', letterSpacing: '1px', marginBottom: '10px' }}>
                CONNECTION REQUESTS ({pendingInvites.length})
              </h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {pendingInvites.map(invite => (
                  <div key={invite.id} style={{ background: '#0d0900', border: '1px solid #ffaa0044', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {invite.pmProfile?.company_name || 'Unknown Company'}
                      </p>
                      <p style={{ margin: '3px 0 0 0', color: '#666', fontSize: '0.8rem' }}>
                        {invite.pmProfile?.full_name}
                      </p>
                      <p style={{ margin: '4px 0 0 0', color: '#ffaa00', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                        wants to add you to their vendor network
                      </p>
                    </div>
                    <button
                      onClick={() => acceptInvite(invite.id)}
                      disabled={acceptingId === invite.id}
                      style={{ ...btnPrimary, whiteSpace: 'nowrap', marginLeft: '16px' }}
                    >
                      {acceptingId === invite.id ? 'Accepting...' : 'Accept'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 style={{ fontSize: '1rem', color: '#888', marginBottom: '20px' }}>WORK ORDERS ({jobs.length})</h2>

          {jobs.length === 0 ? (
            <div style={{ border: '1px dashed #222', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#444', fontSize: '0.85rem' }}>
              No jobs assigned yet. A PM will assign work to you from their dashboard.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {jobs.map(job => (
                <div key={job.id} style={{ background: '#0a0a0a', border: '1px solid #222', padding: '20px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: 'lime', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px' }}>{job.status}</span>
                    <span style={{ color: '#444', fontSize: '0.7rem' }}>#{job.id.slice(0, 8)}</span>
                  </div>
                  <h3 style={{ margin: '0 0 4px 0' }}>{job.locations?.label || 'Direct Service'}</h3>
                  <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '0.85rem' }}>{job.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'gold', fontWeight: 'bold' }}>${job.amount}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {job.status === 'REPORTED' && (
                        <button onClick={() => updateJobStatus(job.id, 'ACCEPTED')} style={btnPrimary}>Accept</button>
                      )}
                      {job.status === 'ACCEPTED' && (
                        <button onClick={() => updateJobStatus(job.id, 'IN_PROGRESS')} style={btnPrimary}>Start Work</button>
                      )}
                      {job.status === 'IN_PROGRESS' && (
                        <button onClick={() => updateJobStatus(job.id, 'COMPLETED')} style={{ ...btnPrimary, background: 'white', color: 'black', borderColor: 'white' }}>
                          Finish & Bill
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CLIENTS TAB */}
      {tab === 'CLIENTS' && (
        <section>
          <h2 style={{ fontSize: '1rem', color: '#888', marginBottom: '20px' }}>
            ACTIVE CLIENTS ({clientConnections.length})
          </h2>

          {clientConnections.length === 0 ? (
            <div style={{ border: '1px dashed #222', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#444', fontSize: '0.85rem' }}>
              No active clients yet. Accept a connection request from the Jobs tab to get started.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {clientConnections.map(client => (
                <div key={client.pmId} style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '20px' }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>
                        {client.pmProfile?.company_name || 'Unknown Company'}
                      </h3>
                      <p style={{ margin: 0, color: '#555', fontSize: '0.8rem' }}>
                        {client.pmProfile?.full_name || '—'}
                      </p>
                    </div>
                    <span style={{ color: 'lime', fontSize: '0.7rem', border: '1px solid lime', padding: '3px 8px', borderRadius: '10px' }}>
                      ACTIVE CLIENT
                    </span>
                  </div>

                  {/* Assigned locations */}
                  {client.locations.length > 0 ? (
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.7rem', color: '#444', letterSpacing: '1px' }}>
                        ASSIGNED LOCATIONS ({client.locations.length})
                      </p>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {client.locations.map((loc: any) => (
                          <div key={loc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '10px 14px' }}>
                            <div>
                              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold' }}>{loc.label}</p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#555' }}>{loc.address}</p>
                            </div>
                            <span style={{ color: 'lime', fontSize: '0.65rem' }}>● ASSIGNED</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#444', fontSize: '0.8rem', margin: '0 0 12px 0' }}>No locations assigned yet.</p>
                  )}

                  {/* Jobs for this client */}
                  {(() => {
                    const locationIds = client.locations.map((l: any) => l?.id).filter(Boolean);
                    const clientJobs = jobs.filter(j => locationIds.includes(j.locations?.id));
                    if (clientJobs.length === 0) return null;
                    return (
                      <div style={{ paddingTop: '14px', borderTop: '1px solid #1a1a1a' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.7rem', color: '#444', letterSpacing: '1px' }}>
                          JOBS ({clientJobs.length})
                        </p>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          {clientJobs.map(job => (
                            <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '8px 14px' }}>
                              <span style={{ fontSize: '0.8rem', color: '#888' }}>{job.description}</span>
                              <span style={{ fontSize: '0.7rem', color: 'lime', fontWeight: 'bold' }}>{job.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SETTINGS TAB */}
      {tab === 'SETTINGS' && (
        <section>
          <h2 style={{ fontSize: '1rem', color: '#888', marginBottom: '20px' }}>ACCOUNT SETTINGS</h2>
          <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '24px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '0.9rem', letterSpacing: '1px', color: '#aaa' }}>BUSINESS PROFILE</h3>
            <label style={labelStyle}>FULL NAME</label>
            <input style={inputStyle} value={editVendor?.full_name || ''} onChange={e => setEditVendor(v => v ? { ...v, full_name: e.target.value } : v)} />
            <label style={labelStyle}>COMPANY NAME</label>
            <input style={inputStyle} value={editVendor?.company_name || ''} onChange={e => setEditVendor(v => v ? { ...v, company_name: e.target.value } : v)} />
            <label style={labelStyle}>ADDRESS</label>
            <input style={inputStyle} value={editVendor?.address || ''} onChange={e => setEditVendor(v => v ? { ...v, address: e.target.value } : v)} />
            <label style={labelStyle}>SERVICE TYPE</label>
            <input style={inputStyle} value={editVendor?.service_type || ''} onChange={e => setEditVendor(v => v ? { ...v, service_type: e.target.value } : v)} />
            <button onClick={handleSaveProfile} disabled={savingProfile} style={btnPrimary}>
              {savingProfile ? 'Saving...' : profileSaved ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

const btnPrimary: React.CSSProperties = { background: '#111', color: 'lime', border: '1px solid lime', padding: '9px 18px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.5px' };
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', padding: '11px 14px', marginBottom: '16px', background: '#000', border: '1px solid #2a2a2a', color: 'white', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.7rem', color: '#555', letterSpacing: '1px', marginBottom: '7px' };