import React, { useState, useEffect } from 'react';
import { fileAPI } from '../services/api';
import { FileInfo } from '../types';
import { Upload, File as FileIcon } from 'lucide-react';

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
      padding: '1rem', 
      borderBottom: '1px solid #e5e7eb',
      background: '#f9fafb'
    }}>
      <label style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        background: '#667eea',
        color: 'white',
        borderRadius: '6px',
        cursor: uploading ? 'not-allowed' : 'pointer',
        opacity: uploading ? 0.6 : 1
      }}>
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
        <div style={{ marginTop: '0.75rem' }}>
          {files.map((file) => (
            <div
              key={file.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                background: 'white',
                borderRadius: '4px',
                marginTop: '0.5rem',
                fontSize: '0.85rem'
              }}
            >
              <FileIcon size={16} />
              <span style={{ flex: 1 }}>{file.filename}</span>
              {file.vectorized && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: '#10b981',
                  fontWeight: 500
                }}>
                  Indexed
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};