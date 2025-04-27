import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useContacts } from '../../context/ContactContext';
import FacebookLoginButton from './FacebookLoginButton';
import LinkedInLoginButton from './LinkedInLoginButton';
import '../../styles/socialWizard.css';

/**
 * A wizard component that guides users through connecting social media accounts
 * and importing contacts with a streamlined UI
 */
const SocialConnectionWizard = () => {
  const { user } = useAuth();
  const { importSocialContacts } = useContacts();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    facebook: false,
    linkedin: false
  });
  const [connectionStatus, setConnectionStatus] = useState({
    facebook: user?.facebookConnected || false,
    linkedin: user?.linkedinConnected || false
  });
  const [importInProgress, setImportInProgress] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState(null);

  // Update connection status when user data changes
  useEffect(() => {
    if (user) {
      setConnectionStatus({
        facebook: user.facebookConnected || false,
        linkedin: user.linkedinConnected || false
      });
    }
  }, [user]);

  const handlePlatformSelect = (platform) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const handleFacebookLogin = (response) => {
    // Facebook login successful
    if (response && !response.error) {
      setConnectionStatus(prev => ({
        ...prev,
        facebook: true
      }));
      
      // Auto advance to next step if LinkedIn is already connected
      // or if LinkedIn is not selected
      if (connectionStatus.linkedin || !selectedPlatforms.linkedin) {
        setCurrentStep(3); // Skip to import step
      }
    }
  };

  const handleLinkedInLogin = (response) => {
    // LinkedIn login successful
    if (response && !response.error) {
      setConnectionStatus(prev => ({
        ...prev,
        linkedin: true
      }));
      
      // Auto advance to next step if Facebook is already connected
      // or if Facebook is not selected
      if (connectionStatus.facebook || !selectedPlatforms.facebook) {
        setCurrentStep(3); // Skip to import step
      }
    }
  };

  const handleImportContacts = async () => {
    setImportInProgress(true);
    setError(null);
    
    try {
      const results = {
        totalImported: 0,
        platforms: {}
      };
      
      // Import from Facebook if selected and connected
      if (selectedPlatforms.facebook && connectionStatus.facebook) {
        try {
          const facebookResult = await importSocialContacts('facebook');
          results.platforms.facebook = facebookResult;
          results.totalImported += facebookResult.imported || 0;
        } catch (err) {
          results.platforms.facebook = { error: err.message, imported: 0 };
        }
      }
      
      // Import from LinkedIn if selected and connected
      if (selectedPlatforms.linkedin && connectionStatus.linkedin) {
        try {
          const linkedinResult = await importSocialContacts('linkedin');
          results.platforms.linkedin = linkedinResult;
          results.totalImported += linkedinResult.imported || 0;
        } catch (err) {
          results.platforms.linkedin = { error: err.message, imported: 0 };
        }
      }
      
      setImportResults(results);
      setCurrentStep(4); // Move to results step
    } catch (err) {
      setError(err.message || 'An error occurred during import');
    } finally {
      setImportInProgress(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedPlatforms({
      facebook: false,
      linkedin: false
    });
    setImportResults(null);
    setError(null);
  };

  const renderStep1 = () => (
    <div className="step-content">
      <h3 className="mb-4">Select Social Platforms</h3>
      <p className="text-muted mb-4">
        Choose which social networks you want to connect to import your contacts.
      </p>
      
      <div className="platform-options">
        <div className="card mb-3">
          <div className="card-body">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="facebookOption"
                checked={selectedPlatforms.facebook}
                onChange={() => handlePlatformSelect('facebook')}
              />
              <label className="form-check-label ms-2" htmlFor="facebookOption">
                <i className="fab fa-facebook text-primary me-2"></i>
                Facebook
                {connectionStatus.facebook && (
                  <span className="badge bg-success ms-2">Connected</span>
                )}
              </label>
            </div>
          </div>
        </div>
        
        <div className="card mb-3">
          <div className="card-body">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="linkedinOption"
                checked={selectedPlatforms.linkedin}
                onChange={() => handlePlatformSelect('linkedin')}
              />
              <label className="form-check-label ms-2" htmlFor="linkedinOption">
                <i className="fab fa-linkedin text-primary me-2"></i>
                LinkedIn
                {connectionStatus.linkedin && (
                  <span className="badge bg-success ms-2">Connected</span>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="d-flex justify-content-between mt-4">
        <div></div>
        <button
          className="btn btn-primary"
          onClick={() => setCurrentStep(2)}
          disabled={!selectedPlatforms.facebook && !selectedPlatforms.linkedin}
        >
          Next <i className="fas fa-arrow-right ms-2"></i>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h3 className="mb-4">Connect Accounts</h3>
      <p className="text-muted mb-4">
        Connect your social media accounts to import your contacts.
      </p>
      
      <div className="connect-accounts">
        {selectedPlatforms.facebook && !connectionStatus.facebook && (
          <div className="mb-4">
            <h5><i className="fab fa-facebook text-primary me-2"></i> Facebook</h5>
            <p className="text-muted">Connect your Facebook account to import your friends.</p>
            <FacebookLoginButton onLogin={handleFacebookLogin} />
          </div>
        )}
        
        {selectedPlatforms.linkedin && !connectionStatus.linkedin && (
          <div className="mb-4">
            <h5><i className="fab fa-linkedin text-primary me-2"></i> LinkedIn</h5>
            <p className="text-muted">Connect your LinkedIn account to import your connections.</p>
            <LinkedInLoginButton onLogin={handleLinkedInLogin} />
          </div>
        )}
        
        {((selectedPlatforms.facebook && connectionStatus.facebook) || 
         (selectedPlatforms.linkedin && connectionStatus.linkedin)) && (
          <div className="alert alert-success">
            <i className="fas fa-check-circle me-2"></i>
            {selectedPlatforms.facebook && connectionStatus.facebook && selectedPlatforms.linkedin && connectionStatus.linkedin
              ? 'Both accounts connected successfully!'
              : selectedPlatforms.facebook && connectionStatus.facebook
                ? 'Facebook account connected successfully!'
                : 'LinkedIn account connected successfully!'}
          </div>
        )}
      </div>
      
      <div className="d-flex justify-content-between mt-4">
        <button
          className="btn btn-outline-secondary"
          onClick={() => setCurrentStep(1)}
        >
          <i className="fas fa-arrow-left me-2"></i> Back
        </button>
        
        <button
          className="btn btn-primary"
          onClick={() => setCurrentStep(3)}
          disabled={!(
            (selectedPlatforms.facebook && connectionStatus.facebook) || 
            (selectedPlatforms.linkedin && connectionStatus.linkedin)
          )}
        >
          Next <i className="fas fa-arrow-right ms-2"></i>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h3 className="mb-4">Import Contacts</h3>
      <p className="text-muted mb-4">
        Ready to import your contacts from the connected social networks.
      </p>
      
      <div className="import-summary mb-4">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Import Summary</h5>
            <ul className="list-group list-group-flush">
              {selectedPlatforms.facebook && connectionStatus.facebook && (
                <li className="list-group-item">
                  <i className="fab fa-facebook text-primary me-2"></i> Facebook - Ready to import
                </li>
              )}
              {selectedPlatforms.linkedin && connectionStatus.linkedin && (
                <li className="list-group-item">
                  <i className="fab fa-linkedin text-primary me-2"></i> LinkedIn - Ready to import
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i> {error}
        </div>
      )}
      
      <div className="d-flex justify-content-between mt-4">
        <button
          className="btn btn-outline-secondary"
          onClick={() => setCurrentStep(2)}
          disabled={importInProgress}
        >
          <i className="fas fa-arrow-left me-2"></i> Back
        </button>
        
        <button
          className="btn btn-primary"
          onClick={handleImportContacts}
          disabled={importInProgress}
        >
          {importInProgress ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Importing...
            </>
          ) : (
            <>Import Contacts <i className="fas fa-file-import ms-2"></i></>
          )}
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const totalImported = importResults?.totalImported || 0;
    
    return (
      <div className="step-content">
        <h3 className="mb-4">Import Complete</h3>
        
        {totalImported > 0 ? (
          <div className="alert alert-success mb-4">
            <i className="fas fa-check-circle me-2"></i>
            Successfully imported {totalImported} contact{totalImported !== 1 ? 's' : ''}!
          </div>
        ) : (
          <div className="alert alert-info mb-4">
            <i className="fas fa-info-circle me-2"></i>
            No new contacts were imported. Your contacts may already be up to date.
          </div>
        )}
        
        <div className="import-results mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Import Results</h5>
              <ul className="list-group list-group-flush">
                {importResults?.platforms?.facebook && (
                  <li className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <i className="fab fa-facebook text-primary me-2"></i> Facebook
                      </div>
                      <div>
                        {importResults.platforms.facebook.error ? (
                          <span className="badge bg-danger">Error</span>
                        ) : (
                          <span className="badge bg-success">
                            {importResults.platforms.facebook.imported || 0} imported
                          </span>
                        )}
                      </div>
                    </div>
                    {importResults.platforms.facebook.error && (
                      <div className="text-danger small mt-1">
                        {importResults.platforms.facebook.error}
                      </div>
                    )}
                  </li>
                )}
                
                {importResults?.platforms?.linkedin && (
                  <li className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <i className="fab fa-linkedin text-primary me-2"></i> LinkedIn
                      </div>
                      <div>
                        {importResults.platforms.linkedin.error ? (
                          <span className="badge bg-danger">Error</span>
                        ) : (
                          <span className="badge bg-success">
                            {importResults.platforms.linkedin.imported || 0} imported
                          </span>
                        )}
                      </div>
                    </div>
                    {importResults.platforms.linkedin.error && (
                      <div className="text-danger small mt-1">
                        {importResults.platforms.linkedin.error}
                      </div>
                    )}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="d-flex justify-content-between mt-4">
          <button
            className="btn btn-outline-secondary"
            onClick={handleReset}
          >
            Start Over
          </button>
          
          <button
            className="btn btn-primary"
            onClick={() => window.location.href = '/contacts'}
          >
            View Contacts <i className="fas fa-arrow-right ms-2"></i>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="social-connection-wizard">
      <div className="wizard-header mb-4">
        <div className="progress">
          <div 
            className="progress-bar" 
            role="progressbar" 
            style={{ width: `${(currentStep / 4) * 100}%` }}
            aria-valuenow={currentStep} 
            aria-valuemin="1" 
            aria-valuemax="4"
          ></div>
        </div>
        
        <div className="steps-indicator d-flex justify-content-between mt-2">
          <div className={`step-indicator ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label d-none d-md-block">Select</div>
          </div>
          <div className={`step-indicator ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label d-none d-md-block">Connect</div>
          </div>
          <div className={`step-indicator ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label d-none d-md-block">Import</div>
          </div>
          <div className={`step-indicator ${currentStep >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label d-none d-md-block">Results</div>
          </div>
        </div>
      </div>
      
      <div className="wizard-content">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  );
};

export default SocialConnectionWizard;