import React, { useState } from "react";
import SubmissionFilesViewer from "../SubmissionFilesViewer";

const GradingModal = ({ selectedSubmission, onClose, onGrade }) => {
  const [score, setScore] = useState(selectedSubmission?.score || "");
  const [feedback, setFeedback] = useState(selectedSubmission?.feedback || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!score || score < 0 || score > 100) {
      alert("Please enter a valid score (0-100)");
      return;
    }
    onGrade(selectedSubmission.id, score, feedback);
  };

  if (!selectedSubmission) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{ maxWidth: "800px", maxHeight: "90vh", overflow: "auto" }}
      >
        <div className="modal-header">
          <h3>Grade Submission - {selectedSubmission.assignments?.title}</h3>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <div className="submission-details">
          <p>
            <strong>Student:</strong> {selectedSubmission.student?.full_name}
          </p>
          <p>
            <strong>Submitted:</strong>{" "}
            {new Date(selectedSubmission.submitted_at).toLocaleString()}
          </p>
          <p>
            <strong>Text Response:</strong>
          </p>
          <div className="submission-text">
            {selectedSubmission.submission_text || "No text response provided"}
          </div>
        </div>

        {selectedSubmission.submission_files?.length > 0 && (
          <div className="submission-files">
            <h4>Submitted Files:</h4>
            <SubmissionFilesViewer
              files={selectedSubmission.submission_files}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="grading-form">
          <div className="form-group">
            <label htmlFor="score">Score (0-100):</label>
            <input
              type="number"
              id="score"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Enter score"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="feedback">Feedback:</label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide feedback to the student..."
              rows="4"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Grade Submission
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradingModal;
