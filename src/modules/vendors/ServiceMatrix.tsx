import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function ServiceMatrix() {
  const [locations, setLocations] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [matrix, setMatrix] = useState<any[]>([]);
  const [assignment, setAssignment] = useState({ locId: '', vendId: '', category: 'Plumbing' });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const { data: locs } = await supabase.from('locations').select('*');
    const { data: vends } = await supabase.from('vendors').select('*');
    const { data: mat } = await supabase.from('location_services').select('*, locations(label), vendors(company_name)');
    
    if (locs) setLocations(locs);
    if (vends) setVendors(vends);
    if (mat) setMatrix(mat);
  }

  async function saveAssignment() {
    if (!assignment.locId || !assignment.vendId) return alert("Select both Location and Vendor");
    const { error } = await supabase.from('location_services').upsert({
      location_id: assignment.locId, vendor_id: assignment.vendId, service_category: assignment.category
    }, { onConflict: 'location_id, service_category' });
    if (error) alert(error.message); else fetchData();
  }

  // NEW: Unpin Function
  async function unpin(id: string) {
    const { error } = await supabase.from('location_services').delete().eq('id', id);
    if (!error) fetchData();
  }

  const inputStyle = { padding: '8px', backgroundColor: '#111', color: 'white', border: '1px solid #444' };

  return (
    <div style={{ marginTop: '20px', padding: '15px', border: '1px solid cyan' }}>
      <h3 style={{ color: 'cyan', marginTop: 0 }}>SERVICE MATRIX (ASSIGN PREFERRED VENDORS)</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <select onChange={e => setAssignment({...assignment, locId: e.target.value})} style={inputStyle}>
          <option value="">-- Select Building --</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <select onChange={e => setAssignment({...assignment, category: e.target.value})} style={inputStyle}>
          <option value="Plumbing">Plumbing</option>
          <option value="HVAC">HVAC</option>
          <option value="Electrical">Electrical</option>
        </select>
        <select onChange={e => setAssignment({...assignment, vendId: e.target.value})} style={inputStyle}>
          <option value="">-- Assign Vendor --</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
        </select>
        <button onClick={saveAssignment} style={{ backgroundColor: 'cyan', color: 'black', fontWeight: 'bold' }}>PIN VENDOR</button>
      </div>

      <div style={{ fontSize: '0.85em' }}>
        {matrix.map(m => (
          <div key={m.id} style={{ borderBottom: '1px solid #333', padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📍 {m.locations?.label} | 🛠️ {m.service_category} <span style={{ color: '#555' }}>➔</span> <b style={{color:'white'}}>{m.vendors?.company_name}</b></span>
            <button onClick={() => unpin(m.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>✖</button>
          </div>
        ))}
      </div>
    </div>
  );
}