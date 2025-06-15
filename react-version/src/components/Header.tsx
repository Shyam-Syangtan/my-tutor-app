import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

interface HeaderProps {
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  return (
    <nav className="responsive-nav navbar">
      <div className="responsive-container nav-container">
        <div className="nav-content">
          <div className="nav-left">
            <Link to={ROUTES.LANDING} className="nav-logo">IndianTutors</Link>
          </div>
          <div className="nav-right nav-links">
            <Link to={ROUTES.MARKETPLACE} className="nav-link">Find a Teacher</Link>
            <button
              className="btn btn-primary nav-btn login-btn"
              onClick={onLoginClick}
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
