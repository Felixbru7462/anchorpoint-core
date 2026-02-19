import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function VendorManagement() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [newVendor, setNewVendor] = useState({
    name: '', category: 'General', city: '', extRef: ''
  });

  useEffect(() => { fetchVendors(); }, []);

  async function fetchVendors() {
    const { data } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
    if (data) setVendors(data);
  }

  async function addVendor() {
    if (!newVendor.name || !newVendor.extRef) return alert("Missing Enterprise Refs");
    const authCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase.from('vendors').insert({
      company_name: newVendor.name,
      external_vendor_ref: newVendor.extRef,
      service_category: newVendor.category,
      city: newVendor.city,
      auth_code: authCode
    });

    if (error) alert(error.message);
    else {
      setNewVendor({ name: '', category: 'General', city: '', extRef: '' });
      fetchVendors();
    }
  }

  // NEW: Delete Function
  async function deleteVendor(id: string) {
    if (!window.confirm("Are you sure? This will also delete their pinned services.")) return;
    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) alert("Error deleting: " + error.message);
    else fetchVendors();
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #333', backgroundColor: '#050505' }}>
      <h3 style={{ color: 'orange' }}>VENDOR DIRECTORY (ENTERPRISE REFS)</h3>
      
      {/* ADD FORM */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <input placeholder="Company Name" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} style={inputStyle} />
        <input placeholder="Ext Ref (V-01)" value={newVendor.extRef} onChange={e => setNewVendor({...newVendor, extRef: e.target.value})} style={inputStyle} />
        <select value={newVendor.category} onChange={e => setNewVendor({...newVendor, category: e.target.value})} style={inputStyle}>
          <option value="Plumbing">Plumbing</option>
          <option value="HVAC">HVAC</option>
          <option value="Electrical">Electrical</option>
          <option value="Janitorial">Janitorial</option>
        </select>
        <input placeholder="City" value={newVendor.city} onChange={e => setNewVendor({...newVendor, city: e.target.value})} style={inputStyle} />
        <button onClick={addVendor} style={{ backgroundColor: 'orange', color: 'black', fontWeight: 'bold' }}>ADD</button>
      </div>

      {/* LIST */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #444', color: '#888' }}>
            <th>NAME</th><th>REF</th><th>CATEGORY</th><th>AUTH</th><th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map(v => (
            <tr key={v.id} style={{ borderBottom: '1px solid #222' }}>
              <td style={{ padding: '8px 0' }}>{v.company_name}</td>
              <td><code style={{color: 'cyan'}}>{v.external_vendor_ref}</code></td>
              <td>{v.service_category}</td>
              <td><b style={{color: 'orange'}}>{v.auth_code}</b></td>
              <td style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/portal?key=${v.auth_code}`)} style={{fontSize: '10px'}}>LINK</button>
                 <button onClick={() => deleteVendor(v.id)} style={{fontSize: '10px', color: 'red', border: '1px solid red'}}>DEL</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const inputStyle = { padding: '8px', backgroundColor: '#111', color: 'white', border: '1px solid #444' };