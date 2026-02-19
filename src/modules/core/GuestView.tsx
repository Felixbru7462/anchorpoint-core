import React from 'react';

interface GuestViewProps {
  vendorCode: string;
  setVendorCode: (code: string) => void;
  setRole: (role: 'CUSTOMER' | 'VENDOR' | 'GUEST') => void;
}

export function GuestView({ vendorCode, setVendorCode, setRole }: GuestViewProps) {
  return (
    <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', fontFamily: 'monospace' }}>
      <h1 style={{ color: 'lime', letterSpacing: '5px', fontSize: '2.5rem', marginBottom: '2rem' }}>ANCHORPOINT</h1>
      <div style={{ border: '1px solid #333', padding: '40px', background: '#0a0a0a', width: '320px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        <div style={{ marginBottom: '30px' }}>
           <label style={{ fontSize: '0.7em', color: '#666', display: 'block', marginBottom: '10px' }}>PROPERTY MANAGER</label>
           <button onClick={() => setRole('CUSTOMER')} style={{ width: '100%', padding: '15px', background: 'white', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>PM LOGIN</button>
        </div>
        
        <hr style={{ border: '0', borderTop: '1px solid #222', margin: '20px 0' }}/>

        <div>
            <label style={{ fontSize: '0.7em', color: '#666', display: 'block', marginBottom: '10px' }}>VENDOR PARTNER</label>
            <input 
              placeholder="ENTER AUTH CODE" 
              value={vendorCode} 
              onChange={e => setVendorCode(e.target.value)} 
              style={{ width: '100%', padding: '12px', background: '#000', color: 'lime', border: '1px solid #333', marginBottom: '10px', fontFamily: 'monospace', textAlign: 'center' }} 
            />
            <button onClick={() => setRole('VENDOR')} style={{ width: '100%', padding: '12px', background: 'lime', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>VENDOR ACCESS</button>
        </div>

      </div>
      <p style={{ marginTop: '20px', color: '#444', fontSize: '0.7em' }}>SYSTEM v0.4.5 // DISPUTE_ENGINE_ACTIVE</p>
    </div>
  );
}