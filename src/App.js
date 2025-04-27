import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import components
import NavBar from './components/Navigation/NavBar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ContactList from './components/Contacts/ContactList';
import ContactDetail from './components/Contacts/ContactDetail';
import ContactImport from './components/Contacts/ContactImport';
import TagsPage from './pages/TagsPage';
import AffinityGroups from './components/Groups/AffinityGroups';
import GroupDetail from './components/Groups/GroupDetail';
import SocialConnectionPage from './pages/SocialConnectionPage';
import LinkedInCallback from './components/Social/LinkedInCallback';
import AuthPage from './pages/auth-page';

const App = () => {
  const { user, isLoading } = useAuth();

  // Create a simple component for the loader
  const Loader = () => (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  // Protected route component 
  const ProtectedRoute = ({ children }) => {
    if (isLoading) {
      return <Loader />;
    }

    if (!user) {
      return <Navigate to="/auth" replace />;
    }

    return children;
  };

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

  return (
    <div className="app">
      <NavBar />
      <main className="container" style={{ paddingTop: '80px' }}>
        <Routes>
          {/* Test route */}
          <Route path="/test" element={<TestComponent />} />
          
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <ContactList />
            </ProtectedRoute>
          } />
          <Route path="/contacts/:id" element={
            <ProtectedRoute>
              <ContactDetail />
            </ProtectedRoute>
          } />
          <Route path="/import" element={
            <ProtectedRoute>
              <ContactImport />
            </ProtectedRoute>
          } />
          <Route path="/tags" element={
            <ProtectedRoute>
              <TagsPage />
            </ProtectedRoute>
          } />
          <Route path="/groups" element={
            <ProtectedRoute>
              <AffinityGroups />
            </ProtectedRoute>
          } />
          <Route path="/groups/:id" element={
            <ProtectedRoute>
              <GroupDetail />
            </ProtectedRoute>
          } />
          <Route path="/connect" element={
            <ProtectedRoute>
              <SocialConnectionPage />
            </ProtectedRoute>
          } />
          
          {/* LinkedIn OAuth callback route - public */}
          <Route path="/linkedin-callback" element={<LinkedInCallback />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;