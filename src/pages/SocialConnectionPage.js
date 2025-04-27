import React from 'react';
import SocialConnectionWizard from '../components/Social/SocialConnectionWizard';

const SocialConnectionPage = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-4">Connect Your Social Media</h2>
              <p className="text-muted text-center mb-4">
                Connect your social media accounts to automatically import and 
                organize your contacts from different platforms.
              </p>
              
              <SocialConnectionWizard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialConnectionPage;