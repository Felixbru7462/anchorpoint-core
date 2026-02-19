import React, { useState } from 'react';

export function LoginPage({ onLogin }: { onLogin: (role: 'CUSTOMER' | 'VENDOR', id?: string) => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', border: '1px solid #333', backgroundColor: '#0a0a0a' }}>
      <h2 style={{ color: 'lime', textAlign: 'center', letterSpacing: '2px' }}>ANCHORPOINT LOGIN</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '0.7em', color: '#888' }}>ADMIN / PM ACCESS</label>
        <button 
          onClick={() => onLogin('CUSTOMER')}
          style={{ width: '100%', padding: '12px', marginTop: '5px', background: 'white', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}
        >
          LOG IN AS PROPERTY MANAGER
        </button>
      </div>

      <div style={{ borderTop: '1px solid #222', paddingTop: '20px' }}>
        <label style={{ display: 'block', fontSize: '0.7em', color: '#888' }}>VENDOR FIELD ACCESS</label>
        <input 
          placeholder="ENTER VENDOR AUTH CODE" 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ width: '100%', padding: '12px', background: '#000', color: 'white', border: '1px solid #333', marginTop: '5px', boxSizing: 'border-box' }}
        />
        <button 
          onClick={() => onLogin('VENDOR', code)}
          style={{ width: '100%', padding: '12px', marginTop: '10px', background: 'lime', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}
        >
          LOG IN AS CONTRACTOR
        </button>
      </div>
    </div>
  );
}