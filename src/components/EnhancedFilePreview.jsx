import React, { useState } from 'react';
import ImageViewer from './ImageViewer';

const EnhancedFilePreview = ({ 
  file, 
  caption, 
  showCaption = false,
  showDownload = true,
  showFullscreen = true 
}) => {
  const [showImageViewer, setShowImageViewer] = useState(false);

  const isImage = file.type?.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
  
  const isPDF = file.type === 'application/pdf' || file.name?.endsWith('.pdf');
  const isDocument = /\.(doc|docx|txt|rtf)$/i.test(file.name);
  
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(file.url, '_blank');
    }
  };

  const getFileIcon = () => {
    if (isImage) return '🖼️';
    if (isPDF) return '📄';
    if (isDocument) return '📝';
    return '📎';
  };

  return (
    <>
      <div className="enhanced-file-preview">
        <div className="file-header">
          <div className="file-info">
            <span className="file-icon">{getFileIcon()}</span>
            <div className="file-details">
              <div className="file-name" title={file.name}>
                {file.name}
              </div>
              <div className="file-size">
                {formatFileSize(file.size)}
              </div>
            </div>
          </div>
          
          <div className="file-actions">
            {showDownload && (
              <button
                onClick={handleDownload}
                className="action-btn download-btn"
                title="Download file"
              >
                ⬇️
              </button>
            )}
            {isImage && showFullscreen && (
              <button
                onClick={() => setShowImageViewer(true)}
                className="action-btn fullscreen-btn"
                title="View fullscreen"
              >
                🔍
              </button>
            )}
            {isPDF && (
              <button
                onClick={() => window.open(file.url, '_blank')}
                className="action-btn view-btn"
                title="Open PDF"
              >
                👁️
              </button>
            )}
          </div>
        </div>

        {isImage && (
          <div className="image-preview" onClick={() => setShowImageViewer(true)}>
            <img 
              src={file.url} 
              alt={file.name}
              className="preview-image"
            />
            <div className="image-overlay">
              <span>Click to enlarge</span>
            </div>
          </div>
        )}

        {!isImage && (
          <div className="file-thumbnail">
            <div className="file-type-display">
              <span className="file-icon-large">{getFileIcon()}</span>
              <span className="file-extension">
                {file.name?.split('.').pop()?.toUpperCase() || 'FILE'}
              </span>
            </div>
          </div>
        )}

        {showCaption && caption && (
          <div className="file-caption">
            {caption}
          </div>
        )}
      </div>

      {isImage && showImageViewer && (
        <ImageViewer
          images={[file]}
          initialIndex={0}
          onClose={() => setShowImageViewer(false)}
        />
      )}

      <style jsx>{`
        .enhanced-file-preview {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .enhanced-file-preview:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .file-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .file-info {
          display: flex;
          align-items: flex-start;
          flex: 1;
        }

        .file-icon {
          font-size: 1.2rem;
          margin-right: 0.5rem;
          flex-shrink: 0;
        }

        .file-details {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          color: white;
          font-weight: 500;
          word-break: break-word;
          line-height: 1.2;
        }

        .file-size {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }

        .file-actions {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          padding: 0.5rem;
          color: white;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .download-btn:hover {
          background: rgba(76, 175, 80, 0.3);
        }

        .fullscreen-btn:hover {
          background: rgba(33, 150, 243, 0.3);
        }

        .view-btn:hover {
          background: rgba(255, 152, 0, 0.3);
        }

        .image-preview {
          position: relative;
          cursor: pointer;
          border-radius: 6px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.3);
          min-height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-image {
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
          border-radius: 6px;
          transition: transform 0.3s ease;
        }

        .image-preview:hover .preview-image {
          transform: scale(1.02);
        }

        .image-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
          color: white;
          padding: 0.75rem;
          text-align: center;
          font-size: 0.9rem;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .image-preview:hover .image-overlay {
          opacity: 1;
        }

        .file-thumbnail {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          border: 2px dashed rgba(255, 255, 255, 0.3);
        }

        .file-type-display {
          text-align: center;
        }

        .file-icon-large {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .file-extension {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.8rem;
          font-weight: 500;
        }

        .file-caption {
          margin-top: 0.75rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
          line-height: 1.4;
        }
      `}</style>
    </>
  );
};

export default EnhancedFilePreview;
