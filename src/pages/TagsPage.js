import React from 'react';
import { Link } from 'react-router-dom';
import TagManager from '../components/Tags/TagManager';

const TagsPage = () => {
  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Tag Manager</h1>
        <Link to="/contacts" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>Back to Contacts
        </Link>
      </div>
      
      <div className="card">
        <div className="card-body">
          <p className="lead mb-4">
            Tags help you categorize your contacts based on interests, expertise, or any criteria that matter to you.
            Create affinity groups, filter contacts, or quickly find people with shared interests.
          </p>
          
          <TagManager />
        </div>
      </div>
      
      <div className="mt-4">
        <h4>Quick Tips for Effective Tagging</h4>
        <div className="row mt-3">
          <div className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="fas fa-lightbulb text-warning me-2"></i>
                  Be Consistent
                </h5>
                <p className="card-text">
                  Use a consistent naming system for your tags to make them easier to remember and use.
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="fas fa-tags text-primary me-2"></i>
                  Use Color Coding
                </h5>
                <p className="card-text">
                  Assign similar colors to related tags to create visual groupings of your contacts.
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="fas fa-users text-success me-2"></i>
                  Create Affinity Groups
                </h5>
                <p className="card-text">
                  Filter contacts by multiple tags to create powerful affinity groups based on shared interests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagsPage;