import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import HomeDashboard from './components/HomeDashboard';
import TutorMarketplace from './components/TutorMarketplace';
import StudentDashboard from './components/StudentDashboard';
import MessagesPage from './components/MessagesPage';
import ProfilePage from './components/ProfilePage';
import NotFoundPage from './components/NotFoundPage';
import './App.css';

function App() {
  return (
    <div className="App">
      <Router basename="/my-tutor-app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomeDashboard />} />
          <Route path="/dashboard" element={<HomeDashboard />} />
          <Route path="/marketplace" element={<TutorMarketplace />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
