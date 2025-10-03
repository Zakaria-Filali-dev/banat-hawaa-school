import React, { useState } from "react";
import EnhancedFilePreview from "./EnhancedFilePreview";
import ImageViewer from "./ImageViewer";
import ErrorBoundary from "./ErrorBoundary";

const SubmissionFilesViewer = ({ files, title = "Submitted Files" }) => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);

  if (!files || files.length === 0) {
    return null;
  }

  // Separate images from other files with better validation
  const imageFiles = files.filter((file) => {
    try {
      if (!file || !file.file_name) return false;
      const isImage =
        file.file_type?.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.file_name);
      return isImage && (file.file_url || file.url); // Ensure URL exists
    } catch (error) {
      console.error("Error filtering image file:", error, file);
      return false;
    }
  });

  const otherFiles = files.filter((file) => {
    try {
      if (!file || !file.file_name) return false;
      const isImage =
        file.file_type?.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.file_name);
      return !isImage;
    } catch (error) {
      console.error("Error filtering other file:", error, file);
      return false;
    }
  });

  const handleImageClick = (clickedFile) => {
    try {
      // Validate the file has necessary properties
      if (!clickedFile || (!clickedFile.file_url && !clickedFile.url)) {
        console.error("Invalid file data for image viewer:", clickedFile);
        return;
      }

      const imageIndex = imageFiles.findIndex(
        (img) => img.id === clickedFile.id
      );

      setInitialImageIndex(imageIndex >= 0 ? imageIndex : 0);
      setShowImageViewer(true);
    } catch (error) {
      console.error("Error opening image viewer:", error);
    }
  };

  const downloadAllFiles = async () => {
    for (const file of files) {
      try {
        const response = await fetch(file.file_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.file_name || "download";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Small delay between downloads to avoid overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download ${file.file_name}:`, error);
      }
    }
  };

  return (
    <>
      <div className="submission-files-viewer">
        <div className="files-header">
          <h4>{title}</h4>
          <div className="header-actions">
            <span className="file-count">
              {files.length} file{files.length !== 1 ? "s" : ""}
              {imageFiles.length > 0 &&
                ` (${imageFiles.length} image${
                  imageFiles.length !== 1 ? "s" : ""
                })`}
            </span>
            {files.length > 1 && (
              <button
                onClick={downloadAllFiles}
                className="download-all-btn"
                title="Download all files"
              >
                📦 Download All
              </button>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        {imageFiles.length > 0 && (
          <div className="images-section">
            <h5>Images ({imageFiles.length})</h5>
            <div className="images-grid">
              {imageFiles.map((file) => (
                <div key={file.id} className="image-card">
                  <div
                    className="image-preview-container"
                    onClick={() => handleImageClick(file)}
                  >
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="grid-image"
                    />
                    <div className="image-overlay">
                      <div className="overlay-content">
                        <span className="zoom-icon">🔍</span>
                        <span className="overlay-text">Click to enlarge</span>
                      </div>
                    </div>
                  </div>
                  <div className="image-info">
                    <div className="image-name" title={file.file_name}>
                      {file.file_name}
                    </div>
                    <div className="image-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const a = document.createElement("a");
                          a.href = file.file_url;
                          a.download = file.file_name;
                          a.click();
                        }}
                        className="download-btn-small"
                        title="Download image"
                      >
                        ⬇️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {imageFiles.length > 1 && (
              <div className="gallery-hint">
                💡 Click any image to open gallery view with zoom and navigation
              </div>
            )}
          </div>
        )}

        {/* Other Files */}
        {otherFiles.length > 0 && (
          <div className="other-files-section">
            <h5>Documents & Other Files ({otherFiles.length})</h5>
            <div className="files-list">
              {otherFiles.map((file) => (
                <EnhancedFilePreview
                  key={file.id}
                  file={{
                    name: file.file_name,
                    url: file.file_url,
                    type: file.file_type,
                    size: file.file_size,
                  }}
                  caption={file.caption}
                  showCaption={true}
                  showDownload={true}
                  showFullscreen={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {showImageViewer && imageFiles.length > 0 && (
        <ErrorBoundary>
          <ImageViewer
            images={imageFiles.map((file) => ({
              url: file.file_url,
              name: file.file_name,
            }))}
            initialIndex={initialImageIndex}
            onClose={() => setShowImageViewer(false)}
          />
        </ErrorBoundary>
      )}

      <style jsx>{`
        .submission-files-viewer {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .files-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .files-header h4 {
          color: white;
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .file-count {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }

        .download-all-btn {
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid rgba(76, 175, 80, 0.5);
          border-radius: 6px;
          color: white;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .download-all-btn:hover {
          background: rgba(76, 175, 80, 0.3);
          transform: translateY(-1px);
        }

        .images-section,
        .other-files-section {
          margin-bottom: 2rem;
        }

        .images-section h5,
        .other-files-section h5 {
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 500;
        }

        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .image-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .image-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .image-preview-container {
          position: relative;
          height: 150px;
          cursor: pointer;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.3);
        }

        .grid-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .image-preview-container:hover .grid-image {
          transform: scale(1.05);
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .image-preview-container:hover .image-overlay {
          opacity: 1;
        }

        .overlay-content {
          text-align: center;
          color: white;
        }

        .zoom-icon {
          font-size: 1.5rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .overlay-text {
          font-size: 0.9rem;
        }

        .image-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
        }

        .image-name {
          color: white;
          font-size: 0.85rem;
          font-weight: 500;
          flex: 1;
          margin-right: 0.5rem;
          word-break: break-word;
          line-height: 1.2;
        }

        .image-actions {
          flex-shrink: 0;
        }

        .download-btn-small {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: white;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s ease;
        }

        .download-btn-small:hover {
          background: rgba(76, 175, 80, 0.3);
          transform: scale(1.05);
        }

        .gallery-hint {
          background: rgba(33, 150, 243, 0.1);
          border: 1px solid rgba(33, 150, 243, 0.3);
          border-radius: 6px;
          padding: 0.75rem;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.85rem;
          text-align: center;
        }

        .files-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .images-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 0.75rem;
          }

          .image-preview-container {
            height: 120px;
          }

          .files-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            justify-content: space-between;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};

export default SubmissionFilesViewer;
