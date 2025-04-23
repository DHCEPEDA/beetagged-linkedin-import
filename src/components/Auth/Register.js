import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { loginWithSocial } from '../../utils/socialAuth';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setIsLoading(true);
    
    try {
      await register(formData.name, formData.email, formData.password);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSocialRegister = async (provider) => {
    setError('');
    setIsLoading(true);
    
    try {
      const userData = await loginWithSocial(provider);
      if (userData) {
        await register(userData.name, userData.email, null, userData);
      }
    } catch (err) {
      setError(`Failed to register with ${provider}. Please try again.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="card">
        <div className="card-body">
          <h2 className="text-center mb-4">Sign Up for BeeTagger</h2>
          
          {error && <div className="alert alert-danger">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary w-100 mb-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating account...
                </span>
              ) : 'Sign Up'}
            </button>
          </form>
          
          <div className="text-center mb-3">
            <span className="text-muted">Or sign up with</span>
          </div>
          
          <div className="d-grid gap-2 mb-3">
            <button 
              className="btn btn-outline-primary" 
              onClick={() => handleSocialRegister('linkedin')}
              disabled={isLoading}
            >
              <i className="fab fa-linkedin me-2"></i>LinkedIn
            </button>
            
            <button 
              className="btn btn-outline-primary" 
              onClick={() => handleSocialRegister('facebook')}
              disabled={isLoading}
            >
              <i className="fab fa-facebook-f me-2"></i>Facebook
            </button>
          </div>
          
          <p className="text-center mt-3">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
