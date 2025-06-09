import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// BeeTagged colors
const beeYellow = '#FFEC16';
const beeGold = '#FD9E31';

// Editable field component with auto-save
const EditableField = ({ label, value, onSave, placeholder, multiline = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  const handleSave = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onSave(editValue);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>
          {label}
        </div>
        {multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '8px',
              border: '2px solid #007AFF',
              borderRadius: '4px',
              fontSize: '14px',
              minHeight: '60px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '8px',
              border: '2px solid #007AFF',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
        )}
      </div>
    );
  }

  return (
    <div 
      style={{ marginBottom: '10px', cursor: 'pointer' }}
      onClick={() => setIsEditing(true)}
    >
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>
        {label}
      </div>
      <div style={{ 
        fontSize: '14px', 
        color: value ? '#333' : '#999',
        padding: '8px',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor: '#f9f9f9'
      }}>
        {value || placeholder}
      </div>
    </div>
  );
};

// Tag component with delete functionality
const TagComponent = ({ tag, onDelete, category }) => {
  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'industry': return '#007AFF';
      case 'skill': return '#34C759';
      case 'personality': return '#FF9500';
      default: return '#666';
    }
  };

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor: getCategoryColor(category),
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      margin: '2px',
      fontSize: '12px',
      fontWeight: 'bold'
    }}>
      {tag}
      <button
        onClick={onDelete}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          marginLeft: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          padding: '0'
        }}
      >
        ×
      </button>
    </div>
  );
};

// Employment history component
const EmploymentSection = ({ employment, onUpdate }) => {
  const [showAll, setShowAll] = useState(false);
  
  if (!employment) return null;

  const current = employment.current;
  const history = employment.history || [];
  const displayHistory = showAll ? history : history.slice(0, 2);

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
        Employment
      </h3>
      
      {current && (
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
          <EditableField
            label="Current Company"
            value={current.employer}
            placeholder="Enter company name"
            onSave={(value) => onUpdate({ ...employment, current: { ...current, employer: value } })}
          />
          <EditableField
            label="Current Position"
            value={current.jobFunction}
            placeholder="Enter job title"
            onSave={(value) => onUpdate({ ...employment, current: { ...current, jobFunction: value } })}
          />
        </div>
      )}

      {displayHistory.map((job, index) => (
        <div key={index} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{job.employer}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>{job.jobFunction}</div>
          {job.startDate && job.endDate && (
            <div style={{ fontSize: '12px', color: '#888' }}>
              {job.startDate} - {job.endDate}
            </div>
          )}
        </div>
      ))}

      {history.length > 2 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            background: 'none',
            border: 'none',
            color: '#007AFF',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '5px 0'
          }}
        >
          {showAll ? 'Show Less' : `Show ${history.length - 2} More`}
        </button>
      )}
    </div>
  );
};

// Education section component
const EducationSection = ({ education, onUpdate }) => {
  const [showAll, setShowAll] = useState(false);
  
  if (!education || !education.schools) return null;

  const schools = education.schools;
  const displaySchools = showAll ? schools : schools.slice(0, 2);

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
        Education
      </h3>
      
      {displaySchools.map((school, index) => (
        <div key={index} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{school.name}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>{school.degree}</div>
          {school.fieldOfStudy && (
            <div style={{ fontSize: '12px', color: '#888' }}>{school.fieldOfStudy}</div>
          )}
        </div>
      ))}

      {schools.length > 2 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            background: 'none',
            border: 'none',
            color: '#007AFF',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '5px 0'
          }}
        >
          {showAll ? 'Show Less' : `Show ${schools.length - 2} More`}
        </button>
      )}
    </div>
  );
};

// Main contact detail page
const ContactDetailPage = () => {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('skill');

  useEffect(() => {
    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setContact(data.contact);
      }
    } catch (error) {
      console.error('Failed to load contact:', error);
      // Demo data for development
      setContact({
        _id: contactId,
        name: 'John Smith',
        phoneNumber: '+1234567890',
        email: 'john.smith@gmail.com',
        priorityData: {
          employment: {
            current: { jobFunction: 'Software Engineer', employer: 'Google' },
            history: [
              { employer: 'Meta', jobFunction: 'Senior Developer', startDate: '2020', endDate: '2023' },
              { employer: 'Apple', jobFunction: 'iOS Developer', startDate: '2018', endDate: '2020' }
            ]
          },
          education: {
            schools: [
              { name: 'Stanford University', degree: 'MS Computer Science', fieldOfStudy: 'Machine Learning' },
              { name: 'UC Berkeley', degree: 'BS Computer Science', fieldOfStudy: 'Software Engineering' }
            ]
          },
          location: { current: 'San Francisco, CA' }
        },
        allTags: [
          { name: 'JavaScript', category: 'skill' },
          { name: 'Tech Industry', category: 'industry' },
          { name: 'Team Player', category: 'personality' },
          { name: 'React', category: 'skill' },
          { name: 'Leadership', category: 'personality' }
        ],
        linkedinData: { id: 'john-smith-123', profileUrl: 'https://linkedin.com/in/john-smith-123' },
        privacySettings: { level: 'professional', context: 'mixed' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldUpdate = async (field, value) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, [field]: value })
      });
      
      if (response.ok) {
        setContact(prev => ({ ...prev, [field]: value }));
      }
    } catch (error) {
      console.error('Failed to update contact:', error);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    try {
      const response = await fetch(`/api/contacts/${contactId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          tag: { name: newTag.trim(), category: selectedCategory }
        })
      });
      
      if (response.ok) {
        const updatedTags = [...(contact.allTags || []), { name: newTag.trim(), category: selectedCategory }];
        setContact(prev => ({ ...prev, allTags: updatedTags }));
        setNewTag('');
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const handleDeleteTag = async (tagToDelete) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, tagName: tagToDelete })
      });
      
      if (response.ok) {
        const updatedTags = contact.allTags.filter(tag => tag.name !== tagToDelete);
        setContact(prev => ({ ...prev, allTags: updatedTags }));
      }
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  const handleViewResume = () => {
    if (contact.linkedinData?.profileUrl) {
      window.open(contact.linkedinData.profileUrl, '_blank');
    } else {
      alert('LinkedIn profile not available');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        Loading contact details...
      </div>
    );
  }

  if (!contact) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        Contact not found
      </div>
    );
  }

  const industryTags = contact.allTags?.filter(tag => tag.category === 'industry') || [];
  const skillTags = contact.allTags?.filter(tag => tag.category === 'skill') || [];
  const personalityTags = contact.allTags?.filter(tag => tag.category === 'personality') || [];

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      {/* Header with back button */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
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
          Contact Details
        </h1>
      </div>

      {/* Contact Card */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        {/* Basic Info */}
        <EditableField
          label="Name"
          value={contact.name}
          placeholder="Enter contact name"
          onSave={(value) => handleFieldUpdate('name', value)}
        />
        
        <EditableField
          label="Cell"
          value={contact.phoneNumber}
          placeholder="Enter phone number"
          onSave={(value) => handleFieldUpdate('phoneNumber', value)}
        />
        
        <EditableField
          label="Email (Gmail default)"
          value={contact.email}
          placeholder="Enter email address"
          onSave={(value) => handleFieldUpdate('email', value)}
        />

        {/* View Resume Button */}
        <button
          onClick={handleViewResume}
          style={{
            backgroundColor: beeGold,
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '25px',
            fontWeight: 'bold',
            cursor: 'pointer',
            width: '100%',
            marginTop: '15px',
            fontSize: '14px'
          }}
        >
          View Resume
        </button>
      </div>

      {/* Employment History */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <EmploymentSection
          employment={contact.priorityData?.employment}
          onUpdate={(value) => handleFieldUpdate('priorityData.employment', value)}
        />
      </div>

      {/* Education */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <EducationSection
          education={contact.priorityData?.education}
          onUpdate={(value) => handleFieldUpdate('priorityData.education', value)}
        />
      </div>

      {/* Tags Section */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>
          Classifications
        </h3>

        {/* Industry Tags */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#007AFF' }}>
            Industry/Job Function
          </div>
          <div style={{ minHeight: '30px' }}>
            {industryTags.map(tag => (
              <TagComponent
                key={tag.name}
                tag={tag.name}
                category="industry"
                onDelete={() => handleDeleteTag(tag.name)}
              />
            ))}
          </div>
        </div>

        {/* Skill Tags */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#34C759' }}>
            Skills
          </div>
          <div style={{ minHeight: '30px' }}>
            {skillTags.map(tag => (
              <TagComponent
                key={tag.name}
                tag={tag.name}
                category="skill"
                onDelete={() => handleDeleteTag(tag.name)}
              />
            ))}
          </div>
        </div>

        {/* Personality Tags */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#FF9500' }}>
            Personality/Other
          </div>
          <div style={{ minHeight: '30px' }}>
            {personalityTags.map(tag => (
              <TagComponent
                key={tag.name}
                tag={tag.name}
                category="personality"
                onDelete={() => handleDeleteTag(tag.name)}
              />
            ))}
          </div>
        </div>

        {/* Add New Tag */}
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
            Add New Tag
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="industry">Industry</option>
              <option value="skill">Skill</option>
              <option value="personality">Personality</option>
            </select>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter tag name"
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <button
              onClick={handleAddTag}
              style={{
                backgroundColor: beeGold,
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Location */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <EditableField
          label="Location"
          value={contact.priorityData?.location?.current}
          placeholder="Enter location (address, zipcode, or city)"
          onSave={(value) => handleFieldUpdate('priorityData.location.current', value)}
        />
      </div>

      {/* Smart Lookup Field */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px' }}>
        <EditableField
          label="Smart Lookup"
          value={contact.smartLookup}
          placeholder="Additional notes or data entry"
          multiline={true}
          onSave={(value) => handleFieldUpdate('smartLookup', value)}
        />
      </div>
    </div>
  );
};

export default ContactDetailPage;