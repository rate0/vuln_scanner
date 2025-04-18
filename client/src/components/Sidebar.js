import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <img src="/images/logo.png" alt="Logo" />
          <span>Сканер уязвимостей</span>
        </div>
      </div>
      <div className="sidebar-menu">
        <div className="menu-section">
          <div className="menu-title">МОЯ СЛУЖБА</div>
          <ul className="menu-list">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="menu-icon">
                  <i className="fas fa-history"></i>
                </span>
                История анализа
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;