import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ContactProvider } from './context/ContactContext';
import './index.css';
import './styles/tags.css';

// Create a client for React Query
const queryClient = new QueryClient();

// Create root using the new React 18 API
const container = document.getElementById('root');
const root = createRoot(container);

// Render the app using the new API
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ContactProvider>
            <App />
          </ContactProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);