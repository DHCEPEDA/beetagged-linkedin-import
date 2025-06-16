import React, { useState, useEffect } from 'react';
import FacebookAPI from '../services/FacebookAPI.js';
import LinkedInAPI from '../services/LinkedInAPI.js';
import { UserSearchHelper } from '../utils/UserSearchHelper.js';

const SocialIntegration = ({ onContactsImported }) => {
  const [facebookAPI] = useState(new FacebookAPI());
  const [linkedinAPI] = useState(new LinkedInAPI());
  const [facebookStatus, setFacebookStatus] = useState('disconnected');
  const [linkedinStatus, setLinkedinStatus] = useState('disconnected');
  const [importProgress, setImportProgress] = useState({ facebook: null, linkedin: null });
  const [importedCounts, setImportedCounts] = useState({ facebook: 0, linkedin: 0 });

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    // Check Facebook status
    try {
      await facebookAPI.initializeAuth();
      const fbStatus = await facebookAPI.getLoginStatus();
      setFacebookStatus(fbStatus.connected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Facebook status check failed:', error);
    }

    // Check LinkedIn status
    setLinkedinStatus(linkedinAPI.isLoggedIn() ? 'connected' : 'disconnected');
  };

  const handleFacebookLogin = async () => {
    try {
      setFacebookStatus('connecting');
      const result = await facebookAPI.login();
      
      if (result.success) {
        setFacebookStatus('connected');
        await importFacebookContacts();
      }
    } catch (error) {
      console.error('Facebook login failed:', error);
      setFacebookStatus('error');
      alert('Facebook login failed. Please check your app configuration and try again.');
    }
  };

  const handleLinkedInLogin = async () => {
    try {
      setLinkedinStatus('connecting');
      const result = await linkedinAPI.login();
      
      if (result.success) {
        setLinkedinStatus('connected');
        await importLinkedInProfile();
      }
    } catch (error) {
      console.error('LinkedIn login failed:', error);
      setLinkedinStatus('error');
      alert('LinkedIn login failed. Please check your app configuration and try again.');
    }
  };

  const importFacebookContacts = async () => {
    try {
      setImportProgress(prev => ({ ...prev, facebook: 'importing' }));
      
      // Get user profile
      const profile = await facebookAPI.getUserProfile();
      const userContact = facebookAPI.profileToUser(profile);
      
      // Get friends (limited to app users)
      const friends = await facebookAPI.getFriends();
      const friendContacts = friends.map(friend => ({
        id: `facebook_${friend.id}`,
        name: friend.name,
        profileImage: friend.picture?.data?.url,
        source: 'facebook',
        tags: ['facebook_friend']
      }));

      const allContacts = [userContact, ...friendContacts];
      
      // Update local storage
      updateStoredContacts(allContacts, 'facebook');
      
      setImportedCounts(prev => ({ ...prev, facebook: allContacts.length }));
      setImportProgress(prev => ({ ...prev, facebook: 'completed' }));
      
      if (onContactsImported) {
        onContactsImported(allContacts, 'facebook');
      }
      
    } catch (error) {
      console.error('Facebook import failed:', error);
      setImportProgress(prev => ({ ...prev, facebook: 'error' }));
      alert('Failed to import Facebook contacts. Please try again.');
    }
  };

  const importLinkedInProfile = async () => {
    try {
      setImportProgress(prev => ({ ...prev, linkedin: 'importing' }));
      
      const profile = await linkedinAPI.getUserProfile();
      const connectionCount = await linkedinAPI.getConnectionCount();
      
      const userContact = linkedinAPI.profileToUser(profile, {
        connectionCount: connectionCount
      });
      
      // Update local storage
      updateStoredContacts([userContact], 'linkedin_profile');
      
      setImportedCounts(prev => ({ ...prev, linkedin: 1 }));
      setImportProgress(prev => ({ ...prev, linkedin: 'completed' }));
      
      if (onContactsImported) {
        onContactsImported([userContact], 'linkedin_profile');
      }
      
    } catch (error) {
      console.error('LinkedIn import failed:', error);
      setImportProgress(prev => ({ ...prev, linkedin: 'error' }));
      alert('Failed to import LinkedIn profile. Please try again.');
    }
  };

  const updateStoredContacts = (newContacts, source) => {
    try {
      const existingContacts = JSON.parse(localStorage.getItem('beetagged_linkedin_contacts') || '[]');
      
      // Filter out existing contacts from the same source
      const filteredExisting = existingContacts.filter(contact => contact.source !== source);
      
      // Add new contacts
      const updatedContacts = [...filteredExisting, ...newContacts];
      
      localStorage.setItem('beetagged_linkedin_contacts', JSON.stringify(updatedContacts));
    } catch (error) {
      console.error('Error updating stored contacts:', error);
    }
  };

  const handleLogout = async (platform) => {
    try {
      if (platform === 'facebook') {
        await facebookAPI.logout();
        setFacebookStatus('disconnected');
        setImportProgress(prev => ({ ...prev, facebook: null }));
      } else if (platform === 'linkedin') {
        await linkedinAPI.logout();
        setLinkedinStatus('disconnected');
        setImportProgress(prev => ({ ...prev, linkedin: null }));
      }
    } catch (error) {
      console.error(`${platform} logout failed:`, error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return '#28a745';
      case 'connecting': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Not Connected';
    }
  };

  const PlatformCard = ({ platform, status, onLogin, onLogout, importProgress, importedCount }) => (
    <div style={{
      border: `2px solid ${getStatusColor(status)}`,
      borderRadius: '12px',
      padding: '24px',
      backgroundColor: 'white',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s',
      cursor: 'pointer'
    }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
       onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: platform === 'facebook' ? '#1877F2' : '#0077B5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '20px',
          marginRight: '16px'
        }}>
          {platform === 'facebook' ? 'f' : 'in'}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 4px 0', textTransform: 'capitalize' }}>{platform}</h3>
          <div style={{
            color: getStatusColor(status),
            fontWeight: '500',
            fontSize: '14px'
          }}>
            {getStatusText(status)}
          </div>
        </div>
        
        <div style={{
          backgroundColor: getStatusColor(status),
          width: '12px',
          height: '12px',
          borderRadius: '50%'
        }}></div>
      </div>

      {importProgress && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {importProgress === 'importing' && `Importing ${platform} contacts...`}
          {importProgress === 'completed' && `Imported ${importedCount} contacts successfully`}
          {importProgress === 'error' && `Import failed. Please try again.`}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        {status === 'connected' ? (
          <>
            <button
              onClick={() => platform === 'facebook' ? importFacebookContacts() : importLinkedInProfile()}
              disabled={importProgress === 'importing'}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: importProgress === 'importing' ? 'not-allowed' : 'pointer',
                opacity: importProgress === 'importing' ? 0.6 : 1,
                flex: 1
              }}
            >
              {importProgress === 'importing' ? 'Importing...' : 'Import Contacts'}
            </button>
            <button
              onClick={() => onLogout(platform)}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={onLogin}
            disabled={status === 'connecting'}
            style={{
              backgroundColor: platform === 'facebook' ? '#1877F2' : '#0077B5',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: status === 'connecting' ? 'not-allowed' : 'pointer',
              opacity: status === 'connecting' ? 0.6 : 1,
              width: '100%',
              fontWeight: '500'
            }}
          >
            {status === 'connecting' ? 'Connecting...' : `Connect ${platform}`}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '30px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>Social Integrations</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Connect your social accounts to import and organize your professional network
          </p>
        </div>

        <div style={{ padding: '30px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            
            <PlatformCard
              platform="facebook"
              status={facebookStatus}
              onLogin={handleFacebookLogin}
              onLogout={handleLogout}
              importProgress={importProgress.facebook}
              importedCount={importedCounts.facebook}
            />
            
            <PlatformCard
              platform="linkedin"
              status={linkedinStatus}
              onLogin={handleLinkedInLogin}
              onLogout={handleLogout}
              importProgress={importProgress.linkedin}
              importedCount={importedCounts.linkedin}
            />
          </div>

          <div style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#666'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Integration Notes:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Facebook integration imports your profile and friends who also use this app</li>
              <li>LinkedIn integration imports your profile data (full contact export via CSV is recommended)</li>
              <li>All imported contacts are automatically tagged for intelligent search</li>
              <li>Your data is stored locally and never shared without permission</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialIntegration;