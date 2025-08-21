import React from 'react';

const FilePreview = ({ file, onRemove, showCaption = true, caption = "", onCaptionChange }) => {
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      case 'txt': return '📃';
      default: return '📁';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
  };

  return (
    <div className="file-preview">
      <div className="file-preview-header">
        <div className="file-info">
          <span className="file-icon">{getFileIcon(file.name)}</span>
          <div className="file-details">
            <span className="file-name">{file.name}</span>
            <span className="file-size">{formatFileSize(file.size)}</span>
          </div>
        </div>
        {onRemove && (
          <button 
            type="button" 
            onClick={() => onRemove(file)} 
            className="remove-file-btn"
            title="Remove file"
          >
            ✕
          </button>
        )}
      </div>

      {/* Image Preview */}
      {isImage(file.name) && file.url && (
        <div className="image-preview">
          <img 
            src={file.url} 
            alt={file.name}
            className="preview-image"
            style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Caption Input */}
      {showCaption && onCaptionChange && (
        <div className="caption-input">
          <input
            type="text"
            placeholder="Add a caption (optional)"
            value={caption}
            onChange={(e) => onCaptionChange(file, e.target.value)}
            className="caption-field"
          />
        </div>
      )}

      {/* Display Caption */}
      {showCaption && caption && !onCaptionChange && (
        <div className="file-caption">
          <p>{caption}</p>
        </div>
      )}
    </div>
  );
};

export default FilePreview;
