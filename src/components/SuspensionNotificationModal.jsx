import React from "react";
import "./SuspensionNotificationModal.css";

const SuspensionNotificationModal = ({
  isVisible,
  suspensionInfo,
  onLogout,
}) => {
  if (!isVisible) return null;

  return (
    <div className="suspension-overlay">
      <div className="suspension-modal">
        <div className="suspension-header">
          <div className="suspension-icon">🚫</div>
          <h1>Account Suspended</h1>
        </div>

        <div className="suspension-content">
          <div className="suspension-message">
            <h2>Your account has been suspended</h2>
            <p>You currently do not have access to the tutoring platform.</p>
          </div>

          {suspensionInfo?.reason && (
            <div className="suspension-reason">
              <h3>Reason for Suspension:</h3>
              <div className="reason-box">
                <p>
                  <strong>Category:</strong>{" "}
                  {suspensionInfo.category || "Not specified"}
                </p>
                {suspensionInfo.details && (
                  <p>
                    <strong>Details:</strong> {suspensionInfo.details}
                  </p>
                )}
                {suspensionInfo.date && (
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(suspensionInfo.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="contact-info">
            <h3>Need Help?</h3>
            <div className="contact-details">
              <div className="contact-item">
                <strong>📧 Email Support:</strong>
                <a href="mailto:admin@tutoringschool.com">
                  admin@tutoringschool.com
                </a>
              </div>
              <div className="contact-item">
                <strong>📞 Phone Support:</strong>
                <a href="tel:+1-555-123-4567">+1 (555) 123-4567</a>
              </div>
              <div className="contact-item">
                <strong>⏰ Office Hours:</strong>
                <span>Monday - Friday, 9:00 AM - 5:00 PM EST</span>
              </div>
            </div>
          </div>

          <div className="suspension-actions">
            <button
              className="contact-admin-btn"
              onClick={() =>
                (window.location.href =
                  "mailto:admin@tutoringschool.com?subject=Account Suspension Appeal")
              }
            >
              📧 Contact Administrator
            </button>
            <button className="logout-btn" onClick={onLogout}>
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspensionNotificationModal;
