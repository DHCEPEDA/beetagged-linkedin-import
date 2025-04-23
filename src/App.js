import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/Navigation/NavBar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ContactList from './components/Contacts/ContactList';
import ContactDetail from './components/Contacts/ContactDetail';
import ContactImport from './components/Contacts/ContactImport';
import TagManager from './components/Tags/TagManager';
import AffinityGroups from './components/Groups/AffinityGroups';
import GroupDetail from './components/Groups/GroupDetail';
import { AuthContext } from './context/AuthContext';

const App = () => {
  const { isAuthenticated, loading, checkAuth } = useContext(AuthContext);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setInitialCheckDone(true);
    };

    initAuth();
  }, [checkAuth]);

  if (loading || !initialCheckDone) {
    return (
      <div className="app-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {isAuthenticated && <NavBar />}
      <div className="container mt-4">
        <Routes>
          <Route 
            path="/" 
            element={isAuthenticated ? <ContactList /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login /> : <Navigate to="/" />} 
          />
          <Route 
            path="/register" 
            element={!isAuthenticated ? <Register /> : <Navigate to="/" />} 
          />
          <Route 
            path="/contacts" 
            element={isAuthenticated ? <ContactList /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/contacts/:id" 
            element={isAuthenticated ? <ContactDetail /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/import" 
            element={isAuthenticated ? <ContactImport /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/tags" 
            element={isAuthenticated ? <TagManager /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/groups" 
            element={isAuthenticated ? <AffinityGroups /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/groups/:id" 
            element={isAuthenticated ? <GroupDetail /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
