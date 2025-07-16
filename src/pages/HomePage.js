import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: '#2563eb',
          marginBottom: '10px'
        }}>
          🐝 BeeTagged
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: '#666',
          maxWidth: '600px',
          lineHeight: '1.6'
        }}>
          Professional Contact Intelligence Platform
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <Link
          to="/import"
          style={{
            padding: '15px 30px',
            backgroundColor: '#0077b5',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            border: 'none',
            cursor: 'pointer',
            minWidth: '200px',
            textAlign: 'center'
          }}
        >
          Import LI Contacts
        </Link>

        <Link
          to="/search"
          style={{
            padding: '15px 30px',
            backgroundColor: '#2563eb',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            border: 'none',
            cursor: 'pointer',
            minWidth: '200px',
            textAlign: 'center'
          }}
        >
          Search
        </Link>
      </div>
    </div>
  );
};

export default HomePage;