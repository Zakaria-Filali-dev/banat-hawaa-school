import React, { useState } from "react";

const MultipleTeacherAssignModal = ({
  isOpen,
  onClose,
  subject,
  teachers = [],
  currentTeacherIds = [],
  onSave,
}) => {
  const [selectedTeachers, setSelectedTeachers] = useState(currentTeacherIds);

  if (!isOpen) return null;

  const handleTeacherToggle = (teacherId) => {
    setSelectedTeachers((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const handleSave = () => {
    onSave(subject.id, selectedTeachers);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content teacher-assign-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Assign Teachers to {subject?.name}</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Select multiple teachers to assign to this subject. Students will be
            able to interact with any of the assigned teachers for this subject.
          </p>

          <div className="teachers-selection-grid">
            {teachers.map((teacher) => {
              const isSelected = selectedTeachers.includes(teacher.id);
              const isActive = teacher.status === "active";

              return (
                <label
                  key={teacher.id}
                  className={`teacher-selection-item ${
                    !isActive ? "disabled" : ""
                  }`}
                  title={!isActive ? "This teacher is not active" : ""}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!isActive}
                    onChange={() => handleTeacherToggle(teacher.id)}
                  />
                  <div className="teacher-info">
                    <span className="teacher-name">{teacher.full_name}</span>
                    <span className="teacher-email">{teacher.email}</span>
                    {!isActive && (
                      <span className="teacher-status inactive">Inactive</span>
                    )}
                    {teacher.phone && (
                      <span className="teacher-phone">{teacher.phone}</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {teachers.length === 0 && (
            <div className="no-teachers-message">
              <p>No teachers available. Create teacher accounts first.</p>
            </div>
          )}

          <div className="selection-summary">
            <p>
              <strong>Selected Teachers:</strong> {selectedTeachers.length} of{" "}
              {teachers.filter((t) => t.status === "active").length} active
              teachers
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Teacher Assignments
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultipleTeacherAssignModal;
