import React from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';

// Create a simple component for testing
const TestComponent = () => (
  <div className="container mt-5">
    <div className="card">
      <div className="card-body">
        <h1 className="card-title">Test Page</h1>
        <p className="card-text">This is a test component to verify routing is working properly.</p>
      </div>
    </div>
  </div>
);

// Create a simplified auth page component
const SimpleAuthPage = () => (
  <div className="container py-5">
    <div className="row">
      <div className="col-md-6">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button 
                  className="nav-link active"
                >
                  Login
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className="nav-link"
                >
                  Register
                </button>
              </li>
            </ul>
            
            <h2 className="mb-4">Welcome Back!</h2>
            
            <form>
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
              
              <button
                type="submit"
                className="btn btn-primary w-100 mb-3"
              >
                Login
              </button>
            </form>
            
            <div className="text-center mt-4">
              <p className="text-muted mb-3">Or continue with</p>
              
              {/* Bee Logo Above Facebook Login */}
              <div className="bee-logo-container mb-3">
                <img 
                  src="/images/bee-logo.svg" 
                  alt="BeeTagger Logo" 
                  className="bee-logo"
                  style={{ 
                    width: '80px', 
                    height: '80px',
                    animation: 'float 3s ease-in-out infinite'
                  }} 
                />
              </div>
              
              <button
                type="button"
                className="btn btn-outline-primary mb-3 w-100 facebook-login-btn"
              >
                <i className="fab fa-facebook me-2"></i> Continue with Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-md-6">
        <div className="card bg-warning text-dark shadow-sm h-100">
          <div className="card-body p-4 d-flex flex-column justify-content-center">
            <div className="text-center mb-4">
              <img 
                src="/images/bee-logo.svg" 
                alt="BeeTagger" 
                style={{ width: '100px', height: '100px' }} 
              />
              <h1 className="mt-3">BeeTagger</h1>
            </div>
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

// Create a home page component
const HomePage = () => (
  <div className="container mt-5">
    <div className="text-center mb-5">
      <img 
        src="/images/bee-logo.svg" 
        alt="BeeTagger Logo" 
        style={{ width: '150px', height: '150px' }} 
        className="mb-4"
      />
    </div>
    <div className="jumbotron text-center">
      <h1 className="display-4">Welcome to BeeTagger!</h1>
      <p className="lead">
        The intelligent contact management platform that connects your social network.
      </p>
      <hr className="my-4" />
      <p>
        Get started by logging in or creating an account.
      </p>
      <a className="btn btn-warning btn-lg mt-3" href="/auth" role="button">
        Login / Register
      </a>
    </div>
  </div>
);

const App = () => {
  return (
    <div className="app">
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container">
          <a className="navbar-brand" href="/">
            <img 
              src="/images/bee-logo.svg" 
              alt="BeeTagger" 
              style={{ width: '30px', height: '30px', marginRight: '10px' }} 
            />
            BeeTagger
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link" href="/test">Test</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/auth">Login / Register</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <main style={{ paddingTop: '20px' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<SimpleAuthPage />} />
          <Route path="/test" element={<TestComponent />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;