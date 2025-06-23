import React, { useState, useEffect } from 'react';
import FacebookConnect from '../components/FacebookConnect';
import axios from 'axios';

const SocialConnect = () => {
  const [contactStats, setContactStats] = useState({});
  const [recentImports, setRecentImports] = useState([]);

  useEffect(() => {
    loadContactStats();
  }, []);

  const loadContactStats = async () => {
    try {
      const response = await axios.get('/api/contacts/stats');
      if (response.data.success) {
        setContactStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load contact stats:', error);
    }
  };

  const handleContactsImported = (importData) => {
    // Refresh stats after import
    loadContactStats();
    
    // Add to recent imports
    setRecentImports(prev => [{
      source: importData.source,
      timestamp: new Date().toISOString(),
      success: importData.success,
      message: importData.message || `Successfully imported ${importData.source} contacts`
    }, ...prev.slice(0, 4)]);
  };

  return (
    <div className="social-connect-page">
      <div className="page-header">
        <h1>Connect Your Social Networks</h1>
        <p>Import contacts from your social media accounts to enhance your networking capabilities</p>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <h3>Total Contacts</h3>
          <div className="stat-number">{contactStats.total || 0}</div>
        </div>
        <div className="stat-card">
          <h3>LinkedIn Contacts</h3>
          <div className="stat-number">{contactStats.bySource?.linkedin_import || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Facebook Contacts</h3>
          <div className="stat-number">
            {(contactStats.bySource?.facebook_user || 0) + 
             (contactStats.bySource?.facebook_friend || 0) + 
             (contactStats.bySource?.facebook_page || 0)}
          </div>
        </div>
        <div className="stat-card">
          <h3>Manual Contacts</h3>
          <div className="stat-number">{contactStats.bySource?.manual || 0}</div>
        </div>
      </div>

      <div className="connection-grid">
        <FacebookConnect onContactsImported={handleContactsImported} />
        
        <div className="coming-soon-card">
          <div className="social-icon linkedin-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </div>
          <div className="connect-info">
            <h3>LinkedIn Direct API</h3>
            <p>Direct LinkedIn integration coming soon</p>
            <div className="current-method">
              <small>Currently using CSV import method</small>
            </div>
          </div>
        </div>

        <div className="coming-soon-card">
          <div className="social-icon twitter-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </div>
          <div className="connect-info">
            <h3>Twitter/X Integration</h3>
            <p>Connect your Twitter followers</p>
            <div className="coming-soon-badge">Coming Soon</div>
          </div>
        </div>
      </div>

      {recentImports.length > 0 && (
        <div className="recent-imports">
          <h3>Recent Imports</h3>
          <div className="import-list">
            {recentImports.map((importItem, index) => (
              <div key={index} className={`import-item ${importItem.success ? 'success' : 'error'}`}>
                <div className="import-source">{importItem.source}</div>
                <div className="import-message">{importItem.message}</div>
                <div className="import-time">
                  {new Date(importItem.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="integration-info">
        <h3>About Social Media Integration</h3>
        <div className="info-grid">
          <div className="info-card">
            <h4>Facebook Friends</h4>
            <p>Import your first-degree Facebook connections with their work history, education, and location data to enhance your professional networking.</p>
            <ul>
              <li>Profile information and photos</li>
              <li>Current workplace and position</li>
              <li>Education background</li>
              <li>Location data</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>Privacy & Security</h4>
            <p>Your social media data is processed securely and stored locally. We only access information you explicitly authorize.</p>
            <ul>
              <li>OAuth 2.0 secure authentication</li>
              <li>Local data storage</li>
              <li>No data sharing with third parties</li>
              <li>Disconnect anytime</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>Search Enhancement</h4>
            <p>Once imported, your social media contacts become searchable through BeeTagged's intelligent search system.</p>
            <ul>
              <li>Natural language queries</li>
              <li>Company and role filtering</li>
              <li>Location-based searches</li>
              <li>Automatic tag generation</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .social-connect-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .page-header h1 {
          font-size: 32px;
          margin-bottom: 10px;
          color: #1a1a1a;
        }

        .page-header p {
          font-size: 16px;
          color: #666;
          max-width: 600px;
          margin: 0 auto;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }

        .stat-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-number {
          font-size: 28px;
          font-weight: bold;
          color: #1877f2;
        }

        .connection-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .coming-soon-card {
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 20px;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          opacity: 0.7;
        }

        .coming-soon-card .connect-header {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }

        .linkedin-icon {
          width: 40px;
          height: 40px;
          background: #0a66c2;
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }

        .twitter-icon {
          width: 40px;
          height: 40px;
          background: #1da1f2;
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

        .current-method {
          margin-top: 8px;
          padding: 4px 8px;
          background: #e3f2fd;
          border-radius: 4px;
          display: inline-block;
        }

        .coming-soon-badge {
          margin-top: 8px;
          padding: 4px 8px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          color: #856404;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }

        .recent-imports {
          margin-bottom: 40px;
        }

        .recent-imports h3 {
          margin-bottom: 20px;
          font-size: 20px;
        }

        .import-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .import-item {
          padding: 12px;
          border-radius: 6px;
          border-left: 4px solid #ccc;
        }

        .import-item.success {
          background: #d4edda;
          border-left-color: #28a745;
        }

        .import-item.error {
          background: #f8d7da;
          border-left-color: #dc3545;
        }

        .import-source {
          font-weight: 600;
          text-transform: capitalize;
        }

        .import-message {
          font-size: 14px;
          margin: 4px 0;
        }

        .import-time {
          font-size: 12px;
          color: #666;
        }

        .integration-info {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 8px;
        }

        .integration-info h3 {
          text-align: center;
          margin-bottom: 30px;
          font-size: 24px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .info-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .info-card h4 {
          margin: 0 0 12px 0;
          font-size: 18px;
          color: #1877f2;
        }

        .info-card p {
          margin-bottom: 16px;
          color: #666;
          line-height: 1.5;
        }

        .info-card ul {
          margin: 0;
          padding-left: 20px;
        }

        .info-card li {
          margin: 6px 0;
          color: #666;
        }

        @media (max-width: 768px) {
          .stats-overview {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .connection-grid {
            grid-template-columns: 1fr;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SocialConnect;