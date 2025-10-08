import React, { useState } from "react";
import "./UserDeletionModal.css";

const UserDeletionModal = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  userType, // "student" or "teacher"
}) => {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const isStudent = userType === "student";
  const expectedInput = isStudent ? userName : "DELETE";
  const isConfirmationValid = confirmationInput === expectedInput;

  const handleConfirm = async () => {
    if (!isConfirmationValid) return;

    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Deletion failed:", error);
    } finally {
      setIsDeleting(false);
      setConfirmationInput("");
    }
  };

  const handleClose = () => {
    setConfirmationInput("");
    onClose();
  };

  const dataToDelete = {
    student: [
      "Student profile and personal information",
      "Assignment submissions and files",
      "Grades and academic progress",
      "Subject enrollments",
      "Class attendance records",
      "All uploaded files and documents",
      "Complete account from authentication system",
    ],
    teacher: [
      "Teacher profile and personal information",
      "All assignments they created",
      "Class sessions they scheduled",
      "Grades they assigned to students",
      "Subject assignments and teaching records",
      "All uploaded files and materials",
      "Student notifications and communications",
      "Complete account from authentication system",
    ],
  };

  return (
    <div className="deletion-modal-overlay" onClick={handleClose}>
      <div
        className="deletion-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="deletion-modal-header">
          <div className="danger-icon">⚠️</div>
          <h2>Permanent Account Deletion</h2>
          <p className="subtitle">
            This action will permanently delete <strong>{userName}</strong>'s{" "}
            {userType} account
          </p>
        </div>

        <div className="deletion-modal-body">
          <div className="warning-box">
            <div className="warning-header">
              <span className="warning-icon">🚨</span>
              <strong>CRITICAL WARNING</strong>
            </div>
            <p>
              This action is <strong>IRREVERSIBLE</strong> and will permanently
              remove all data associated with this account.
            </p>
          </div>

          <div className="data-deletion-section">
            <h3>The following data will be permanently deleted:</h3>
            <ul className="deletion-list">
              {dataToDelete[userType].map((item, index) => (
                <li key={index}>
                  <span className="deletion-item-icon">🗑️</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="confirmation-section">
            <h3>Confirmation Required</h3>
            <p>
              To confirm deletion, please type{" "}
              <strong>"{expectedInput}"</strong> exactly:
            </p>
            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={`Type "${expectedInput}" to confirm`}
              className={`confirmation-input ${
                confirmationInput && !isConfirmationValid ? "invalid" : ""
              } ${isConfirmationValid ? "valid" : ""}`}
              disabled={isDeleting}
            />
            {confirmationInput && !isConfirmationValid && (
              <div className="validation-error">
                ❌ Input doesn't match. Please type "{expectedInput}" exactly.
              </div>
            )}
            {isConfirmationValid && (
              <div className="validation-success">
                ✅ Confirmation text matches.
              </div>
            )}
          </div>
        </div>

        <div className="deletion-modal-footer">
          <button
            className="btn btn-secondary cancel-btn"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel & Keep Account
          </button>
          <button
            className="btn btn-danger delete-btn"
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="btn-spinner"></span>
                Deleting...
              </>
            ) : (
              <>🗑️ Permanently Delete</>
            )}
          </button>
        </div>

        <div className="final-warning">
          <strong>⚠️ Remember:</strong> This action cannot be undone. The
          account and all associated data will be permanently lost.
        </div>
      </div>
    </div>
  );
};

export default UserDeletionModal;
