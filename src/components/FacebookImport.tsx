import React, { useState, useEffect } from 'react';
import FacebookService, { Contact } from '../utils/facebookService';

interface FacebookImportProps {
  onImportComplete?: (contacts: Contact[]) => void;
  onError?: (error: string) => void;
}

export const FacebookImport: React.FC<FacebookImportProps> = ({
  onImportComplete,
  onError
}) => {
  const [appId, setAppId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [facebookService, setFacebookService] = useState<FacebookService | null>(null);

  // Initialize Facebook service when appId changes
  useEffect(() => {
    if (appId.trim()) {
      const service = new FacebookService(appId.trim());
      setFacebookService(service);
    }
  }, [appId]);

  // Check connection status
  const checkConnectionStatus = async () => {
    if (!facebookService) return;

    try {
      const status = await facebookService.getLoginStatus();
      setIsConnected(status.status === 'connected');
    } catch (error) {
      console.error('Failed to check Facebook status:', error);
      setIsConnected(false);
    }
  };

  // Connect to Facebook
  const handleConnect = async () => {
    if (!facebookService) {
      setError('Please enter a valid Facebook App ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus('Connecting to Facebook...');

    try {
      await facebookService.initialize();
      await facebookService.login();
      setIsConnected(true);
      setStatus('Connected to Facebook successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Facebook';
      setError(errorMessage);
      onError?.(errorMessage);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from Facebook
  const handleDisconnect = async () => {
    if (!facebookService) return;

    setIsLoading(true);
    try {
      await facebookService.logout();
      setIsConnected(false);
      setStatus('Disconnected from Facebook');
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Import contacts
  const handleImportContacts = async () => {
    if (!facebookService || !isConnected) {
      setError('Please connect to Facebook first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus('Importing Facebook contacts...');

    try {
      const contacts = await facebookService.importContacts(appId);
      setStatus(`Successfully imported ${contacts.length} contacts from Facebook!`);
      onImportComplete?.(contacts);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import contacts';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="facebook-import p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <div className="flex items-center mb-4">
        <svg className="w-6 h-6 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">Facebook Import</h3>
      </div>

      {/* App ID Input */}
      <div className="mb-4">
        <label htmlFor="facebook-app-id" className="block text-sm font-medium text-gray-700 mb-2">
          Facebook App ID
        </label>
        <input
          id="facebook-app-id"
          type="text"
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
          placeholder="Enter your Facebook App ID"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Create an app at <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">developers.facebook.com</a>
        </p>
      </div>

      {/* Connection Status */}
      <div className="mb-4">
        <div className={`flex items-center p-2 rounded ${isConnected ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm">
            {isConnected ? 'Connected to Facebook' : 'Not connected'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isLoading || !appId.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              'Connect to Facebook'
            )}
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleImportContacts}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                'Import Contacts'
              )}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {status && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">{status}</p>
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Important Notice */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> Facebook restricts friend data access. You'll only see friends who have also authorized your app. For broader contact import, consider using LinkedIn CSV export.
        </p>
      </div>
    </div>
  );
};

export default FacebookImport;