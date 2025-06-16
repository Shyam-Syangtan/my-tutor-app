import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import HomeDashboard from './components/HomeDashboard';
import TutorMarketplace from './components/TutorMarketplace';
import StudentDashboard from './components/StudentDashboard';
import MessagesPage from './components/MessagesPage';
import ProfilePage from './components/ProfilePage';
import BecomeTutorInfo from './components/BecomeTutorInfo';
import BecomeTutor from './components/BecomeTutor';
import TutorDashboard from './components/TutorDashboard';
import TutorProfile from './components/TutorProfile';
import MyTeachers from './components/MyTeachers';
import MyLessons from './components/MyLessons';
import NotFoundPage from './components/NotFoundPage';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomeDashboard />} />
          <Route path="/dashboard" element={<HomeDashboard />} />
          <Route path="/marketplace" element={<TutorMarketplace />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/become-tutor-info" element={<BecomeTutorInfo />} />
          <Route path="/become-tutor" element={<BecomeTutor />} />
          <Route path="/tutor-dashboard" element={<TutorDashboard />} />
          <Route path="/tutor/:id" element={<TutorProfile />} />
          <Route path="/my-teachers" element={<MyTeachers />} />
          <Route path="/my-lessons" element={<MyLessons />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
