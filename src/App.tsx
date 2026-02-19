import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { PMDashboard } from "./modules/core/PMDashboard";
import { VendorDashboard } from "./modules/vendors/VendorDashboard";

function App() {
  return (
    <Router>
      <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'white' }}>
        <Routes>
          <Route path="/pm" element={<PMDashboard />} />
          <Route path="/vendor" element={<VendorDashboard />} />
          
          {/* Enhanced Landing Page */}
          <Route path="/" element={
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <h1 style={{ letterSpacing: '2px' }}>ANCHORPOINT CORE</h1>
              <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <a href="/pm" style={navBtn}>PM Portal</a>
                <a href="/vendor" style={navBtn}>Vendor Portal</a>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

const navBtn = {
  padding: '15px 30px',
  border: '1px solid lime',
  color: 'lime',
  textDecoration: 'none',
  borderRadius: '4px',
  fontSize: '0.9rem',
  fontWeight: 'bold'
};

export default App;