import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { SmartBooking } from '../jobs/SmartBooking';
import { DisputePortal } from '../disputes/DisputePortal';
import { RetractModal } from '../disputes/RetractModal';

interface PMProfile {
  full_name: string;
  company_name: string;
  address: string;
  account_type: string;
}

export function PMDashboard() {
  const [tab, setTab] = useState<'PIPELINE' | 'LOCATIONS' | 'VENDORS' | 'SETTINGS'>('PIPELINE');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<PMProfile | null>(null);
  const [editProfile, setEditProfile] = useState<PMProfile | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [jobs, setJobs] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [locationServices, setLocationServices] = useState<any[]>([]);

  // PM↔vendor relationships
  const [vendorConnections, setVendorConnections] = useState<any[]>([]); // all rows from pm_vendor_connections
  const [connectedVendors, setConnectedVendors] = useState<any[]>([]);   // accepted only
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);        // pending only

  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLoc, setNewLoc] = useState({ label: '', address: '' });

  const [assigningLocationId, setAssigningLocationId] = useState<string | null>(null);
  const [selectedVendorToAssign, setSelectedVendorToAssign] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  // Vendor search
  const [vendorSearch, setVendorSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingConnectionId, setSendingConnectionId] = useState<string | null>(null);

  // Modal state
  const [smartBookingLocationId, setSmartBookingLocationId] = useState<string | null>(null);
  const [disputeJob, setDisputeJob] = useState<any | null>(null);
  const [retractInfo, setRetractInfo] = useState<{ jobId: string; disputeId: string } | null>(null);

  useEffect(() => { initDashboard(); }, []);

  async function initDashboard() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data: pmProfile } = await supabase.from('pm_profiles').select('*').eq('id', user.id).single();
    if (pmProfile) { setProfile(pmProfile); setEditProfile(pmProfile); }
    await loadSystemData(user.id);
  }

  async function loadSystemData(uid: string) {
    try {
      const [{ data: jobData }, { data: locData }, { data: lsData }, { data: connData }] = await Promise.all([
        supabase.from('jobs').select(`*, locations(label), vendors(company_name), disputes(id, category, severity, resolution)`),
        supabase.from('locations').select('*'),
        supabase.from('location_services').select(`*, vendors(id, company_name, full_name, service_type, contact_email), locations(label)`),
        supabase.from('pm_vendor_connections').select(`*, vendors(id, company_name, full_name, service_type, contact_email)`).eq('pm_id', uid),
      ]);

      if (jobData) setJobs(jobData);
      if (locData) setLocations(locData);
      if (lsData) setLocationServices(lsData);

      if (connData) {
        setVendorConnections(connData);
        setConnectedVendors(connData.filter((c: any) => c.status === 'accepted').map((c: any) => c.vendors).filter(Boolean));
        setPendingVendors(connData.filter((c: any) => c.status === 'pending'));
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveProfile = async () => {
    if (!userId || !editProfile) return;
    setSavingProfile(true);
    const { error } = await supabase.from('pm_profiles').update({
      full_name: editProfile.full_name,
      company_name: editProfile.company_name,
      address: editProfile.address,
    }).eq('id', userId);
    if (error) alert('Failed to save: ' + error.message);
    else { setProfile(editProfile); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); }
    setSavingProfile(false);
  };

  const handleAddLocation = async () => {
    if (!newLoc.label || !newLoc.address) return alert('Please fill in all fields');
    if (!userId) return;
    const { error } = await supabase.from('locations').insert([{ ...newLoc, owner_id: userId }]);
    if (error) alert('Error adding location: ' + error.message);
    else { setShowAddLocation(false); setNewLoc({ label: '', address: '' }); loadSystemData(userId); }
  };

  const handleDeleteLocation = async (loc: any) => {
    const linkedJobs = jobs.filter(j => j.location_id === loc.id);
    const activeJobs = linkedJobs.filter(j => !['COMPLETED', 'VERIFIED'].includes(j.status));
    const message = activeJobs.length > 0
      ? `Delete "${loc.label}"?\n\nWARNING: This location has ${activeJobs.length} active job(s) that will also be permanently deleted.\n\nThis cannot be undone.`
      : linkedJobs.length > 0
        ? `Delete "${loc.label}"?\n\nThis will also delete ${linkedJobs.length} completed job(s) linked to this location.\n\nThis cannot be undone.`
        : `Delete "${loc.label}"?\n\nThis cannot be undone.`;
    if (!window.confirm(message)) return;
    await supabase.from('location_services').delete().eq('location_id', loc.id);
    const { error } = await supabase.from('locations').delete().eq('id', loc.id);
    if (error) alert('Failed to delete location: ' + error.message);
    else if (userId) loadSystemData(userId);
  };

  // Unassign vendor from a specific location only (does NOT affect PM↔vendor connection)
  const handleUnassignVendor = async (lsId: string, vendorName: string, locationLabel: string) => {
    if (!window.confirm(`Unassign "${vendorName}" from "${locationLabel}"?\n\nThis only removes them from this location. They stay connected to your account.`)) return;
    const { error } = await supabase.from('location_services').delete().eq('id', lsId);
    if (error) alert('Failed to unassign: ' + error.message);
    else if (userId) loadSystemData(userId);
  };

  // Search vendors
  const handleVendorSearch = async () => {
    if (!vendorSearch.trim()) return;
    setSearching(true);
    setSearchResults([]);
    const { data, error } = await supabase
      .from('vendors')
      .select('id, company_name, full_name, service_type, contact_email')
      .or(`contact_email.ilike.%${vendorSearch.trim()}%,company_name.ilike.%${vendorSearch.trim()}%`)
      .limit(10);
    setSearching(false);
    if (error) alert('Search failed: ' + error.message);
    else setSearchResults(data || []);
  };

  // Send PM↔vendor connection request via pm_vendor_connections
  const sendConnectionRequest = async (vendor: any) => {
    if (!userId) return;
    const existing = vendorConnections.find(c => c.vendor_id === vendor.id);
    if (existing?.status === 'accepted') { alert(`${vendor.company_name} is already connected.`); return; }
    if (existing?.status === 'pending') { alert(`A request is already pending for ${vendor.company_name}.`); return; }

    setSendingConnectionId(vendor.id);
    const { error } = await supabase.from('pm_vendor_connections').insert([{
      pm_id: userId,
      vendor_id: vendor.id,
      status: 'pending',
    }]);
    setSendingConnectionId(null);
    if (error) alert('Failed to send request: ' + error.message);
    else { setSearchResults([]); setVendorSearch(''); loadSystemData(userId); }
  };

  // Cancel a pending connection request
  const handleCancelRequest = async (connectionId: string, vendorName: string) => {
    if (!window.confirm(`Cancel connection request to "${vendorName}"?`)) return;
    const { error } = await supabase.from('pm_vendor_connections').delete().eq('id', connectionId);
    if (error) alert('Failed to cancel: ' + error.message);
    else if (userId) loadSystemData(userId);
  };

  // Disconnect vendor — removes pm_vendor_connections row and all location assignments
  const handleDisconnectVendor = async (vendor: any) => {
    const activeJobsWithVendor = jobs.filter(j => j.vendor_id === vendor.id && !['COMPLETED', 'VERIFIED'].includes(j.status));
    const message = activeJobsWithVendor.length > 0
      ? `Disconnect "${vendor.company_name}"?\n\nWARNING: They have ${activeJobsWithVendor.length} active job(s). Those jobs will remain but lose vendor assignment.\n\nThis also removes all location assignments.\n\nThis cannot be undone.`
      : `Disconnect "${vendor.company_name}"?\n\nThis removes them from your network and all location assignments.\n\nThis cannot be undone.`;
    if (!window.confirm(message)) return;

    await supabase.from('location_services').delete().eq('vendor_id', vendor.id);
    const { error } = await supabase.from('pm_vendor_connections').delete().eq('pm_id', userId).eq('vendor_id', vendor.id);
    if (error) alert('Failed to disconnect: ' + error.message);
    else if (userId) loadSystemData(userId);
  };

  // Assign a connected vendor to a specific location
  const sendVendorLocationAssignment = async (locationId: string) => {
    if (!selectedVendorToAssign) return alert('Please select a vendor first.');
    if (!userId) return;
    const existing = locationServices.find(ls => ls.location_id === locationId && ls.vendor_id === selectedVendorToAssign);
    if (existing) return alert('This vendor is already assigned to this location.');
    setSendingRequest(true);
    const { error } = await supabase.from('location_services').insert([{
      location_id: locationId,
      vendor_id: selectedVendorToAssign,
      requested_by: userId,
      status: 'accepted', // direct assignment since they're already connected
    }]);
    setSendingRequest(false);
    if (error) alert('Failed to assign: ' + error.message);
    else { setAssigningLocationId(null); setSelectedVendorToAssign(''); loadSystemData(userId); }
  };

  const STATUS_ORDER = ['REPORTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'FLAGGED'];

  const advanceJobStatus = async (job: any) => {
    const idx = STATUS_ORDER.indexOf(job.status);
    if (idx === -1 || ['VERIFIED', 'FLAGGED'].includes(job.status)) return;
    const next = STATUS_ORDER[idx + 1];
    if (next === 'FLAGGED') return;
    await supabase.from('jobs').update({ status: next }).eq('id', job.id);
    if (userId) loadSystemData(userId);
  };

  const getActiveDispute = (job: any) => job.disputes?.find((d: any) => !d.resolution);

  if (loading) return (
    <div style={{ padding: '40px', color: 'white', backgroundColor: '#050505', minHeight: '100vh' }}>Loading...</div>
  );

  return (
    <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', color: 'white', backgroundColor: '#050505', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      <header style={{ borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', letterSpacing: '2px' }}>{profile?.company_name || 'PM DASHBOARD'}</h1>
          <p style={{ margin: '4px 0 0 0', color: '#555', fontSize: '0.8rem' }}>{profile?.full_name} · Property Manager</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#333' }}>ANCHORPOINT CORE</div>
      </header>

      <nav style={{ display: 'flex', gap: '30px', marginBottom: '30px', borderBottom: '1px solid #111', paddingBottom: '15px' }}>
        {(['PIPELINE', 'LOCATIONS', 'VENDORS', 'SETTINGS'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none',
            color: tab === t ? 'lime' : '#555',
            borderBottom: tab === t ? '2px solid lime' : '2px solid transparent',
            paddingBottom: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '1px'
          }}>{t}</button>
        ))}
      </nav>

      {/* PIPELINE */}
      {tab === 'PIPELINE' && (
        <section>
          <h2 style={{ fontSize: '1rem', color: '#888', marginBottom: '20px' }}>ACTIVE JOBS ({jobs.length})</h2>
          {jobs.length === 0 ? (
            <div style={emptyState}><p style={{ margin: 0 }}>No jobs yet. Go to Locations and create a job to get started.</p></div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {jobs.map(job => {
                const activeDispute = getActiveDispute(job);
                return (
                  <div key={job.id} style={{ ...cardStyle, borderColor: job.status === 'FLAGGED' ? '#ff4444' : '#222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: job.status === 'FLAGGED' ? '#ff4444' : 'lime', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '1px' }}>{job.status}</span>
                      <span style={{ color: '#555', fontSize: '0.75rem' }}>{job.amount ? `$${job.amount}` : '—'}</span>
                    </div>
                    <h3 style={{ margin: '0 0 4px 0' }}>{job.locations?.label || 'Unknown Location'}</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 10px 0' }}>{job.description}</p>
                    <div style={{ fontSize: '0.75rem', color: '#444', marginBottom: '12px' }}>
                      Vendor: {job.vendors?.company_name || 'Unassigned'}
                    </div>
                    {activeDispute && (
                      <div style={{ fontSize: '0.75rem', color: '#ff4444', marginBottom: '10px', padding: '6px 10px', border: '1px solid #ff222233', borderRadius: '4px', background: '#1a0000' }}>
                        ⚠ Dispute: {activeDispute.category} · {activeDispute.severity}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {!['VERIFIED', 'FLAGGED'].includes(job.status) && (
                        <button onClick={() => advanceJobStatus(job)} style={{ ...btnSecondary, fontSize: '0.75rem', padding: '5px 12px', color: 'lime', borderColor: '#1a3a1a' }}>Advance →</button>
                      )}
                      {['IN_PROGRESS', 'COMPLETED'].includes(job.status) && !activeDispute && (
                        <button onClick={() => setDisputeJob(job)} style={{ ...btnSecondary, fontSize: '0.75rem', padding: '5px 12px', color: '#ff4444', borderColor: '#3a1111' }}>Flag Issue</button>
                      )}
                      {job.status === 'FLAGGED' && activeDispute && (
                        <button onClick={() => setRetractInfo({ jobId: job.id, disputeId: activeDispute.id })} style={{ ...btnSecondary, fontSize: '0.75rem', padding: '5px 12px' }}>Retract Dispute</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* LOCATIONS */}
      {tab === 'LOCATIONS' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', color: '#888' }}>MANAGED PROPERTIES ({locations.length})</h2>
            <button onClick={() => setShowAddLocation(!showAddLocation)} style={btnPrimary}>{showAddLocation ? 'Cancel' : '+ Add Property'}</button>
          </div>

          {showAddLocation && (
            <div style={{ ...cardStyle, marginBottom: '20px', borderColor: 'lime' }}>
              <label style={labelStyle}>PROPERTY NAME</label>
              <input placeholder="e.g. Sunset Apartments" style={inputStyle} value={newLoc.label} onChange={e => setNewLoc({ ...newLoc, label: e.target.value })} />
              <label style={labelStyle}>ADDRESS</label>
              <input placeholder="Full address" style={inputStyle} value={newLoc.address} onChange={e => setNewLoc({ ...newLoc, address: e.target.value })} />
              <button onClick={handleAddLocation} style={{ ...btnPrimary, width: '100%' }}>Save Property</button>
            </div>
          )}

          {locations.length === 0 ? (
            <div style={emptyState}><p style={{ margin: 0 }}>No properties yet. Add your first location above.</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {locations.map(loc => {
                const locAssignments = locationServices.filter(ls => ls.location_id === loc.id);
                return (
                  <div key={loc.id} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0 }}>{loc.label}</h3>
                      <button
                        onClick={() => handleDeleteLocation(loc)}
                        style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px', marginLeft: '8px' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ff4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#333')}
                      >✕</button>
                    </div>
                    <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '0.85rem' }}>{loc.address}</p>

                    {/* Assigned vendors */}
                    {locAssignments.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        {locAssignments.map(ls => (
                          <div key={ls.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', marginBottom: '4px', background: '#000', borderRadius: '4px', border: '1px solid #1a1a1a' }}>
                            <span style={{ fontSize: '0.75rem', color: '#888' }}>
                              {ls.vendors?.company_name || ls.vendors?.full_name || 'Unknown vendor'}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'lime', border: '1px solid lime', padding: '2px 6px', borderRadius: '10px' }}>
                                ASSIGNED
                              </span>
                              <button
                                onClick={() => handleUnassignVendor(ls.id, ls.vendors?.company_name || 'Vendor', loc.label)}
                                style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '0.7rem', padding: '1px 4px' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#ff4444')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#333')}
                                title="Unassign from this location"
                              >✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button onClick={() => setSmartBookingLocationId(loc.id)} style={{ ...btnPrimary, width: '100%', marginBottom: '10px' }}>+ Create Job</button>

                    {/* Assign vendor to location — only shows connected vendors */}
                    {connectedVendors.length > 0 && (
                      assigningLocationId === loc.id ? (
                        <div style={{ background: '#000', padding: '12px', borderRadius: '6px' }}>
                          <select
                            style={{ ...inputStyle, marginBottom: '10px' }}
                            value={selectedVendorToAssign}
                            onChange={e => setSelectedVendorToAssign(e.target.value)}
                          >
                            <option value="">-- Select Vendor --</option>
                            {connectedVendors.map(v => {
                              const alreadyAssigned = locationServices.some(ls => ls.location_id === loc.id && ls.vendor_id === v.id);
                              return <option key={v.id} value={v.id} disabled={alreadyAssigned}>{v.company_name}{alreadyAssigned ? ' (assigned)' : ''}</option>;
                            })}
                          </select>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => sendVendorLocationAssignment(loc.id)} disabled={sendingRequest} style={{ ...btnPrimary, flex: 1 }}>
                              {sendingRequest ? 'Assigning...' : 'Assign'}
                            </button>
                            <button onClick={() => { setAssigningLocationId(null); setSelectedVendorToAssign(''); }} style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setAssigningLocationId(loc.id)} style={{ ...btnSecondary, fontSize: '0.75rem', padding: '6px 12px', width: '100%' }}>
                          + Assign Vendor
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* VENDORS */}
      {tab === 'VENDORS' && (
        <section>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#888' }}>VENDOR NETWORK</h2>

          {/* Search */}
          <div style={{ ...cardStyle, marginBottom: '24px', borderColor: '#333' }}>
            <label style={labelStyle}>FIND A VENDOR BY EMAIL OR COMPANY NAME</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                placeholder="e.g. vendor@email.com or Acme Services"
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                value={vendorSearch}
                onChange={e => setVendorSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVendorSearch()}
              />
              <button onClick={handleVendorSearch} disabled={searching} style={{ ...btnPrimary, whiteSpace: 'nowrap' }}>
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div style={{ marginTop: '16px', display: 'grid', gap: '8px' }}>
                {searchResults.map(v => {
                  const conn = vendorConnections.find(c => c.vendor_id === v.id);
                  return (
                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '12px 14px' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{v.company_name || v.full_name}</p>
                        <p style={{ margin: '2px 0 0 0', color: '#555', fontSize: '0.75rem' }}>{v.contact_email}</p>
                        {v.service_type && <p style={{ margin: '2px 0 0 0', color: '#444', fontSize: '0.7rem' }}>{v.service_type}</p>}
                      </div>
                      {conn?.status === 'accepted' ? (
                        <span style={{ color: 'lime', fontSize: '0.7rem', border: '1px solid lime', padding: '3px 8px', borderRadius: '10px' }}>CONNECTED</span>
                      ) : conn?.status === 'pending' ? (
                        <span style={{ color: '#ffaa00', fontSize: '0.7rem', border: '1px solid #ffaa00', padding: '3px 8px', borderRadius: '10px' }}>PENDING</span>
                      ) : (
                        <button
                          onClick={() => sendConnectionRequest(v)}
                          disabled={sendingConnectionId === v.id}
                          style={{ ...btnPrimary, fontSize: '0.75rem', padding: '6px 12px' }}
                        >
                          {sendingConnectionId === v.id ? 'Sending...' : 'Connect'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {searchResults.length === 0 && vendorSearch && !searching && (
              <p style={{ margin: '12px 0 0 0', color: '#444', fontSize: '0.8rem' }}>No vendors found. Make sure they have registered on Anchorpoint.</p>
            )}
          </div>

          {/* Pending requests */}
          {pendingVendors.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.8rem', color: '#ffaa00', letterSpacing: '1px', marginBottom: '12px' }}>
                PENDING REQUESTS ({pendingVendors.length})
              </h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {pendingVendors.map(conn => (
                  <div key={conn.id} style={{ ...cardStyle, borderColor: '#ffaa0033', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{conn.vendors?.company_name || conn.vendors?.full_name}</p>
                      <p style={{ margin: '2px 0 0 0', color: '#555', fontSize: '0.8rem' }}>{conn.vendors?.contact_email}</p>
                      <p style={{ margin: '4px 0 0 0', color: '#ffaa00', fontSize: '0.7rem' }}>Awaiting vendor acceptance</p>
                    </div>
                    <button
                      onClick={() => handleCancelRequest(conn.id, conn.vendors?.company_name || 'vendor')}
                      style={{ ...btnSecondary, fontSize: '0.75rem', padding: '6px 12px', color: '#ff4444', borderColor: '#3a1111' }}
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connected vendors */}
          <h3 style={{ fontSize: '0.8rem', color: '#555', letterSpacing: '1px', marginBottom: '12px' }}>
            CONNECTED VENDORS ({connectedVendors.length})
          </h3>
          {connectedVendors.length === 0 ? (
            <div style={emptyState}><p style={{ margin: 0 }}>No connected vendors yet. Search for a vendor above to get started.</p></div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {connectedVendors.map(v => (
                <div key={v.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0' }}>{v.company_name}</h3>
                    <p style={{ margin: 0, color: '#555', fontSize: '0.8rem' }}>{v.contact_email}</p>
                    {v.service_type && <p style={{ margin: '4px 0 0 0', color: '#444', fontSize: '0.75rem' }}>{v.service_type}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'lime', fontSize: '0.7rem', border: '1px solid lime', padding: '3px 8px', borderRadius: '10px' }}>CONNECTED</span>
                    <button
                      onClick={() => handleDisconnectVendor(v)}
                      style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ff4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#333')}
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SETTINGS */}
      {tab === 'SETTINGS' && (
        <section>
          <h2 style={{ fontSize: '1rem', color: '#888', marginBottom: '20px' }}>ACCOUNT SETTINGS</h2>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '0.9rem', letterSpacing: '1px', color: '#aaa' }}>BUSINESS PROFILE</h3>
            <label style={labelStyle}>FULL NAME</label>
            <input style={inputStyle} value={editProfile?.full_name || ''} onChange={e => setEditProfile(p => p ? { ...p, full_name: e.target.value } : p)} />
            <label style={labelStyle}>COMPANY NAME</label>
            <input style={inputStyle} value={editProfile?.company_name || ''} onChange={e => setEditProfile(p => p ? { ...p, company_name: e.target.value } : p)} />
            <label style={labelStyle}>PRIMARY ADDRESS</label>
            <input style={inputStyle} value={editProfile?.address || ''} onChange={e => setEditProfile(p => p ? { ...p, address: e.target.value } : p)} />
            <button onClick={handleSaveProfile} disabled={savingProfile} style={btnPrimary}>
              {savingProfile ? 'Saving...' : profileSaved ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>
        </section>
      )}

      {/* MODALS */}
      {smartBookingLocationId && (
        <SmartBooking
          locationId={smartBookingLocationId}
          onClose={() => setSmartBookingLocationId(null)}
          onJobCreated={() => { setSmartBookingLocationId(null); setTab('PIPELINE'); if (userId) loadSystemData(userId); }}
        />
      )}
      {disputeJob && (
        <DisputePortal job={disputeJob} onClose={() => setDisputeJob(null)} onDisputeFiled={() => { if (userId) loadSystemData(userId); }} />
      )}
      {retractInfo && (
        <RetractModal jobId={retractInfo.jobId} disputeId={retractInfo.disputeId} onClose={() => setRetractInfo(null)} onRetracted={() => { if (userId) loadSystemData(userId); }} />
      )}
    </main>
  );
}

const cardStyle: React.CSSProperties = { background: '#0a0a0a', border: '1px solid #222', padding: '20px', borderRadius: '8px' };
const btnPrimary: React.CSSProperties = { background: '#111', color: 'lime', border: '1px solid lime', padding: '9px 18px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.5px' };
const btnSecondary: React.CSSProperties = { background: 'transparent', color: '#666', border: '1px solid #333', padding: '9px 18px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.85rem' };
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', padding: '11px 14px', marginBottom: '16px', background: '#000', border: '1px solid #2a2a2a', color: 'white', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.7rem', color: '#555', letterSpacing: '1px', marginBottom: '7px' };
const emptyState: React.CSSProperties = { border: '1px dashed #222', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#444', fontSize: '0.85rem' };