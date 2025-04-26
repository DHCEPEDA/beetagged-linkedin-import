import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

const App = () => {
  const { user, isLoading } = useAuth();

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center" style={{ height: '80vh' }}>
          <div className="loader"></div>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  return (
    <div className="app">
      <NavBar />
      <main className="container" style={{ paddingTop: '80px' }}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
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
        </Routes>
      </main>
    </div>
  );
};

export default App;