import React from 'react';
import { Link } from 'react-router-dom';
import { useContacts } from '../../context/ContactContext';

const AffinityGroups = () => {
  const { groups, isLoading, error } = useContacts();
  
  if (isLoading) {
    return (
      <div className="text-center p-5">
        <div className="loader"></div>
        <p>Loading groups...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }
  
  return (
    <div className="groups-page">
      <div className="flex justify-between items-center mb-4">
        <h1>Affinity Groups</h1>
        <button className="btn btn-primary">
          Create New Group
        </button>
      </div>
      
      {groups.length === 0 ? (
        <div className="card">
          <h3 className="mb-3">No Groups Yet</h3>
          <p>
            You haven't created any affinity groups yet. Affinity groups help you organize 
            contacts that share common interests or attributes.
          </p>
          
          <div className="alert alert-info mt-3">
            <h4>How to Create Groups</h4>
            <p>
              You can create groups in two ways:
            </p>
            <ul>
              <li>Manually select contacts to add to a new group</li>
              <li>Automatically create a group from contacts with the same tag</li>
            </ul>
          </div>
          
          <button className="btn btn-primary mt-3">
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="groups-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--spacing-md)'
        }}>
          {groups.map(group => (
            <Link to={`/groups/${group._id}`} key={group._id} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h3>{group.name}</h3>
              <p className="text-muted">{group.description}</p>
              
              <div className="mt-3">
                <span className="badge bg-secondary">{group.members?.length || 0} members</span>
              </div>
              
              {group.tags && group.tags.length > 0 && (
                <div className="group-tags mt-2">
                  {group.tags.map(tag => (
                    <span key={tag._id} className="tag">
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
      
      {/* Information about Affinity Groups */}
      <div className="card mt-4">
        <h3 className="mb-3">About Affinity Groups</h3>
        <p>
          Affinity groups bring together contacts who share common interests, skills, 
          or attributes. These groups can be powerful for networking, collaboration, 
          and community building.
        </p>
        
        <h4 className="mt-3">Benefits of Affinity Groups:</h4>
        <ul>
          <li>Connect people with shared interests</li>
          <li>Facilitate targeted networking opportunities</li>
          <li>Organize events or discussions around specific topics</li>
          <li>Build communities of like-minded professionals</li>
        </ul>
        
        <h4 className="mt-3">Example Uses:</h4>
        <ul>
          <li>Industry-specific networking groups</li>
          <li>Skill-based communities (e.g., "JavaScript Developers")</li>
          <li>Interest-based groups (e.g., "Sustainable Business")</li>
          <li>Geographic communities (e.g., "Bay Area Professionals")</li>
        </ul>
      </div>
    </div>
  );
};

export default AffinityGroups;