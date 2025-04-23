import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ContactContext } from '../../context/ContactContext';

const ContactImport = () => {
  const [importSource, setImportSource] = useState('phone');
  const [phonePermission, setPhonePermission] = useState(false);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState('');
  const [importComplete, setImportComplete] = useState(false);
  const [importResults, setImportResults] = useState({
    total: 0,
    added: 0,
    updated: 0,
    failed: 0
  });
  
  const { importContacts, importSocialContacts } = useContext(ContactContext);
  const navigate = useNavigate();

  const handlePermissionRequest = async () => {
    try {
      setError('');
      // In a real app, we would use the Contact Picker API
      // Here we're simulating permission being granted
      setPhonePermission(true);
    } catch (err) {
      setError('Failed to get permission to access contacts. Please try again.');
    }
  };

  const connectSocialNetwork = async (network) => {
    try {
      setError('');
      // In a real app, we would initiate OAuth flow
      // Here we're simulating successful connection
      if (network === 'linkedin') {
        setLinkedinConnected(true);
      } else if (network === 'facebook') {
        setFacebookConnected(true);
      }
    } catch (err) {
      setError(`Failed to connect to ${network}. Please try again.`);
    }
  };

  const simulateImportProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setImportProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setImportComplete(true);
        setIsImporting(false);
      }
    }, 500);
    
    return interval;
  };

  const handleImport = async () => {
    setError('');
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      let results;
      const progressInterval = simulateImportProgress();
      
      if (importSource === 'phone') {
        if (!phonePermission) {
          clearInterval(progressInterval);
          setIsImporting(false);
          return setError('Please grant permission to access contacts first.');
        }
        
        // Import phone contacts
        results = await importContacts();
      } else {
        const socialNetwork = importSource;
        const isConnected = socialNetwork === 'linkedin' 
          ? linkedinConnected 
          : facebookConnected;
        
        if (!isConnected) {
          clearInterval(progressInterval);
          setIsImporting(false);
          return setError(`Please connect to ${socialNetwork} first.`);
        }
        
        // Import social network contacts
        results = await importSocialContacts(socialNetwork);
      }
      
      // Set results after import completes
      setImportResults(results);
      
    } catch (err) {
      setError('An error occurred during import. Please try again.');
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const renderSourceOptions = () => {
    if (importSource === 'phone') {
      return (
        <div className="text-center mb-4">
          <p>BeeTagger needs permission to access your contacts.</p>
          <button 
            className="btn btn-primary"
            onClick={handlePermissionRequest}
            disabled={phonePermission || isImporting}
          >
            {phonePermission ? (
              <><i className="fas fa-check-circle me-2"></i>Permission Granted</>
            ) : (
              <>Grant Permission</>
            )}
          </button>
        </div>
      );
    } else if (importSource === 'linkedin') {
      return (
        <div className="text-center mb-4">
          <p>Connect your LinkedIn account to import your professional connections.</p>
          <button 
            className="btn btn-primary"
            onClick={() => connectSocialNetwork('linkedin')}
            disabled={linkedinConnected || isImporting}
          >
            <i className="fab fa-linkedin me-2"></i>
            {linkedinConnected ? 'Connected to LinkedIn' : 'Connect LinkedIn'}
          </button>
        </div>
      );
    } else if (importSource === 'facebook') {
      return (
        <div className="text-center mb-4">
          <p>Connect your Facebook account to import your friends.</p>
          <button 
            className="btn btn-primary"
            onClick={() => connectSocialNetwork('facebook')}
            disabled={facebookConnected || isImporting}
          >
            <i className="fab fa-facebook-f me-2"></i>
            {facebookConnected ? 'Connected to Facebook' : 'Connect Facebook'}
          </button>
        </div>
      );
    }
  };

  return (
    <div className="container">
      <div className="mb-4">
        <Link to="/contacts" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>Back to Contacts
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="text-center mb-4">Import Contacts</h2>
          
          {error && <div className="alert alert-danger">{error}</div>}
          
          {!importComplete ? (
            <>
              <div className="mb-4">
                <h5 className="mb-3">Select Import Source</h5>
                <div className="d-flex justify-content-center gap-3">
                  <div 
                    className={`card cursor-pointer ${importSource === 'phone' ? 'border-primary' : ''}`}
                    style={{ width: '150px' }}
                    onClick={() => !isImporting && setImportSource('phone')}
                  >
                    <div className="card-body text-center">
                      <i className="fas fa-address-book fa-3x mb-3 text-primary"></i>
                      <h6>Phone Contacts</h6>
                    </div>
                  </div>
                  
                  <div 
                    className={`card cursor-pointer ${importSource === 'linkedin' ? 'border-primary' : ''}`}
                    style={{ width: '150px' }}
                    onClick={() => !isImporting && setImportSource('linkedin')}
                  >
                    <div className="card-body text-center">
                      <i className="fab fa-linkedin fa-3x mb-3 text-primary"></i>
                      <h6>LinkedIn</h6>
                    </div>
                  </div>
                  
                  <div 
                    className={`card cursor-pointer ${importSource === 'facebook' ? 'border-primary' : ''}`}
                    style={{ width: '150px' }}
                    onClick={() => !isImporting && setImportSource('facebook')}
                  >
                    <div className="card-body text-center">
                      <i className="fab fa-facebook-f fa-3x mb-3 text-primary"></i>
                      <h6>Facebook</h6>
                    </div>
                  </div>
                </div>
              </div>
              
              {renderSourceOptions()}
              
              {isImporting ? (
                <div className="mb-4">
                  <h5 className="mb-2">Importing contacts...</h5>
                  <div className="progress mb-3">
                    <div 
                      className="progress-bar progress-bar-striped progress-bar-animated" 
                      role="progressbar" 
                      style={{ width: `${importProgress}%` }}
                      aria-valuenow={importProgress} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    ></div>
                  </div>
                  <p className="text-center text-muted small">
                    This may take a few moments. Please don't close this page.
                  </p>
                </div>
              ) : (
                <div className="d-grid gap-2 col-6 mx-auto">
                  <button 
                    className="btn btn-primary"
                    onClick={handleImport}
                    disabled={
                      (importSource === 'phone' && !phonePermission) ||
                      (importSource === 'linkedin' && !linkedinConnected) ||
                      (importSource === 'facebook' && !facebookConnected) ||
                      isImporting
                    }
                  >
                    <i className="fas fa-file-import me-2"></i>Import Contacts
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <i className="fas fa-check-circle fa-5x text-success"></i>
              </div>
              <h3 className="mb-3">Import Complete!</h3>
              <div className="row justify-content-center mb-4">
                <div className="col-md-8">
                  <div className="card mb-3">
                    <div className="card-body">
                      <div className="row text-center">
                        <div className="col">
                          <h2 className="mb-0">{importResults.total}</h2>
                          <p className="text-muted">Total</p>
                        </div>
                        <div className="col">
                          <h2 className="mb-0">{importResults.added}</h2>
                          <p className="text-muted">Added</p>
                        </div>
                        <div className="col">
                          <h2 className="mb-0">{importResults.updated}</h2>
                          <p className="text-muted">Updated</p>
                        </div>
                        <div className="col">
                          <h2 className="mb-0">{importResults.failed}</h2>
                          <p className="text-muted">Failed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="d-grid gap-2 col-6 mx-auto">
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/contacts')}
                >
                  View My Contacts
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setImportComplete(false);
                    setImportSource('phone');
                    setImportProgress(0);
                  }}
                >
                  Import More Contacts
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactImport;
