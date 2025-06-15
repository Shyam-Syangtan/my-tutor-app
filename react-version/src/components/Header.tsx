import React from 'react';

interface HeaderProps {
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  return (
    <nav className="responsive-nav navbar">
      <div className="responsive-container nav-container">
        <div className="nav-content">
          <div className="nav-left">
            <a href="/my-tutor-app/react-version/" className="nav-logo">IndianTutors</a>
          </div>
          <div className="nav-right nav-links">
            <a href="/my-tutor-app/react-version/marketplace" className="nav-link">Find a Teacher</a>
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
