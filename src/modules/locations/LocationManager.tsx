// src/modules/locations/LocationManager.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function LocationManager({ onLocationCreated }: { onLocationCreated: () => void }) {
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');

  async function createLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!label || !address) return alert("All fields required for Anchor verification.");

    const { error } = await supabase
      .from('locations')
      .insert([{ label, address, metadata: {} }]);

    if (error) {
      alert(error.message);
    } else {
      setLabel('');
      setAddress('');
      onLocationCreated(); // Refresh the list
      alert("ANCHOR CREATED: Physical site established in Truth Engine.");
    }
  }

  return (
    <div style={{ border: '2px solid cyan', padding: '20px', marginBottom: '20px', backgroundColor: '#001111' }}>
      <h3 style={{ color: 'cyan', marginTop: 0 }}>NEW LOCATION ANCHOR</h3>
      <form onSubmit={createLocation}>
        <input 
          placeholder="Location Label (e.g. Warehouse A)" 
          value={label} 
          onChange={e => setLabel(e.target.value)}
          style={{ width: '100%', marginBottom: '10px', padding: '10px' }}
        />
        <input 
          placeholder="Physical Address" 
          value={address} 
          onChange={e => setAddress(e.target.value)}
          style={{ width: '100%', marginBottom: '10px', padding: '10px' }}
        />
        <button type="submit" style={{ backgroundColor: 'cyan', color: 'black', fontWeight: 'bold' }}>
          REGISTER ANCHOR
        </button>
      </form>
    </div>
  );
}
