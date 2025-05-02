import React, { useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

/**
 * Forgot Password Form component
 * Allows users to request a password reset link via email
 */
const ForgotPasswordForm = ({ onCancel, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setMessage('');
    
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      setMessage(response.data.message || 'If this email is registered, you will receive password reset instructions.');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-password-form" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ color: '#FD9E31', marginBottom: '20px', fontSize: '24px' }}>Reset Your Password</h2>
      
      <p style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        Enter your email address, and we'll send you instructions to reset your password.
      </p>
      
      {message && (
        <div style={{ 
          padding: '10px 15px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {message}
        </div>
      )}
      
      {error && (
        <div style={{ 
          padding: '10px 15px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label 
            htmlFor="email" 
            style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontSize: '14px', 
              fontWeight: 'bold' 
            }}
          >
            Email Address
          </label>
          <input 
            type="email" 
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Enter your email"
            disabled={isSubmitting}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: isSubmitting ? 'default' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333'
            }}
            disabled={isSubmitting}
          >
            Back to Login
          </button>
          
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#FD9E31',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'default' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: isSubmitting ? 0.7 : 1,
              position: 'relative'
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Reset Password'}
            
            {isSubmitting && (
              <span 
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  borderTopColor: 'white',
                  animation: 'spin 1s linear infinite'
                }}
              />
            )}
          </button>
        </div>
      </form>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

ForgotPasswordForm.propTypes = {
  onCancel: PropTypes.func,
  onSuccess: PropTypes.func
};

export default ForgotPasswordForm;