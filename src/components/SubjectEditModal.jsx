import React, { useState } from "react";

const SubjectEditModal = ({
  isOpen,
  onClose,
  subject,
  onSave,
  onDelete,
  onSuspend,
}) => {
  const [editData, setEditData] = useState({
    name: subject?.name || "",
    description: subject?.description || "",
    status: subject?.status || "active",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(subject.id, editData);
    onClose();
  };

  const handleDelete = () => {
    onDelete(subject.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleSuspend = () => {
    const newStatus = subject.status === "active" ? "suspended" : "active";
    onSuspend(subject.id, newStatus);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content subject-edit-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Edit Subject: {subject?.name}</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Subject Name</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
              placeholder="Enter subject name"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={editData.description}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
              placeholder="Enter subject description"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={editData.status}
              onChange={(e) =>
                setEditData({ ...editData, status: e.target.value })
              }
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="current-teacher-info">
            <h4>Current Teacher Assignment</h4>
            {subject?.teacher ? (
              <div className="teacher-assigned">
                <span className="teacher-name">
                  {subject.teacher.full_name}
                </span>
                <span className="teacher-email">({subject.teacher.email})</span>
              </div>
            ) : (
              <span className="no-teacher">No teacher assigned</span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div className="action-buttons">
            <button
              className="btn btn-success"
              onClick={handleSave}
              disabled={!editData.name.trim()}
            >
              💾 Save Changes
            </button>

            <button
              className={`btn ${
                subject?.status === "active" ? "btn-warning" : "btn-info"
              }`}
              onClick={handleSuspend}
            >
              {subject?.status === "active" ? "⏸️ Suspend" : "▶️ Activate"}
            </button>

            <button
              className="btn btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              🗑️ Delete
            </button>

            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-modal">
              <h3>⚠️ Confirm Deletion</h3>
              <p>
                Are you sure you want to permanently delete{" "}
                <strong>"{subject?.name}"</strong>?
              </p>
              <p style={{ color: "#ef4444", fontSize: "0.9rem" }}>
                This will also remove all assignments, submissions, and
                enrollments for this subject. This action cannot be undone.
              </p>
              <div className="delete-confirm-buttons">
                <button className="btn btn-danger" onClick={handleDelete}>
                  Yes, Delete
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectEditModal;
