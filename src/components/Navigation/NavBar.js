import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useContacts } from '../../context/ContactContext';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { setSearchTerm } = useContacts();
  const location = useLocation();
  
  const handleLogout = () => {
    logout();
    // Close mobile menu when logging out
    setIsMenuOpen(false);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  return (
    <nav className="navbar" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      backgroundColor: 'var(--white)',
      boxShadow: 'var(--shadow-sm)',
      zIndex: 1000,
      padding: 'var(--spacing-sm) var(--spacing-md)'
    }}>
      <div className="container flex justify-between items-center">
        <Link to="/" className="logo" style={{ 
          fontSize: 'var(--font-size-xl)', 
          fontWeight: 'bold',
          color: 'var(--dark)'
        }}>
          BeeTagger
        </Link>
        
        {/* Mobile menu button */}
        <button 
          className="hide-desktop" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 'var(--spacing-xs)'
          }}
        >
          <div style={{
            width: '24px',
            height: '3px',
            backgroundColor: 'var(--dark)',
            marginBottom: '5px'
          }}></div>
          <div style={{
            width: '24px',
            height: '3px',
            backgroundColor: 'var(--dark)',
            marginBottom: '5px'
          }}></div>
          <div style={{
            width: '24px',
            height: '3px',
            backgroundColor: 'var(--dark)'
          }}></div>
        </button>
        
        {/* Desktop & Mobile nav menu */}
        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`} style={{
          display: isMenuOpen ? 'flex' : 'none',
          flexDirection: 'column',
          position: 'absolute',
          top: '100%',
          left: 0,
          width: '100%',
          backgroundColor: 'var(--white)',
          boxShadow: 'var(--shadow-md)',
          padding: 'var(--spacing-md)',
          '@media (min-width: 768px)': {
            display: 'flex',
            position: 'static',
            flexDirection: 'row',
            boxShadow: 'none',
            padding: 0
          }
        }}>
          {user ? (
            <>
              {/* Search bar - only show on contacts page */}
              {location.pathname === '/' && (
                <div className="search-container" style={{ margin: '0 var(--spacing-md)' }}>
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    className="form-control"
                    onChange={handleSearchChange}
                    style={{ minWidth: '200px' }}
                  />
                </div>
              )}
              
              <Link
                to="/"
                className="nav-link"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: location.pathname === '/' ? 'var(--primary)' : 'var(--dark)'
                }}
              >
                Contacts
              </Link>
              <Link
                to="/groups"
                className="nav-link"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: location.pathname === '/groups' ? 'var(--primary)' : 'var(--dark)'
                }}
              >
                Groups
              </Link>
              <Link
                to="/tags"
                className="nav-link"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: location.pathname === '/tags' ? 'var(--primary)' : 'var(--dark)'
                }}
              >
                Tags
              </Link>
              <Link
                to="/import"
                className="nav-link"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: location.pathname === '/import' ? 'var(--primary)' : 'var(--dark)'
                }}
              >
                Import
              </Link>
              <Link
                to="/connect"
                className="nav-link"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: location.pathname === '/connect' ? 'var(--primary)' : 'var(--dark)'
                }}
              >
                Connect Social
              </Link>
              <button
                onClick={handleLogout}
                className="nav-link"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: 'var(--dark)',
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="nav-link"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: location.pathname === '/login' ? 'var(--primary)' : 'var(--dark)'
                }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="nav-link"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: location.pathname === '/register' ? 'var(--primary)' : 'var(--dark)'
                }}
              >
                Register
              </Link>
            </>
          )}
        </div>
        
        {/* Desktop nav - always visible on desktop */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center' }}>
          {user ? (
            <>
              {/* Search bar - only show on contacts page */}
              {location.pathname === '/' && (
                <div className="search-container" style={{ margin: '0 var(--spacing-md)' }}>
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    className="form-control"
                    onChange={handleSearchChange}
                    style={{ minWidth: '200px' }}
                  />
                </div>
              )}
              
              <Link
                to="/"
                className="nav-link"
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: location.pathname === '/' ? 'var(--primary)' : 'var(--dark)'
                }}
              >
                Contacts
              </Link>
              <Link
                to="/groups"
                className="nav-link"
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: location.pathname === '/groups' ? 'var(--primary)' : 'var(--dark)'
                }}
              >
                Groups
              </Link>
              <Link
                to="/tags"
                className="nav-link"
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: location.pathname === '/tags' ? 'var(--primary)' : 'var(--dark)'
                }}
              >
                Tags
              </Link>
              <Link
                to="/import"
                className="nav-link"
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: location.pathname === '/import' ? 'var(--primary)' : 'var(--dark)'
                }}
              >
                Import
              </Link>
              <Link
                to="/connect"
                className="nav-link"
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: location.pathname === '/connect' ? 'var(--primary)' : 'var(--dark)'
                }}
              >
                Connect Social
              </Link>
              <button
                onClick={handleLogout}
                className="nav-link"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: 'var(--dark)',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="nav-link"
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: location.pathname === '/login' ? 'var(--primary)' : 'var(--dark)'
                }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="nav-link"
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  color: location.pathname === '/register' ? 'var(--primary)' : 'var(--dark)'
                }}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;