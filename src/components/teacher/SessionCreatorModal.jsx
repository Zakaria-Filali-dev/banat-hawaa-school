import React from "react";

const SessionCreatorModal = ({
  showModal,
  onClose,
  newSession,
  setNewSession,
  subjects,
  onCreateSession,
}) => {
  if (!showModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create New Class Session</h3>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreateSession();
          }}
          className="session-form"
        >
          <div className="form-group">
            <label htmlFor="session-title">Session Title:</label>
            <input
              type="text"
              id="session-title"
              value={newSession.title}
              onChange={(e) =>
                setNewSession({ ...newSession, title: e.target.value })
              }
              placeholder="Enter session title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="session-description">Description:</label>
            <textarea
              id="session-description"
              value={newSession.description}
              onChange={(e) =>
                setNewSession({ ...newSession, description: e.target.value })
              }
              placeholder="Enter session description"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="session-subject">Subject:</label>
            <select
              id="session-subject"
              value={newSession.subject_id}
              onChange={(e) =>
                setNewSession({ ...newSession, subject_id: e.target.value })
              }
              required
            >
              <option value="">Select a subject</option>
              {subjects?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="session-date">Date:</label>
              <input
                type="date"
                id="session-date"
                value={newSession.session_date}
                onChange={(e) =>
                  setNewSession({ ...newSession, session_date: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="session-location">Location:</label>
              <input
                type="text"
                id="session-location"
                value={newSession.location}
                onChange={(e) =>
                  setNewSession({ ...newSession, location: e.target.value })
                }
                placeholder="Room or location"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start-time">Start Time:</label>
              <input
                type="time"
                id="start-time"
                value={newSession.start_time}
                onChange={(e) =>
                  setNewSession({ ...newSession, start_time: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="end-time">End Time:</label>
              <input
                type="time"
                id="end-time"
                value={newSession.end_time}
                onChange={(e) =>
                  setNewSession({ ...newSession, end_time: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="session-type">Session Type:</label>
            <select
              id="session-type"
              value={newSession.session_type}
              onChange={(e) =>
                setNewSession({ ...newSession, session_type: e.target.value })
              }
            >
              <option value="regular">Regular Class</option>
              <option value="makeup">Makeup Class</option>
              <option value="review">Review Session</option>
              <option value="exam">Exam</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionCreatorModal;
