import React, { useState } from "react";
import "./SuspensionModal.css";

const SuspensionModal = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  userType = "student",
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commonReasons = [
    "Academic misconduct",
    "Behavioral issues",
    "Attendance problems",
    "Payment issues",
    "Violation of rules",
    "Inappropriate conduct",
    "Failure to follow guidelines",
    "Other",
  ];

  const handleSubmit = async () => {
    if (!selectedReason) {
      alert("Please select a suspension reason");
      return;
    }

    if (selectedReason === "Other" && !customReason.trim()) {
      alert("Please provide a custom reason");
      return;
    }

    setIsSubmitting(true);

    const finalReason =
      selectedReason === "Other" ? customReason.trim() : selectedReason;

    try {
      await onConfirm(selectedReason, finalReason);
      handleClose();
    } catch (error) {
      console.error("Error in suspension:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomReason("");
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="suspension-modal-overlay" onClick={handleClose}>
      <div className="suspension-modal" onClick={(e) => e.stopPropagation()}>
        <div className="suspension-modal-header">
          <h2>⚠️ Suspend {userType}</h2>
          <button className="close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="suspension-modal-body">
          <p className="warning-text">
            You are about to suspend <strong>{userName}</strong>.
            {userType === "student"
              ? " They will still be able to log in but will see a suspension message instead of their dashboard."
              : " They will be notified and their classes will be affected."}
          </p>

          <div className="reason-section">
            <label className="section-label">Select Suspension Reason:</label>
            <div className="reason-options">
              {commonReasons.map((reason) => (
                <label key={reason} className="reason-option">
                  <input
                    type="radio"
                    name="suspensionReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                  />
                  <span className="reason-text">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === "Other" && (
            <div className="custom-reason-section">
              <label className="section-label">Custom Reason:</label>
              <textarea
                className="custom-reason-input"
                placeholder="Please provide specific details for the suspension..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows="3"
                maxLength="500"
              />
              <div className="char-count">
                {customReason.length}/500 characters
              </div>
            </div>
          )}
        </div>

        <div className="suspension-modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
          >
            {isSubmitting ? "Suspending..." : `Suspend ${userType}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuspensionModal;
