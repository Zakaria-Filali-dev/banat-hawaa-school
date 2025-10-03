import React, { useState, useEffect, useCallback } from "react";

const ImageViewer = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);

  const currentImage = images[currentIndex];

  // Define helper functions first to avoid hoisting issues
  const getImageUrl = useCallback((file) => {
    if (!file) return null;
    return file.url || file.file_url;
  }, []);

  const getImageName = useCallback(
    (file) => {
      if (!file) return `Image ${currentIndex + 1}`;
      return file.name || file.file_name || `Image ${currentIndex + 1}`;
    },
    [currentIndex]
  );

  // Define navigation functions
  const goToPrevious = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  }, [images.length]);

  const goToNext = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  }, [images.length]);

  // Define zoom functions
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Download function
  const downloadImage = useCallback(async () => {
    try {
      const imageUrl = getImageUrl(currentImage);
      const imageName = getImageName(currentImage);

      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to fetch image");

      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = imageName || "image";

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
      // You could add a toast notification here
    }
  }, [currentImage, getImageName, getImageUrl]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "+":
        case "=":
          zoomIn();
          break;
        case "-":
          zoomOut();
          break;
        case "0":
          resetZoom();
          break;
        case "d":
        case "D":
          downloadImage();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    goToNext,
    goToPrevious,
    zoomIn,
    zoomOut,
    resetZoom,
    downloadImage,
    onClose,
  ]);

  // Reset zoom and position when image changes
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setLoading(true);
  }, [currentIndex]);

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  // Safety check: if no images or invalid index
  if (!images || images.length === 0 || !currentImage) {
    return (
      <div className="image-viewer-overlay" onClick={onClose}>
        <div
          className="image-viewer-container"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="image-viewer-header">
            <div className="image-info">
              <h3>No Image Available</h3>
            </div>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="image-container">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "400px",
                color: "white",
                fontSize: "1.2rem",
              }}
            >
              Unable to load image
            </div>
          </div>
        </div>
      </div>
    );
  }

  const imageUrl = getImageUrl(currentImage);
  if (!imageUrl) {
    return (
      <div className="image-viewer-overlay" onClick={onClose}>
        <div
          className="image-viewer-container"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="image-viewer-header">
            <div className="image-info">
              <h3>Invalid Image URL</h3>
            </div>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="image-container">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "400px",
                color: "white",
                fontSize: "1.2rem",
              }}
            >
              Image URL not available
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div
        className="image-viewer-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="image-viewer-header">
          <div className="image-info">
            <h3>{getImageName(currentImage)}</h3>
            {images.length > 1 && (
              <span className="image-counter">
                {currentIndex + 1} of {images.length}
              </span>
            )}
          </div>
          <div className="header-controls">
            <button
              onClick={downloadImage}
              className="control-btn"
              title="Download image (D)"
            >
              📥
            </button>
            <button
              onClick={resetZoom}
              className="control-btn"
              title="Reset zoom (0)"
            >
              🎯
            </button>
            <button
              onClick={zoomOut}
              className="control-btn"
              title="Zoom out (-)"
            >
              🔍-
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button
              onClick={zoomIn}
              className="control-btn"
              title="Zoom in (+)"
            >
              🔍+
            </button>
            <button
              onClick={onClose}
              className="control-btn close-btn"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div
          className="image-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {loading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <span>Loading...</span>
            </div>
          )}

          <img
            src={imageUrl}
            alt={getImageName(currentImage)}
            className="viewer-image"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${
                position.y / zoom
              }px)`,
              cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              display: loading ? "none" : "block",
            }}
            onLoad={handleImageLoad}
            onError={(e) => {
              console.error("Failed to load image:", imageUrl);
              setLoading(false);
              e.target.style.display = "none";
              // Show error message
              const errorDiv = document.createElement("div");
              errorDiv.innerHTML = "Failed to load image";
              errorDiv.style.cssText =
                "display: flex; align-items: center; justify-content: center; height: 400px; color: white; font-size: 1.2rem;";
              e.target.parentNode.appendChild(errorDiv);
            }}
            draggable={false}
          />
        </div>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              className="nav-btn nav-prev"
              onClick={goToPrevious}
              title="Previous image (←)"
            >
              ◀
            </button>
            <button
              className="nav-btn nav-next"
              onClick={goToNext}
              title="Next image (→)"
            >
              ▶
            </button>
          </>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="thumbnails-container">
            {images.map((image, index) => (
              <div
                key={index}
                className={`thumbnail ${
                  index === currentIndex ? "active" : ""
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <img
                  src={getImageUrl(image)}
                  alt={getImageName(image)}
                  className="thumbnail-image"
                />
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="instructions">
          Use mouse wheel or +/- to zoom • Drag to pan when zoomed • Arrow keys
          to navigate • D to download • ESC to close
        </div>
      </div>

      <style jsx>{`
        .image-viewer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 1);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(5px);
        }

        .image-viewer-container {
          position: relative;
          width: 95vw;
          height: 95vh;
          display: flex;
          flex-direction: column;
          background: rgba(20, 20, 20, 0.9);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .image-viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: rgba(0, 0, 0, 0.9);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          min-height: 60px;
        }

        .image-info {
          flex: 1;
          min-width: 0;
          margin-right: 1rem;
        }

        .image-info h3 {
          color: white;
          margin: 0;
          font-size: 1.1rem;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .image-counter {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
          margin-top: 0.25rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .control-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          padding: 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          min-width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .close-btn:hover {
          background: rgba(244, 67, 54, 0.3);
        }

        .zoom-level {
          color: white;
          font-size: 0.9rem;
          min-width: 50px;
          text-align: center;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
          font-weight: 500;
        }

        .image-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          background: rgba(0, 0, 0, 0.5);
        }

        .viewer-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.1s ease-out;
          user-select: none;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: white;
          font-size: 1.1rem;
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-50%) scale(1.1);
        }

        .nav-prev {
          left: 1rem;
        }

        .nav-next {
          right: 1rem;
        }

        .thumbnails-container {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.9);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          overflow-x: auto;
          max-height: 100px;
          backdrop-filter: blur(10px);
        }

        .thumbnail {
          flex-shrink: 0;
          width: 60px;
          height: 60px;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .thumbnail:hover {
          border-color: rgba(255, 255, 255, 0.5);
        }

        .thumbnail.active {
          border-color: #2196f3;
        }

        .thumbnail-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .instructions {
          text-align: center;
          padding: 0.75rem;
          color: white;
          font-size: 0.9rem;
          background: rgba(0, 0, 0, 0.8);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
          font-weight: 500;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        @media (max-width: 768px) {
          .image-viewer-container {
            width: 100vw;
            height: 100vh;
            border-radius: 0;
          }

          .image-viewer-header {
            padding: 0.75rem 1rem;
            flex-direction: column;
            gap: 0.75rem;
            align-items: stretch;
          }

          .image-info {
            text-align: center;
          }

          .image-info h3 {
            font-size: 1rem;
            margin: 0;
          }

          .image-counter {
            font-size: 0.8rem;
            margin-top: 0.125rem;
          }

          .header-controls {
            gap: 0.25rem;
            justify-content: center;
            flex-wrap: wrap;
            padding: 0 0.5rem;
          }

          .control-btn {
            padding: 0.375rem;
            min-width: 30px;
            height: 30px;
            font-size: 0.75rem;
            flex-shrink: 0;
          }

          .zoom-level {
            font-size: 0.75rem;
            min-width: 40px;
            padding: 0.375rem 0.25rem;
          }

          .nav-btn {
            width: 35px;
            height: 35px;
            font-size: 1rem;
          }

          .thumbnails-container {
            padding: 0.5rem;
            max-height: 80px;
          }

          .thumbnail {
            width: 45px;
            height: 45px;
          }

          .instructions {
            font-size: 0.75rem;
            padding: 0.5rem;
            line-height: 1.3;
          }
        }

        @media (max-width: 480px) {
          .image-viewer-header {
            padding: 0.5rem 0.75rem;
          }

          .header-controls {
            gap: 0.2rem;
            padding: 0 0.25rem;
          }

          .control-btn {
            padding: 0.3rem;
            min-width: 28px;
            height: 28px;
            font-size: 0.7rem;
          }

          .zoom-level {
            font-size: 0.7rem;
            min-width: 35px;
            padding: 0.3rem 0.2rem;
          }

          .image-info h3 {
            font-size: 0.9rem;
          }

          .image-counter {
            font-size: 0.75rem;
          }

          .nav-btn {
            width: 32px;
            height: 32px;
            font-size: 0.9rem;
          }

          .thumbnails-container {
            padding: 0.375rem;
            max-height: 70px;
          }

          .thumbnail {
            width: 40px;
            height: 40px;
          }

          .instructions {
            font-size: 0.7rem;
            padding: 0.375rem;
          }
        }

        @media (max-width: 768px) and (orientation: landscape) {
          .image-viewer-header {
            padding: 0.5rem 1rem;
            flex-direction: row;
            gap: 0.5rem;
            align-items: center;
          }

          .image-info {
            text-align: left;
            flex: 1;
            min-width: 0;
          }

          .image-info h3 {
            font-size: 0.9rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .header-controls {
            flex-shrink: 0;
            justify-content: flex-end;
            flex-wrap: nowrap;
            gap: 0.25rem;
          }

          .control-btn {
            padding: 0.25rem;
            min-width: 26px;
            height: 26px;
            font-size: 0.7rem;
          }

          .zoom-level {
            font-size: 0.7rem;
            min-width: 30px;
            padding: 0.25rem 0.1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ImageViewer;
