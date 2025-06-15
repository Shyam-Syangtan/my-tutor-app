import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import TutorMarketplace from './components/TutorMarketplace';
import './App.css';

function App() {
  return (
    <div className="App">
      <Router basename="/my-tutor-app/react-version">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/marketplace" element={<TutorMarketplace />} />
          <Route path="/home" element={<TutorMarketplace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
