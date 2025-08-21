import { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const FileUpload = ({ 
  onFileUpload, 
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt",
  maxSize = 10485760, // 10MB in bytes
  maxFiles = 5,
  allowMultiple = true,
  bucket = "assignments",
  folder = "",
  label = "Upload Files"
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);

  const validateFile = (file) => {
    const errors = [];
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`${file.name} exceeds ${maxSize / 1048576}MB limit`);
    }
    
    // Check file type
    const allowedTypes = accept.split(',').map(type => type.trim().toLowerCase());
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      errors.push(`${file.name} has unsupported file type`);
    }
    
    return errors;
  };

  const uploadFile = async (file, index) => {
    try {
      setUploadProgress(prev => ({ ...prev, [index]: 0 }));
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;
      
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            const percentage = (progress.loaded / progress.total) * 100;
            setUploadProgress(prev => ({ ...prev, [index]: percentage }));
          }
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        path: filePath
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length > maxFiles) {
      setErrors([`Maximum ${maxFiles} files allowed`]);
      return;
    }

    setErrors([]);
    setUploading(true);
    
    try {
      // Validate all files first
      const validationErrors = [];
      files.forEach(file => {
        validationErrors.push(...validateFile(file));
      });
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setUploading(false);
        return;
      }

      // Upload all files
      const uploadPromises = files.map((file, index) => uploadFile(file, index));
      const uploadedFiles = await Promise.all(uploadPromises);
      
      onFileUpload(uploadedFiles);
      
      // Reset form
      event.target.value = '';
      setUploadProgress({});
      
    } catch (error) {
      setErrors([`Upload failed: ${error.message}`]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <div className="file-upload-input">
        <label htmlFor="file-input" className="file-upload-label">
          <span className="file-upload-icon">📎</span>
          {label}
        </label>
        <input
          id="file-input"
          type="file"
          accept={accept}
          multiple={allowMultiple}
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="upload-progress">
          {Object.entries(uploadProgress).map(([index, progress]) => (
            <div key={index} className="progress-bar-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="progress-text">{Math.round(progress)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="upload-errors">
          {errors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Upload Status */}
      {uploading && (
        <div className="upload-status">
          <span className="loading-spinner">⏳</span>
          Uploading files...
        </div>
      )}
    </div>
  );
};

export default FileUpload;
