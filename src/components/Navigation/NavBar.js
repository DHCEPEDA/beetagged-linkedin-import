import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const NavBar = () => {
  const { logout } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="fas fa-tags me-2 text-primary"></i>
          BeeTagger
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/contacts') ? 'active' : ''}`} 
                to="/contacts"
              >
                <i className="fas fa-address-book me-1"></i> Contacts
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/groups') ? 'active' : ''}`} 
                to="/groups"
              >
                <i className="fas fa-users me-1"></i> Groups
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/tags') ? 'active' : ''}`} 
                to="/tags"
              >
                <i className="fas fa-tags me-1"></i> Tags
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/import') ? 'active' : ''}`} 
                to="/import"
              >
                <i className="fas fa-file-import me-1"></i> Import
              </Link>
            </li>
          </ul>
          
          <ul className="navbar-nav">
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                id="userDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fas fa-user-circle me-1"></i> Account
              </a>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                <li>
                  <a className="dropdown-item" href="#">
                    <i className="fas fa-cog me-2"></i> Settings
                  </a>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button 
                    className="dropdown-item text-danger" 
                    onClick={logout}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i> Logout
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
