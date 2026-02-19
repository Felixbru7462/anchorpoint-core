import React from 'react';

interface RoleSwitcherProps {
  role: string;
  setRole: (role: any) => void;
}

export function RoleSwitcher({ role, setRole }: RoleSwitcherProps) {
  const btnStyle = (active: boolean) => ({
    padding: '5px 12px',
    background: active ? 'lime' : 'transparent',
    color: active ? 'black' : '#666',
    border: '1px solid ' + (active ? 'lime' : '#333'),
    cursor: 'pointer',
    fontSize: '0.7em',
    fontWeight: 'bold' as const,
    transition: 'all 0.2s'
  });

  return (
    <div style={{ background: '#111', padding: '10px 20px', borderBottom: '1px solid #222', display: 'flex', gap: '15px', alignItems: 'center', fontFamily: 'monospace' }}>
      <span style={{ fontSize: '0.65em', color: '#444', letterSpacing: '1px' }}>SYSTEM OVERRIDE:</span>
      <button onClick={() => setRole('CUSTOMER')} style={btnStyle(role === 'CUSTOMER')}>PM VIEW</button>
      <button onClick={() => setRole('VENDOR')} style={btnStyle(role === 'VENDOR')}>VENDOR VIEW</button>
      <div style={{ flex: 1 }}></div>
      <button onClick={() => setRole('GUEST')} style={btnStyle(role === 'GUEST')}>LOGOUT</button>
    </div>
  );
}