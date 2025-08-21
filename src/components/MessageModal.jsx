import React from "react";
import "./MessageModal.css";

const MessageModal = ({ message, type, onClose }) => {
  if (!message) return null;

  return (
    <div className="message-modal-overlay">
      <div className={`message-modal-content ${type}`}>
        <div className="message-modal-header">
          <h2 className={type}>
            {type === "success" ? "Success!" : "An Error Occurred"}
          </h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <p>{message}</p>
        <div className="message-modal-footer">
          <button className="ok-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
