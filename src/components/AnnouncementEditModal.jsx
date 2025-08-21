import React, { useState } from "react";

const AnnouncementEditModal = ({
  isOpen,
  onClose,
  announcement,
  onSave,
  onDelete,
}) => {
  const [editData, setEditData] = useState({
    title: announcement?.title || "",
    content: announcement?.content || "",
    target_audience: announcement?.target_audience || "all",
    priority: announcement?.priority || "normal",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(announcement.id, editData);
    onClose();
  };

  const handleDelete = () => {
    onDelete(announcement.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content announcement-edit-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Edit Announcement</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) =>
                setEditData({ ...editData, title: e.target.value })
              }
              placeholder="Announcement title"
            />
          </div>

          <div className="form-group">
            <label>Content</label>
            <textarea
              value={editData.content}
              onChange={(e) =>
                setEditData({ ...editData, content: e.target.value })
              }
              placeholder="Announcement content"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Target Audience</label>
              <select
                value={editData.target_audience}
                onChange={(e) =>
                  setEditData({ ...editData, target_audience: e.target.value })
                }
              >
                <option value="all">All Users</option>
                <option value="students">Students Only</option>
                <option value="teachers">Teachers Only</option>
                <option value="parents">Parents Only</option>
              </select>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                value={editData.priority}
                onChange={(e) =>
                  setEditData({ ...editData, priority: e.target.value })
                }
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="action-buttons">
            <button
              className="btn btn-success"
              onClick={handleSave}
              disabled={!editData.title.trim() || !editData.content.trim()}
            >
              💾 Save Changes
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
                Are you sure you want to permanently delete this announcement?
              </p>
              <p style={{ color: "#ef4444", fontSize: "0.9rem" }}>
                This action cannot be undone.
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

export default AnnouncementEditModal;
