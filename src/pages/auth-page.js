import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  
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
              
              <form>
                {!isLogin && (
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-control"
                      placeholder="Enter your name"
                    />
                  </div>
                )}
                
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control"
                    placeholder="Enter your password"
                  />
                </div>
                
                {!isLogin && (
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      className="form-control"
                      placeholder="Confirm your password"
                    />
                  </div>
                )}
                
                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3"
                >
                  {isLogin ? 'Login' : 'Register'}
                </button>
              </form>
              
              <div className="text-center mt-4">
                <p className="text-muted mb-3">Or continue with</p>
                <button
                  type="button"
                  className="btn btn-outline-primary mb-3 w-100"
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