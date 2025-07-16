import React from 'react';
import { Link } from 'react-router-dom';

const ImportPage = () => {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            color: '#2563eb',
            marginBottom: '10px'
          }}>
            🐝 Import LinkedIn Contacts
          </h1>
          <Link
            to="/"
            style={{
              color: '#666',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            ← Back to Home
          </Link>
        </div>

        <div style={{
          backgroundColor: '#0077b5',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h2 style={{ margin: '0 0 15px 0' }}>Step 1: Export from LinkedIn</h2>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Go to LinkedIn.com and log in</li>
            <li>Click "Me" → "Settings & Privacy"</li>
            <li>Click "Data Privacy" → "Get a copy of your data"</li>
            <li>Select "Connections" and click "Request archive"</li>
            <li>LinkedIn will email you a download link</li>
            <li>Download and extract the .csv file</li>
          </ol>
        </div>

        <div style={{
          backgroundColor: '#f0f9ff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#2563eb' }}>Step 2: Upload Your CSV</h2>
          <form id="csvUploadForm" encType="multipart/form-data">
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold'
              }}>
                Select LinkedIn CSV file:
              </label>
              <input
                type="file"
                id="csvFile"
                name="csvFile"
                accept=".csv"
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <button
              type="submit"
              id="uploadBtn"
              style={{
                backgroundColor: '#0077b5',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Upload and Import Contacts
            </button>
          </form>
        </div>

        <div
          id="loading"
          style={{
            display: 'none',
            textAlign: 'center',
            margin: '20px 0'
          }}
        >
          <div style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #0077b5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Importing your LinkedIn contacts...</p>
        </div>

        <div
          id="result"
          style={{
            margin: '20px 0',
            padding: '15px',
            borderRadius: '5px',
            display: 'none'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <script dangerouslySetInnerHTML={{
        __html: `
          function showResult(message, type) {
            const result = document.getElementById('result');
            result.textContent = message;
            result.style.display = 'block';
            result.style.backgroundColor = type === 'success' ? '#dcfce7' : '#fee2e2';
            result.style.color = type === 'success' ? '#059669' : '#dc2626';
            result.style.border = type === 'success' ? '1px solid #059669' : '1px solid #dc2626';
          }

          document.getElementById('csvUploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fileInput = document.getElementById('csvFile');
            const uploadBtn = document.getElementById('uploadBtn');
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');
            
            if (!fileInput.files[0]) {
              showResult('Please select a CSV file', 'error');
              return;
            }

            const formData = new FormData();
            formData.append('csvFile', fileInput.files[0]);

            uploadBtn.disabled = true;
            loading.style.display = 'block';
            result.style.display = 'none';

            try {
              const response = await fetch('/api/import/linkedin', {
                method: 'POST',
                body: formData
              });

              const data = await response.json();
              loading.style.display = 'none';

              if (data.success) {
                showResult('Successfully imported ' + data.count + ' LinkedIn connections! You can now search them.', 'success');
                setTimeout(() => {
                  window.location.href = '/search';
                }, 2000);
              } else {
                showResult('Error: ' + (data.message || 'Failed to import connections'), 'error');
              }
            } catch (error) {
              loading.style.display = 'none';
              showResult('Error: ' + error.message, 'error');
            }

            uploadBtn.disabled = false;
          });
        `
      }} />
    </div>
  );
};

export default ImportPage;