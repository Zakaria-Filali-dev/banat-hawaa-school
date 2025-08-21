import React from "react";
import "./SuspensionCard.css";

const SuspensionCard = ({ suspension, userType = "student" }) => {
  if (!suspension || !suspension.is_active) return null;

  return (
    <div className="suspension-overlay">
      <div className="suspension-card">
        <div className="suspension-header">
          <div className="suspension-icon">⚠️</div>
          <h1 className="suspension-title">Account Suspended</h1>
        </div>

        <div className="suspension-body">
          <div className="suspension-message">
            <p className="primary-message">
              Your {userType} account has been suspended by the administration.
            </p>

            <div className="reason-section">
              <h3 className="reason-label">Reason for Suspension:</h3>
              <div className="reason-box">
                <div className="reason-category">
                  <strong>Category:</strong> {suspension.reason_category}
                </div>
                {suspension.reason_details && (
                  <div className="reason-details">
                    <strong>Details:</strong> {suspension.reason_details}
                  </div>
                )}
              </div>
            </div>

            <div className="suspension-date">
              <p>
                <strong>Suspended on:</strong>{" "}
                {new Date(suspension.suspended_at).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="contact-info">
              <h3>What to do next:</h3>
              <ul>
                <li>
                  Contact the school administration to discuss this suspension
                </li>
                <li>Review the school policies and code of conduct</li>
                <li>
                  Schedule a meeting to resolve the issues mentioned above
                </li>
                {userType === "student" && (
                  <li>Speak with your parents/guardians about this matter</li>
                )}
              </ul>
            </div>

            <div className="admin-contact">
              <div className="contact-box">
                <h4>📞 Contact Administration</h4>
                <p>
                  Please contact the school administration office during
                  business hours to discuss your suspension and the steps needed
                  for reinstatement.
                </p>
                <div className="contact-methods">
                  <p>
                    <strong>Office Hours:</strong> Monday - Friday, 8:00 AM -
                    4:00 PM
                  </p>
                  <p>
                    <strong>Email:</strong> admin@school.edu
                  </p>
                  <p>
                    <strong>Phone:</strong> (555) 123-4567
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="suspension-footer">
          <button
            className="logout-btn"
            onClick={() => {
              // Clear auth and redirect to login
              window.location.href = "/login";
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuspensionCard;
