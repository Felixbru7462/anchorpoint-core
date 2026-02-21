import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Role = 'pm' | 'vendor';

export function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) return setError('Please fill in all fields.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (!role) return setError('Please select your account type.');

    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError('Sign up failed. Please try again.');
      setLoading(false);
      return;
    }

    // Write role to profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, role }]);

    if (profileError) {
      setError('Account created but role assignment failed: ' + profileError.message);
      setLoading(false);
      return;
    }

    // Route to correct dashboard
    if (role === 'pm') navigate('/onboarding/pm');
    else navigate('/onboarding/vendor');
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
          Create your account
        </h2>

        {error && (
          <div style={{ background: '#1a0000', border: '1px solid #ff4444', color: '#ff8888', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Role Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>
            ACCOUNT TYPE
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => setRole('pm')}
              style={{
                padding: '14px 10px', borderRadius: '8px', cursor: 'pointer',
                background: role === 'pm' ? '#001a00' : '#000',
                border: role === 'pm' ? '2px solid lime' : '1px solid #333',
                color: role === 'pm' ? 'lime' : '#666',
                fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.15s'
              }}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🏢</div>
              Customer / PM
            </button>
            <button
              onClick={() => setRole('vendor')}
              style={{
                padding: '14px 10px', borderRadius: '8px', cursor: 'pointer',
                background: role === 'vendor' ? '#001a00' : '#000',
                border: role === 'vendor' ? '2px solid lime' : '1px solid #333',
                color: role === 'vendor' ? 'lime' : '#666',
                fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.15s'
              }}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🔧</div>
              Vendor / Provider
            </button>
          </div>
        </div>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSignUp()}
          style={inputStyle}
        />

        <button
          onClick={handleSignUp}
          disabled={loading}
          style={btnPrimary}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#555', fontSize: '0.85rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'lime', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh', backgroundColor: '#050505',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '20px'
};

const cardStyle: React.CSSProperties = {
  background: '#0a0a0a', border: '1px solid #222',
  borderRadius: '12px', padding: '40px',
  width: '100%', maxWidth: '400px'
};

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '12px 14px',
  marginBottom: '14px', background: '#000',
  border: '1px solid #333', color: 'white',
  borderRadius: '6px', fontSize: '0.95rem',
  boxSizing: 'border-box', outline: 'none'
};

const btnPrimary: React.CSSProperties = {
  display: 'block', width: '100%', padding: '13px',
  background: 'lime', color: 'black',
  border: 'none', borderRadius: '6px',
  cursor: 'pointer', fontWeight: 'bold',
  fontSize: '0.95rem', letterSpacing: '0.5px',
  marginTop: '4px'
};
