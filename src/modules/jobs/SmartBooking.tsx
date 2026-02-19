import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { authorizeFunds } from '../../lib/stripe';

interface SmartBookingProps {
  locationId: string; // This MUST be a UUID (e.g., "e0c4..."), not a name!
  onJobCreated: () => void;
}

export function SmartBooking({ locationId, onJobCreated }: SmartBookingProps) {
  // Default to "Plumbing" to match your DB value exactly
  const [service, setService] = useState('Plumbing'); 
  const [urgency, setUrgency] = useState('Normal');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDispatch = async () => {
    if (!description) return alert("Please describe the issue.");
    if (!locationId) return alert("ERROR: No Location ID provided.");

    setLoading(true);

    try {
      // DEBUG: This will show you exactly what is being sent to the DB
      console.log(`DEBUG: Searching DB for location_id: "${locationId}" and service_category: "${service}"`);

      // 1. LOOKUP VENDOR
      // We search 'location_services' for the row linking this Location UUID to this Service
      const { data: mapping, error: lookupError } = await supabase
        .from('location_services')
        .select('vendor_id')
        .eq('location_id', locationId)       // Must match the UUID in your table
        .eq('service_category', service)     // Uses your specific column name
        .single();

      if (lookupError || !mapping) {
        console.error("Supabase Error:", lookupError);
        throw new Error(`No vendor found! Checked table 'location_services' for Location ID "${locationId}" and Service "${service}".`);
      }

      // 2. AUTHORIZE FUNDS
      const authResult = await authorizeFunds(150, `Service: ${service}`);
      if (!authResult.success) throw new Error("Stripe Authorization Failed.");

      // 3. CREATE JOB
      const { error: insertError } = await supabase.from('jobs').insert({
        location_id: locationId,
        vendor_id: mapping.vendor_id, 
        description: `${service} - ${description}`,
        status: 'REPORTED',
        // payment_intent_id and amount are fine if they exist in your table
        payment_intent_id: authResult.paymentIntentId,
        payment_status: 'AUTHORIZED',
        amount: 150.00
      });

      if (insertError) throw insertError;

      setDescription('');
      onJobCreated();
      alert(`Success! Job assigned to Vendor ${mapping.vendor_id}`);

    } catch (err: any) {
      alert("Dispatch Failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#111', padding: '20px', border: '1px solid #333' }}>
      <h3 style={{ marginTop: 0, color: 'white', fontSize: '0.9em' }}>NEW SERVICE REQUEST</h3>
      
      {/* SERVICE SELECTOR */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontSize: '0.7em', color: '#888', display: 'block', marginBottom: '5px' }}>SERVICE TYPE</label>
        <select 
          value={service} 
          onChange={e => setService(e.target.value)}
          style={{ width: '100%', padding: '10px', background: '#000', color: 'white', border: '1px solid #333' }}
        >
          {/* Values must match 'service_category' column EXACTLY */}
          <option value="Plumbing">Plumbing</option>
          <option value="Electrical">Electrical</option>
          <option value="HVAC">HVAC</option>
          <option value="General Maintenance">General Maintenance</option>
        </select>
      </div>

      {/* DESCRIPTION INPUT */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontSize: '0.7em', color: '#888', display: 'block', marginBottom: '5px' }}>DETAILS</label>
        <textarea 
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe the issue..."
          style={{ width: '100%', height: '80px', padding: '10px', background: '#000', color: 'white', border: '1px solid #333' }}
        />
      </div>

      {/* DISPATCH BUTTON */}
      <button 
        onClick={handleDispatch} 
        disabled={loading}
        style={{ width: '100%', padding: '12px', background: 'lime', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
      >
        {loading ? 'PROCESSING...' : 'DISPATCH VENDOR ($150 HOLD)'}
      </button>
    </div>
  );
}