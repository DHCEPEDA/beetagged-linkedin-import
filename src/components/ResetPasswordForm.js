import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

/**
 * Reset Password Form component
 * Allows users to set a new password after receiving a reset link
 */
const ResetPasswordForm = ({ token, onFinish }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(true);

  // In a real app, we'd validate the token on the server side
  // For demo purposes, we'll just check if it exists
  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      setError('Invalid or expired password reset link');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (!password) {
      setError('Please enter a new password');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setMessage('');
    
    try {
      const response = await axios.post('/api/auth/reset-password', { token, password });
      setMessage(response.data.message || 'Your password has been updated successfully');
      
      // Clear form fields after successful reset
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        if (onFinish) {
          onFinish();
        }
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.message || 'An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isTokenValid) {
    return (
      <div className="reset-password-form" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2 style={{ color: '#FD9E31', marginBottom: '20px', fontSize: '24px' }}>Reset Password</h2>
        
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error || 'Invalid or expired password reset link'}
        </div>
        
        <button
          onClick={onFinish}
          style={{
            padding: '10px 20px',
            backgroundColor: '#FD9E31',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="reset-password-form" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ color: '#FD9E31', marginBottom: '20px', fontSize: '24px' }}>Reset Your Password</h2>
      
      <p style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        Please choose a new password for your account.
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
        <div style={{ marginBottom: '15px' }}>
          <label 
            htmlFor="password" 
            style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontSize: '14px', 
              fontWeight: 'bold' 
            }}
          >
            New Password
          </label>
          <input 
            type="password" 
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Enter new password"
            disabled={isSubmitting}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label 
            htmlFor="confirmPassword" 
            style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontSize: '14px', 
              fontWeight: 'bold' 
            }}
          >
            Confirm Password
          </label>
          <input 
            type="password" 
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Confirm new password"
            disabled={isSubmitting}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
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
            {isSubmitting ? 'Updating...' : 'Update Password'}
            
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

ResetPasswordForm.propTypes = {
  token: PropTypes.string,
  onFinish: PropTypes.func
};

export default ResetPasswordForm;