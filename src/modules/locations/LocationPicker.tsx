import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Location } from './types';

export function LocationPicker({ onSelect }: { onSelect: (id: string) => void }) {
  const [locations, setLocations] = useState<Location[]>([]);

  // This function fetches the latest anchors
  const loadLocations = async () => {
    const { data } = await supabase.from('locations').select('*').order('label');
    if (data) setLocations(data);
  };

  useEffect(() => {
    loadLocations();
    
    // Optional: Listen for real-time changes
    const channel = supabase.channel('loc-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'locations' }, () => {
        loadLocations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div style={{ margin: '10px 0' }}>
      <label style={{ display: 'block', marginBottom: '5px', color: 'cyan' }}>SELECT ANCHOR LOCATION:</label>
      <select 
        onChange={(e) => onSelect(e.target.value)}
        style={{ width: '100%', padding: '10px', backgroundColor: '#222', color: 'white', border: '1px solid lime' }}
      >
        <option value="">-- Choose a Physical Anchor --</option>
        {locations.map(loc => (
          <option key={loc.id} value={loc.id}>
            {loc.label} ({loc.address})
          </option>
        ))}
      </select>
    </div>
  );
}