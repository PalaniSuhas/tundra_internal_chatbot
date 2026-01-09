import React, { useState, useEffect } from 'react';
import { fileAPI } from '../services/api';
import { FileInfo } from '../types';
import { Upload, File as FileIcon, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  sessionId: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ sessionId }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadFiles = async () => {
    try {
      const response = await fileAPI.getFiles(sessionId);
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadFiles();
    }
  }, [sessionId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await fileAPI.uploadFile(sessionId, file);
      await loadFiles();
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ 
      padding: '1.25rem', 
      borderBottom: '1px solid var(--bg-300)',
      background: 'var(--bg-200)'
    }}>
      <label style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1.25rem',
        background: uploading 
          ? 'var(--bg-300)' 
          : `linear-gradient(135deg, var(--primary-200) 0%, var(--accent-100) 100%)`,
        color: 'white',
        borderRadius: '8px',
        cursor: uploading ? 'not-allowed' : 'pointer',
        opacity: uploading ? 0.7 : 1,
        transition: 'all 0.2s ease',
        fontWeight: 600,
        fontSize: '0.9rem'
      }}
      onMouseEnter={(e) => {
        if (!uploading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!uploading) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      >
        <Upload size={18} />
        {uploading ? 'Uploading...' : 'Upload File'}
        <input
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          accept=".pdf,.txt,.docx"
          style={{ display: 'none' }}
        />
      </label>

      {files.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ 
            fontSize: '0.85rem', 
            color: 'var(--text-200)', 
            marginBottom: '0.5rem',
            fontWeight: 600
          }}>
            Uploaded Files ({files.length})
          </div>
          {files.map((file) => (
            <div
              key={file.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'var(--bg-100)',
                borderRadius: '8px',
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                border: '1px solid var(--bg-300)',
                transition: 'border-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-100)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--bg-300)'}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: `linear-gradient(135deg, var(--primary-200) 0%, var(--accent-100) 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FileIcon size={16} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  color: 'var(--text-100)', 
                  fontWeight: 500,
                  marginBottom: '2px'
                }}>
                  {file.filename}
                </div>
                <div style={{ 
                  color: 'var(--text-200)', 
                  fontSize: '0.75rem' 
                }}>
                  {(file.file_size / 1024).toFixed(1)} KB
                </div>
              </div>
              {file.vectorized && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.25rem 0.625rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#22c55e',
                  fontWeight: 600
                }}>
                  <CheckCircle size={14} />
                  Indexed
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};