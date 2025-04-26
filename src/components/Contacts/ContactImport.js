import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContacts } from '../../context/ContactContext';
import { loginWithSocial } from '../../utils/socialAuth';

const ContactImport = () => {
  const [importStatus, setImportStatus] = useState({
    loading: false,
    error: null,
    success: false,
    stats: null
  });
  
  const { importSocialContacts } = useContacts();
  const navigate = useNavigate();
  
  const handleFacebookImport = async () => {
    try {
      setImportStatus({
        loading: true,
        error: null,
        success: false,
        stats: null
      });
      
      // First, authenticate with Facebook
      const userData = await loginWithSocial('facebook');
      
      if (!userData) {
        throw new Error('Failed to authenticate with Facebook');
      }
      
      // Then, import contacts using the backend service
      const result = await importSocialContacts('facebook');
      
      if (result) {
        setImportStatus({
          loading: false,
          error: null,
          success: true,
          stats: result
        });
      } else {
        throw new Error('Failed to import contacts');
      }
    } catch (error) {
      console.error('Facebook import error:', error);
      setImportStatus({
        loading: false,
        error: error.message || 'Failed to import contacts from Facebook',
        success: false,
        stats: null
      });
    }
  };
  
  const handleLinkedInImport = async () => {
    try {
      setImportStatus({
        loading: true,
        error: null,
        success: false,
        stats: null
      });
      
      // This will be implemented later - currently displays a "Coming Soon" message
      setImportStatus({
        loading: false,
        error: 'LinkedIn import is coming soon!',
        success: false,
        stats: null
      });
    } catch (error) {
      console.error('LinkedIn import error:', error);
      setImportStatus({
        loading: false,
        error: error.message || 'Failed to import contacts from LinkedIn',
        success: false,
        stats: null
      });
    }
  };
  
  const handlePhoneImport = async () => {
    try {
      setImportStatus({
        loading: true,
        error: null,
        success: false,
        stats: null
      });
      
      // This will be implemented later - currently displays a "Coming Soon" message
      setImportStatus({
        loading: false,
        error: 'Phone contacts import is coming soon!',
        success: false,
        stats: null
      });
    } catch (error) {
      console.error('Phone import error:', error);
      setImportStatus({
        loading: false,
        error: error.message || 'Failed to import phone contacts',
        success: false,
        stats: null
      });
    }
  };
  
  const handleCsvImport = async () => {
    try {
      setImportStatus({
        loading: true,
        error: null,
        success: false,
        stats: null
      });
      
      // This will be implemented later - currently displays a "Coming Soon" message
      setImportStatus({
        loading: false,
        error: 'CSV import is coming soon!',
        success: false,
        stats: null
      });
    } catch (error) {
      console.error('CSV import error:', error);
      setImportStatus({
        loading: false,
        error: error.message || 'Failed to import contacts from CSV',
        success: false,
        stats: null
      });
    }
  };
  
  const handleViewContacts = () => {
    navigate('/');
  };
  
  return (
    <div className="import-page">
      <h1 className="mb-4">Import Contacts</h1>
      
      {importStatus.error && (
        <div className="alert alert-info mb-4" role="alert">
          {importStatus.error}
        </div>
      )}
      
      {importStatus.success && (
        <div className="alert alert-success mb-4" role="alert">
          <h4>Import Successful!</h4>
          <p>
            {importStatus.stats.imported} contacts were imported
            {importStatus.stats.updated > 0 && `, ${importStatus.stats.updated} were updated`}
            {importStatus.stats.skipped > 0 && `, ${importStatus.stats.skipped} were skipped`}.
          </p>
          <button 
            className="btn btn-secondary mt-2"
            onClick={handleViewContacts}
          >
            View My Contacts
          </button>
        </div>
      )}
      
      <div className="card mb-4">
        <h3>Import from Social Networks</h3>
        <p className="mb-3">
          Import your connections from social networks to quickly build your BeeTagger contact list.
        </p>
        
        <div className="flex gap-2 flex-wrap">
          <button
            className="btn btn-facebook"
            onClick={handleFacebookImport}
            disabled={importStatus.loading}
          >
            {importStatus.loading ? 'Importing...' : 'Import from Facebook'}
          </button>
          
          <button
            className="btn btn-linkedin"
            onClick={handleLinkedInImport}
            disabled={importStatus.loading}
          >
            Import from LinkedIn
          </button>
        </div>
      </div>
      
      <div className="card mb-4">
        <h3>Import from Phone</h3>
        <p className="mb-3">
          Import contacts directly from your phone contacts.
        </p>
        
        <button
          className="btn btn-secondary"
          onClick={handlePhoneImport}
          disabled={importStatus.loading}
        >
          Import Phone Contacts
        </button>
      </div>
      
      <div className="card">
        <h3>Import from CSV</h3>
        <p className="mb-3">
          Upload a CSV file with your contacts.
        </p>
        
        <button
          className="btn btn-secondary"
          onClick={handleCsvImport}
          disabled={importStatus.loading}
        >
          Upload CSV File
        </button>
      </div>
    </div>
  );
};

export default ContactImport;