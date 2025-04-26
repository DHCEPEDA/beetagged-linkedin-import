import React, { useState, useEffect } from 'react';
import { useContacts } from '../../context/ContactContext';
import ColorPicker from './ColorPicker';

/**
 * Tag editor component for creating and editing tags
 * @param {Object} props - Component props
 * @param {Object} props.tag - Existing tag to edit (optional)
 * @param {Function} props.onSave - Function to call when tag is saved
 * @param {Function} props.onCancel - Function to call when editing is cancelled
 */
const TagEditor = ({ tag = null, onSave, onCancel }) => {
  const { createTag, updateTag } = useContacts();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3498db'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set initial form data if editing an existing tag
  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name || '',
        description: tag.description || '',
        color: tag.color || '#3498db'
      });
    }
  }, [tag]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleColorSelect = (color) => {
    setFormData(prev => ({
      ...prev,
      color
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tag name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let savedTag;
      
      if (tag) {
        // Update existing tag
        savedTag = await updateTag(tag._id, formData);
      } else {
        // Create new tag
        savedTag = await createTag(formData);
      }
      
      if (onSave) {
        onSave(savedTag);
      }
      
      // Reset form if not editing
      if (!tag) {
        setFormData({
          name: '',
          description: '',
          color: '#3498db'
        });
      }
    } catch (err) {
      console.error('Error saving tag:', err);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to save tag. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tag-editor">
      <h5 className="mb-3">{tag ? 'Edit Tag' : 'Create New Tag'}</h5>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="tagName" className="form-label">Tag Name</label>
          <input
            type="text"
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            id="tagName"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter tag name"
            maxLength={30}
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          <small className="text-muted">Max 30 characters</small>
        </div>
        
        <div className="mb-3">
          <label htmlFor="tagDescription" className="form-label">Description (Optional)</label>
          <textarea
            className="form-control"
            id="tagDescription"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="2"
            placeholder="What does this tag represent?"
            maxLength={100}
          ></textarea>
          <small className="text-muted">Max 100 characters</small>
        </div>
        
        <div className="mb-4">
          <label className="form-label">Tag Color</label>
          <div>
            <ColorPicker
              selectedColor={formData.color}
              onColorSelect={handleColorSelect}
            />
          </div>
        </div>
        
        {errors.submit && (
          <div className="alert alert-danger" role="alert">
            {errors.submit}
          </div>
        )}
        
        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-secondary me-2"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>Save</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TagEditor;