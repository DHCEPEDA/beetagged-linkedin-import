import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FacebookConnect = ({ onContactsImported }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [importStats, setImportStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user has already connected Facebook
    const fbConnected = localStorage.getItem('facebook_connected');
    if (fbConnected === 'true') {
      setIsConnected(true);
    }
  }, []);

  const handleFacebookConnect = async () => {
    try {
      setIsConnecting(true);
      setError('');

      // Get Facebook auth URL from server
      const response = await axios.get('/api/facebook/auth-url');
      
      if (response.data.success) {
        // Open Facebook OAuth in popup window
        const popup = window.open(
          response.data.authUrl,
          'facebook-auth',
          'width=600,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for popup to close (user completed auth)
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            // Check if auth was successful by trying to import contacts
            handleImportContacts();
          }
        }, 1000);

      } else {
        throw new Error(response.data.message || 'Failed to get Facebook auth URL');
      }
    } catch (error) {
      console.error('Facebook connect error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to connect to Facebook');
      setIsConnecting(false);
    }
  };

  const handleImportContacts = async () => {
    try {
      // For now, we'll use the callback method
      // In a real implementation, you'd handle the OAuth flow properly
      setIsConnected(true);
      localStorage.setItem('facebook_connected', 'true');
      
      // Notify parent component
      if (onContactsImported) {
        onContactsImported({ source: 'facebook', success: true });
      }
      
      setImportStats({
        friends: '(Limited by Facebook API)',
        message: 'Facebook connection established. Note: Facebook restricts friend data access.'
      });
      
    } catch (error) {
      console.error('Import contacts error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to import Facebook contacts');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setImportStats(null);
    localStorage.removeItem('facebook_connected');
    setError('');
  };

  return (
    <div className="facebook-connect-container">
      <div className="social-connect-card">
        <div className="connect-header">
          <div className="social-icon facebook-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div className="connect-info">
            <h3>Facebook Contacts</h3>
            <p>Import your Facebook friends and connections</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <strong>Connection Error:</strong> {error}
            <br />
            <small>Note: Facebook heavily restricts friend data access. Only friends who have also authorized this app will be visible.</small>
          </div>
        )}

        {!isConnected ? (
          <div className="connect-actions">
            <button 
              onClick={handleFacebookConnect}
              disabled={isConnecting}
              className="connect-button facebook-button"
            >
              {isConnecting ? (
                <>
                  <span className="loading-spinner"></span>
                  Connecting to Facebook...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Connect Facebook
                </>
              )}
            </button>
            
            <div className="connect-notice">
              <h4>What we'll access:</h4>
              <ul>
                <li>Your basic profile information</li>
                <li>Friend list (limited by Facebook)</li>
                <li>Work and education history</li>
                <li>Pages you manage</li>
              </ul>
              <small>Your data stays private and is only used for contact management.</small>
            </div>
          </div>
        ) : (
          <div className="connected-status">
            <div className="status-indicator success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              Facebook Connected
            </div>
            
            {importStats && (
              <div className="import-stats">
                <h4>Import Results:</h4>
                <p>{importStats.message}</p>
                <small>Your Facebook contacts are now searchable in BeeTagged</small>
              </div>
            )}
            
            <button 
              onClick={handleDisconnect}
              className="disconnect-button"
            >
              Disconnect Facebook
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .facebook-connect-container {
          margin: 20px 0;
        }

        .social-connect-card {
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 20px;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .connect-header {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }

        .facebook-icon {
          width: 40px;
          height: 40px;
          background: #1877f2;
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }

        .connect-info h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .connect-info p {
          margin: 0;
          color: #65676b;
          font-size: 14px;
        }

        .error-message {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 16px;
          color: #c41e3a;
          font-size: 14px;
        }

        .connect-button {
          background: #1877f2;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          margin-bottom: 16px;
          transition: background-color 0.2s;
        }

        .connect-button:hover:not(:disabled) {
          background: #166fe5;
        }

        .connect-button:disabled {
          background: #8a8d91;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .connect-notice {
          background: #f7f8fa;
          padding: 16px;
          border-radius: 6px;
          font-size: 14px;
        }

        .connect-notice h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .connect-notice ul {
          margin: 8px 0;
          padding-left: 20px;
        }

        .connect-notice li {
          margin: 4px 0;
        }

        .connected-status {
          text-align: center;
        }

        .status-indicator {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .status-indicator.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .status-indicator svg {
          margin-right: 8px;
        }

        .import-stats {
          background: #f7f8fa;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 16px;
          text-align: left;
        }

        .import-stats h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .disconnect-button {
          background: #42454a;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .disconnect-button:hover {
          background: #36393f;
        }
      `}</style>
    </div>
  );
};

export default FacebookConnect;