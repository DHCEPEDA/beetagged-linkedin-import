import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  
  const { user, login, register, loginWithFacebook, error, isLoading } = useAuth();
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
    
    if (!isLogin && !formData.name.trim()) {
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
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
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
    
    if (isLogin) {
      const success = await login(formData.email, formData.password);
      if (success) {
        navigate('/');
      }
    } else {
      const success = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      if (success) {
        navigate('/');
      }
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
    <div className="container py-5">
      <div className="row">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${isLogin ? 'active' : ''}`}
                    onClick={() => setIsLogin(true)}
                  >
                    Login
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${!isLogin ? 'active' : ''}`}
                    onClick={() => setIsLogin(false)}
                  >
                    Register
                  </button>
                </li>
              </ul>
              
              <h2 className="mb-4">{isLogin ? 'Welcome Back!' : 'Create an Account'}</h2>
              
              {submitError && (
                <div className="alert alert-danger" role="alert">
                  {submitError}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Name</label>
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
                )}
                
                <div className="mb-3">
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
                
                <div className="mb-3">
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
                
                {!isLogin && (
                  <div className="mb-3">
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
                )}
                
                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {isLogin ? 'Logging in...' : 'Creating account...'}
                    </span>
                  ) : (
                    isLogin ? 'Login' : 'Register'
                  )}
                </button>
              </form>
              
              <div className="text-center mt-4">
                <p className="text-muted mb-3">Or continue with</p>
                <button
                  type="button"
                  className="btn btn-outline-primary mb-3 w-100"
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                >
                  <i className="fab fa-facebook me-2"></i> Continue with Facebook
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card bg-primary text-white shadow-sm h-100">
            <div className="card-body p-4 d-flex flex-column justify-content-center">
              <h1 className="mb-4">BeeTagger</h1>
              <p className="lead mb-4">
                Organize your network intelligently by connecting your contacts across platforms
              </p>
              <div className="mb-4">
                <h5 className="mb-3">With BeeTagger you can:</h5>
                <ul className="list-unstyled">
                  <li className="mb-2">✓ Tag contacts based on interests and skills</li>
                  <li className="mb-2">✓ Create dynamic affinity groups</li>
                  <li className="mb-2">✓ Search contacts by tags</li>
                  <li className="mb-2">✓ Import contacts from social networks</li>
                  <li className="mb-2">✓ Keep your network organized</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;