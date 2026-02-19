import React, { useState } from 'react';
import { attachPaymentMethod } from '../../lib/stripe';

export function Settings() {
  const [loading, setLoading] = useState(false);
  const [cardAttached, setCardAttached] = useState(false);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // In a real app, Stripe Elements handles the secure input here.
    // We are simulating the successful tokenization of a card.
    try {
      await attachPaymentMethod('pm_card_visa'); // Simulating a Visa card
      setCardAttached(true);
      alert("Payment Method Securely Vaulted");
    } catch (err) {
      alert("Failed to attach card");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', color: 'white', fontFamily: 'monospace' }}>
      <h2 style={{ color: 'lime', borderBottom: '1px solid #333', paddingBottom: '10px' }}>FINANCIAL SETTINGS</h2>
      
      <div style={{ background: '#111', padding: '30px', border: '1px solid #333', marginTop: '20px' }}>
        <h3 style={{ fontSize: '1em', margin: '0 0 20px 0' }}>DEFAULT PAYMENT METHOD</h3>
        
        {cardAttached ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: '#0a0a0a', border: '1px solid lime' }}>
            <div style={{ width: '40px', height: '25px', background: '#ccc', borderRadius: '4px' }}></div>
            <div>
              <div style={{ fontSize: '0.9em' }}>VISA ending in 4242</div>
              <div style={{ fontSize: '0.7em', color: '#666' }}>Active for Auto-Pay</div>
            </div>
            <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>REMOVE</button>
          </div>
        ) : (
          <form onSubmit={handleAddCard}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.7em', color: '#888', marginBottom: '5px' }}>CARD NUMBER</label>
              <input type="text" placeholder="0000 0000 0000 0000" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: 'white' }} />
            </div>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.7em', color: '#888', marginBottom: '5px' }}>EXPIRY</label>
                <input type="text" placeholder="MM/YY" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.7em', color: '#888', marginBottom: '5px' }}>CVC</label>
                <input type="text" placeholder="123" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: 'white' }} />
              </div>
            </div>
            <button disabled={loading} style={{ width: '100%', padding: '12px', background: 'lime', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
              {loading ? 'VAULTING...' : 'SAVE CARD SECURELY'}
            </button>
          </form>
        )}
        
        <p style={{ fontSize: '0.7em', color: '#666', marginTop: '20px', lineHeight: '1.4' }}>
          By adding a card, you authorize AnchorPoint to place a hold on funds when you dispatch a job. 
          Funds are only released to the vendor 48 hours after you verify the work.
        </p>
      </div>
    </div>
  );
}