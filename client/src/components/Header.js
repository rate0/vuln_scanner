import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <div className="header">
      <div className="header-content">
        <div className="header-left">
          <button className="menu-toggle">
            <i className="fas fa-bars"></i>
          </button>
        </div>
        <div className="header-right">
          <div className="search-box">
            <i className="fas fa-search"></i>
          </div>
          <div className="help-box">
            <i className="fas fa-question-circle"></i>
          </div>
          <div className="notification-box">
            <i className="fas fa-bell"></i>
            <span className="notification-badge">11</span>
          </div>
          <div className="user-profile">
            <div className="user-avatar">
              {user?.firstName?.charAt(0)}
            </div>
            <div className="user-info">
              <span>{user?.firstName} {user?.lastName}</span>
            </div>
          </div>
          <div className="language-selector">
            <i className="fas fa-globe"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;