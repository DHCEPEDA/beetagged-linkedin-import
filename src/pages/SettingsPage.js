import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// BeeTagged colors
const beeYellow = '#FFEC16';
const beeGold = '#FD9E31';

// Settings section component
const SettingsSection = ({ title, children }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px'
  }}>
    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>
      {title}
    </h3>
    {children}
  </div>
);

// Toggle switch component
const ToggleSwitch = ({ label, description, checked, onChange }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 0',
    borderBottom: '1px solid #f0f0f0'
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
        {label}
      </div>
      {description && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          {description}
        </div>
      )}
    </div>
    <div
      onClick={onChange}
      style={{
        width: '50px',
        height: '30px',
        backgroundColor: checked ? beeGold : '#ccc',
        borderRadius: '15px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease'
      }}
    >
      <div style={{
        width: '26px',
        height: '26px',
        backgroundColor: 'white',
        borderRadius: '50%',
        position: 'absolute',
        top: '2px',
        left: checked ? '22px' : '2px',
        transition: 'left 0.3s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </div>
  </div>
);

// Location options component
const LocationOptions = ({ currentLocation, onLocationChange }) => {
  const locationTypes = [
    { id: 'address', label: 'Home Address', description: 'Full street address' },
    { id: 'zipcode', label: 'Zip Code Only', description: 'Area-level location' },
    { id: 'gps', label: 'GPS City', description: 'Current city location' },
    { id: 'none', label: 'No Location', description: 'Keep location private' }
  ];

  return (
    <div>
      {locationTypes.map(type => (
        <div
          key={type.id}
          onClick={() => onLocationChange(type.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 0',
            cursor: 'pointer',
            borderBottom: '1px solid #f0f0f0'
          }}
        >
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: `2px solid ${currentLocation === type.id ? beeGold : '#ccc'}`,
            backgroundColor: currentLocation === type.id ? beeGold : 'transparent',
            marginRight: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {currentLocation === type.id && (
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: 'white',
                borderRadius: '50%'
              }} />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {type.label}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {type.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Data sync component
const DataSyncStatus = ({ lastSync, onForceSync }) => (
  <div style={{
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
          Data Synchronization
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Last synced: {lastSync || 'Never'}
        </div>
      </div>
      <button
        onClick={onForceSync}
        style={{
          backgroundColor: beeGold,
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '12px'
        }}
      >
        Sync Now
      </button>
    </div>
  </div>
);

// Main settings page
const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
    location: 'zipcode',
    password: '',
    deactivateService: false,
    vibrateNotifications: true,
    wifiOnly: false,
    uploadToServer: true,
    linkedinConnected: false,
    facebookConnected: false,
    twitterConnected: false
  });
  const [lastSync, setLastSync] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}/settings`);
      const data = await response.json();
      
      if (data.success) {
        setSettings(prev => ({ ...prev, ...data.settings }));
        setLastSync(data.lastSync || '');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Demo settings for development
      setSettings(prev => ({
        ...prev,
        linkedinConnected: true,
        lastSync: new Date().toLocaleString()
      }));
    }
  };

  const saveSettings = async (newSettings) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, ...newSettings }));
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key) => {
    const newValue = !settings[key];
    const newSettings = { [key]: newValue };
    saveSettings(newSettings);
  };

  const handleLocationChange = (locationType) => {
    saveSettings({ location: locationType });
  };

  const handlePasswordChange = (password) => {
    saveSettings({ password: password });
  };

  const handleForceSync = async () => {
    try {
      const response = await fetch(`/api/sync/force-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        setLastSync(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('Failed to force sync:', error);
    }
  };

  const connectSocialAccount = async (platform) => {
    try {
      // Redirect to OAuth flow
      window.location.href = `/api/auth/${platform}/connect?userId=${user.id}`;
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
    }
  };

  const disconnectSocialAccount = async (platform) => {
    try {
      const response = await fetch(`/api/auth/${platform}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        saveSettings({ [`${platform}Connected`]: false });
      }
    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error);
    }
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', paddingBottom: '20px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center'
      }}>
        <button
          onClick={() => navigate('/contacts')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            marginRight: '15px',
            color: '#007AFF'
          }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
          Settings
        </h1>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Account Information */}
        <SettingsSection title="Account">
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
              Email
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {user.email}
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
              Password
            </div>
            <input
              type="password"
              value={settings.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Update password"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <DataSyncStatus lastSync={lastSync} onForceSync={handleForceSync} />
        </SettingsSection>

        {/* Location Settings */}
        <SettingsSection title="Location">
          <LocationOptions
            currentLocation={settings.location}
            onLocationChange={handleLocationChange}
          />
        </SettingsSection>

        {/* App Preferences */}
        <SettingsSection title="App Preferences">
          <ToggleSwitch
            label="Vibrate for Notifications"
            description="Vibrate when rating games are available"
            checked={settings.vibrateNotifications}
            onChange={() => handleToggle('vibrateNotifications')}
          />
          
          <ToggleSwitch
            label="WiFi Only Sync"
            description="Only sync data when connected to WiFi"
            checked={settings.wifiOnly}
            onChange={() => handleToggle('wifiOnly')}
          />
          
          <ToggleSwitch
            label="Upload to Server"
            description="Share ratings and tags with network (anonymous)"
            checked={settings.uploadToServer}
            onChange={() => handleToggle('uploadToServer')}
          />
        </SettingsSection>

        {/* Social Media Connections */}
        <SettingsSection title="Connected Accounts">
          {/* LinkedIn */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 0',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                LinkedIn
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {settings.linkedinConnected ? 'Connected' : 'Connect for enhanced profiles'}
              </div>
            </div>
            <button
              onClick={() => settings.linkedinConnected ? 
                disconnectSocialAccount('linkedin') : 
                connectSocialAccount('linkedin')
              }
              style={{
                backgroundColor: settings.linkedinConnected ? '#f8f9fa' : '#0066cc',
                color: settings.linkedinConnected ? '#666' : 'white',
                border: settings.linkedinConnected ? '1px solid #ddd' : 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              {settings.linkedinConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          {/* Facebook */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 0',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                Facebook
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {settings.facebookConnected ? 'Connected' : 'Optional: Additional profile data'}
              </div>
            </div>
            <button
              onClick={() => settings.facebookConnected ? 
                disconnectSocialAccount('facebook') : 
                connectSocialAccount('facebook')
              }
              style={{
                backgroundColor: settings.facebookConnected ? '#f8f9fa' : '#4267B2',
                color: settings.facebookConnected ? '#666' : 'white',
                border: settings.facebookConnected ? '1px solid #ddd' : 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              {settings.facebookConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          {/* Twitter */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 0'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                Twitter
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {settings.twitterConnected ? 'Connected' : 'Optional: Additional profile data'}
              </div>
            </div>
            <button
              onClick={() => settings.twitterConnected ? 
                disconnectSocialAccount('twitter') : 
                connectSocialAccount('twitter')
              }
              style={{
                backgroundColor: settings.twitterConnected ? '#f8f9fa' : '#1DA1F2',
                color: settings.twitterConnected ? '#666' : 'white',
                border: settings.twitterConnected ? '1px solid #ddd' : 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              {settings.twitterConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </SettingsSection>

        {/* Privacy & Data */}
        <SettingsSection title="Privacy & Data">
          <ToggleSwitch
            label="Deactivate Service"
            description="Temporarily disable all BeeTagged features"
            checked={settings.deactivateService}
            onChange={() => handleToggle('deactivateService')}
          />
          
          <div style={{
            padding: '15px 0',
            borderTop: '1px solid #f0f0f0',
            marginTop: '15px'
          }}>
            <button
              style={{
                backgroundColor: 'transparent',
                color: '#007AFF',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '0'
              }}
            >
              Export My Data
            </button>
          </div>
          
          <div style={{ padding: '15px 0' }}>
            <button
              style={{
                backgroundColor: 'transparent',
                color: '#FF3B30',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '0'
              }}
            >
              Delete Account
            </button>
          </div>
        </SettingsSection>

        {/* App Information */}
        <SettingsSection title="About">
          <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>BeeTagged</strong> v1.0.0
            </div>
            <div style={{ marginBottom: '10px' }}>
              Transform your contacts into an intelligent network
            </div>
            <div style={{ marginBottom: '15px' }}>
              © 2024 BeeTagged. All rights reserved.
            </div>
            
            <div style={{ display: 'flex', gap: '20px' }}>
              <button style={{
                backgroundColor: 'transparent',
                color: '#007AFF',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '0'
              }}>
                Privacy Policy
              </button>
              <button style={{
                backgroundColor: 'transparent',
                color: '#007AFF',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '0'
              }}>
                Terms of Service
              </button>
              <button style={{
                backgroundColor: 'transparent',
                color: '#007AFF',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '0'
              }}>
                Support
              </button>
            </div>
          </div>
        </SettingsSection>

        {/* Logout Button */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={async () => {
              await logout();
              navigate('/auth');
            }}
            style={{
              backgroundColor: '#FF3B30',
              color: 'white',
              border: 'none',
              padding: '15px 40px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;