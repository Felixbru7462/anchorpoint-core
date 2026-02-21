import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const DEV_ACCOUNTS = {
  pm: {
    email: 'pm@test.anchorpoint.com',
    password: 'devtest123',
    route: '/pm'
  },
  vendor: {
    email: 'vendor@test.anchorpoint.com',
    password: 'devtest123',
    route: '/vendor'
  }
};

export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loginAs = async (role: 'pm' | 'vendor') => {
    setLoading(role);
    setError(null);

    // Sign out any current session first
    await supabase.auth.signOut();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: DEV_ACCOUNTS[role].email,
      password: DEV_ACCOUNTS[role].password,
    });

    if (authError) {
      setError('Dev login failed: ' + authError.message);
      setLoading(null);
      return;
    }

    navigate(DEV_ACCOUNTS[role].route);
    setLoading(null);
    setOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    setOpen(false);
  };

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px',
      zIndex: 9999, fontFamily: 'monospace'
    }}>
      {open && (
        <div style={{
          background: '#0a0a0a', border: '1px solid #ff6b00',
          borderRadius: '8px', padding: '16px', marginBottom: '10px',
          width: '220px', boxShadow: '0 0 20px rgba(255,107,0,0.3)'
        }}>
          <div style={{ fontSize: '0.65rem', color: '#ff6b00', marginBottom: '4px', letterSpacing: '1px' }}>
            ⚡ DEV OVERRIDE
          </div>
          <div style={{ fontSize: '0.6rem', color: '#444', marginBottom: '12px' }}>
            Logs in as test account
          </div>

          {error && (
            <div style={{ fontSize: '0.7rem', color: '#ff4444', marginBottom: '10px', padding: '6px', background: '#1a0000', borderRadius: '4px' }}>
              {error}
            </div>
          )}

          <button
            onClick={() => loginAs('pm')}
            disabled={!!loading}
            style={devBtn}
          >
            {loading === 'pm' ? 'Logging in...' : '🏢 Enter as PM'}
          </button>

          <button
            onClick={() => loginAs('vendor')}
            disabled={!!loading}
            style={devBtn}
          >
            {loading === 'vendor' ? 'Logging in...' : '🔧 Enter as Vendor'}
          </button>

          <div style={{ borderTop: '1px solid #222', marginTop: '12px', paddingTop: '10px' }}>
            <button
              onClick={() => { navigate('/login'); setOpen(false); }}
              style={{ ...devBtn, color: '#555', borderColor: '#222' }}
            >
              → Go to Login
            </button>
            <button
              onClick={handleSignOut}
              style={{ ...devBtn, color: '#ff4444', borderColor: '#331111' }}
            >
              → Sign Out
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        style={{
          background: open ? '#ff6b00' : '#111',
          border: '1px solid #ff6b00',
          color: open ? 'black' : '#ff6b00',
          padding: '8px 14px', borderRadius: '6px',
          cursor: 'pointer', fontSize: '0.75rem',
          fontWeight: 'bold', letterSpacing: '1px',
          display: 'block', marginLeft: 'auto',
          boxShadow: '0 0 10px rgba(255,107,0,0.2)'
        }}
      >
        {open ? '✕ DEV' : '⚡ DEV'}
      </button>
    </div>
  );
}

const devBtn: React.CSSProperties = {
  display: 'block', width: '100%',
  background: 'transparent', border: '1px solid #333',
  color: 'lime', padding: '8px 12px',
  borderRadius: '4px', cursor: 'pointer',
  fontSize: '0.8rem', marginBottom: '8px',
  textAlign: 'left', letterSpacing: '0.5px'
};