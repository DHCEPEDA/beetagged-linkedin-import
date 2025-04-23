import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { loginWithSocial } from '../../utils/socialAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setError('');
    setIsLoading(true);
    
    try {
      const userData = await loginWithSocial(provider);
      if (userData) {
        await login(null, null, userData);
      }
    } catch (err) {
      setError(`Failed to login with ${provider}. Please try again.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="card">
        <div className="card-body">
          <h2 className="text-center mb-4">Log In to BeeTagger</h2>
          
          {error && <div className="alert alert-danger">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Logging in...
                </span>
              ) : 'Log In'}
            </button>
          </form>
          
          <div className="text-center mb-3">
            <span className="text-muted">Or continue with</span>
          </div>
          
          <div className="d-grid gap-2 mb-3">
            <button 
              className="btn btn-outline-primary" 
              onClick={() => handleSocialLogin('linkedin')}
              disabled={isLoading}
            >
              <i className="fab fa-linkedin me-2"></i>LinkedIn
            </button>
            
            <button 
              className="btn btn-outline-primary" 
              onClick={() => handleSocialLogin('facebook')}
              disabled={isLoading}
            >
              <i className="fab fa-facebook-f me-2"></i>Facebook
            </button>
          </div>
          
          <p className="text-center mt-3">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
