import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function LocationDirectory() {
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    const { data } = await supabase.from('locations').select('*').order('created_at', { ascending: false });
    if (data) setLocations(data);
  }

  async function deleteLocation(id: string) {
    if (!window.confirm("WARNING: Deleting a location removes ALL associated jobs and matrix pins. This cannot be undone.")) return;
    
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchLocations();
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #333', backgroundColor: '#050505' }}>
      <h3 style={{ color: 'cyan' }}>PORTFOLIO (LOCATION DIRECTORY)</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #444', color: '#888' }}>
            <th>NAME</th>
            <th>EXT-REF</th>
            <th>CITY</th>
            <th>TYPE</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {locations.map(loc => (
            <tr key={loc.id} style={{ borderBottom: '1px solid #222' }}>
              <td style={{ padding: '10px 0', fontWeight: 'bold' }}>{loc.label}</td>
              <td style={{ color: 'cyan' }}>{loc.external_id_ref || '-'}</td>
              <td>{loc.city}</td>
              <td>{loc.type}</td>
              <td>
                <button 
                  onClick={() => deleteLocation(loc.id)} 
                  style={{ color: 'red', background: 'none', border: '1px solid #333', cursor: 'pointer', padding: '2px 5px' }}
                >
                  DEL
                </button>
              </td>
            </tr>
          ))}
          {locations.length === 0 && <tr><td colSpan={5} style={{padding:'10px', color:'#555'}}>No locations found. Add one above.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}