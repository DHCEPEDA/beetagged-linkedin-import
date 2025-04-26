import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  
  const { user, login, loginWithFacebook, error, isLoading } = useAuth();
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
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const success = await login(formData.email, formData.password);
    
    if (success) {
      navigate('/');
    }
  };
  
  const handleFacebookLogin = async () => {
    try {
      await loginWithFacebook();
      navigate('/');
    } catch (error) {
      console.error('Facebook login error:', error);
    }
  };
  
  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="w-50 p-5">
        <div className="card" style={{ maxWidth: '450px', margin: '0 auto' }}>
          <h2 className="text-center mb-4">Log in to BeeTagger</h2>
          
          {submitError && (
            <div className="alert alert-danger" role="alert">
              {submitError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
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
            
            <button
              type="submit"
              className="btn btn-primary w-100 mt-3"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          
          <div className="text-center mt-3">
            <p>Or log in with</p>
            <button
              type="button"
              className="btn btn-facebook w-100"
              onClick={handleFacebookLogin}
              disabled={isLoading}
            >
              Continue with Facebook
            </button>
            
            {/* LinkedIn login button - to be implemented later */}
            {/* <button
              type="button"
              className="btn btn-linkedin w-100 mt-2"
              onClick={handleLinkedInLogin}
              disabled={isLoading}
            >
              Continue with LinkedIn
            </button> */}
            
            <p className="mt-3">
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
      
      <div className="w-50 p-5 hide-mobile" style={{ backgroundColor: 'var(--secondary)', color: 'white' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h1 className="mb-4">Welcome to BeeTagger</h1>
          <p className="mb-4">
            BeeTagger helps you organize your professional network by seamlessly
            connecting your phone contacts with your social media connections.
          </p>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            <li className="mb-2">✓ Tag contacts based on interests</li>
            <li className="mb-2">✓ Create affinity groups</li>
            <li className="mb-2">✓ Search contacts by tags</li>
            <li className="mb-2">✓ Import contacts from Facebook and LinkedIn</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;