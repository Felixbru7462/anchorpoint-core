import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) return setError('Please fill in all fields.');
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_complete')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      setError('No profile found. Please contact support.');
      setLoading(false);
      return;
    }

    // Route based on onboarding status first, then role
    if (!profile.onboarding_complete) {
      navigate(profile.role === 'pm' ? '/onboarding/pm' : '/onboarding/vendor');
    } else {
      navigate(profile.role === 'pm' ? '/pm' : '/vendor');
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: 0, letterSpacing: '3px', fontSize: '1.4rem' }}>ANCHORPOINT</h1>
          <p style={{ margin: '6px 0 0 0', color: '#555', fontSize: '0.8rem', letterSpacing: '1px' }}>
            OPERATIONS PLATFORM
          </p>
        </div>

        <h2 style={{ margin: '0 0 24px 0', fontSize: '1rem', color: '#aaa', fontWeight: 'normal' }}>
          Sign in to your account
        </h2>

        {error && (
          <div style={{ background: '#1a0000', border: '1px solid #ff4444', color: '#ff8888', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={inputStyle} />

        <button onClick={handleLogin} disabled={loading} style={btnPrimary}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#555', fontSize: '0.85rem' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'lime', textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', backgroundColor: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const cardStyle: React.CSSProperties = { background: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '400px' };
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', padding: '12px 14px', marginBottom: '14px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '6px', fontSize: '0.95rem', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { display: 'block', width: '100%', padding: '13px', background: 'lime', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' };