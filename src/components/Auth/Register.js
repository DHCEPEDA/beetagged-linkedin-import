import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  
  const { user, register, error, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  // Update form errors when backend error changes
  useEffect(() => {
    if (error) {
      setSubmitError(error);
    }
  }, [error]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear field error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
    
    // Clear submit error when form changes
    if (submitError) {
      setSubmitError('');
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const { name, email, password } = formData;
    const success = await register({ name, email, password });
    
    if (success) {
      navigate('/');
    }
  };
  
  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="w-50 p-5">
        <div className="card" style={{ maxWidth: '450px', margin: '0 auto' }}>
          <h2 className="text-center mb-4">Create Your Account</h2>
          
          {submitError && (
            <div className="alert alert-danger" role="alert">
              {submitError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
              {formErrors.name && (
                <div className="invalid-feedback">{formErrors.name}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
              {formErrors.email && (
                <div className="invalid-feedback">{formErrors.email}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              {formErrors.password && (
                <div className="invalid-feedback">{formErrors.password}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`form-control ${formErrors.confirmPassword ? 'is-invalid' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
              {formErrors.confirmPassword && (
                <div className="invalid-feedback">{formErrors.confirmPassword}</div>
              )}
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-100 mt-3"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
          
          <div className="text-center mt-3">
            <p>
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
      
      <div className="w-50 p-5 hide-mobile" style={{ backgroundColor: 'var(--secondary)', color: 'white' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h1 className="mb-4">Join BeeTagger Today</h1>
          <p className="mb-4">
            Create an account to start organizing your professional network and
            discover the power of contact tagging and affinity groups.
          </p>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            <li className="mb-2">✓ Organize contacts by interests and expertise</li>
            <li className="mb-2">✓ Connect with people who share similar passions</li>
            <li className="mb-2">✓ Import and sync your social media connections</li>
            <li className="mb-2">✓ Build powerful professional relationships</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;