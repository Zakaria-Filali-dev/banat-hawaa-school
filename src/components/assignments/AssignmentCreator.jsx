import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import FileUpload from "../FileUpload";
import FilePreview from "../FilePreview";

const AssignmentCreator = ({
  editingAssignment,
  onAssignmentCreated,
  onCancel,
}) => {
  const [assignment, setAssignment] = useState({
    title: "",
    description: "",
    instructions: "",
    subject_id: "",
    due_date: "",
    max_score: 100,
    submission_format: "any",
    allow_late_submission: false,
    is_published: false,
  });

  const [subjects, setSubjects] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileCaptions, setFileCaptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [hoverStates, setHoverStates] = useState({
    allow_late_submission: false,
    is_published: false,
  });

  useEffect(() => {
    fetchUserAndSubjects();
  }, []);

  useEffect(() => {
    if (editingAssignment) {
      setAssignment({
        title: editingAssignment.title || "",
        description: editingAssignment.description || "",
        instructions: editingAssignment.instructions || "",
        subject_id: editingAssignment.subject_id || "",
        due_date: editingAssignment.due_date
          ? editingAssignment.due_date.split("T")[0]
          : "",
        max_score: editingAssignment.max_score || 100,
        submission_format: editingAssignment.submission_format || "any",
        allow_late_submission: editingAssignment.allow_late_submission || false,
        is_published: editingAssignment.is_published || false,
      });

      // Fetch existing attachments
      if (editingAssignment.assignment_attachments) {
        const files = editingAssignment.assignment_attachments.map(
          (attachment) => ({
            name: attachment.file_name,
            url: attachment.file_url,
            type: attachment.file_type,
            size: attachment.file_size || 0,
            path: attachment.file_url,
          })
        );
        setUploadedFiles(files);

        // Set captions
        const captions = {};
        editingAssignment.assignment_attachments.forEach((attachment) => {
          if (attachment.caption) {
            captions[attachment.file_name] = attachment.caption;
          }
        });
        setFileCaptions(captions);
      }
    }
  }, [editingAssignment]);

  const fetchUserAndSubjects = async () => {
    try {
      // Get current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");
      setUser(currentUser);

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      // Fetch subjects based on user role
      let subjectsQuery = supabase.from("subjects").select("*");

      if (profile?.role === "teacher") {
        // Teachers can only create assignments for their subjects
        subjectsQuery = subjectsQuery.eq("teacher_id", currentUser.id);
      }

      const { data: subjectsData, error: subjectsError } = await subjectsQuery;
      if (subjectsError) throw subjectsError;

      setSubjects(subjectsData || []);
    } catch (error) {
      setError("Failed to load subjects: " + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAssignment((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileUpload = (files) => {
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleFileRemove = (fileToRemove) => {
    setUploadedFiles((prev) => prev.filter((file) => file !== fileToRemove));
    setFileCaptions((prev) => {
      const newCaptions = { ...prev };
      delete newCaptions[fileToRemove.name];
      return newCaptions;
    });
  };

  const handleCaptionChange = (file, caption) => {
    setFileCaptions((prev) => ({
      ...prev,
      [file.name]: caption,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      if (
        !assignment.title ||
        !assignment.description ||
        !assignment.subject_id
      ) {
        throw new Error("Please fill in all required fields");
      }

      const assignmentData = {
        ...assignment,
        teacher_id: user.id,
        due_date: assignment.due_date || null,
        max_score: parseInt(assignment.max_score),
      };

      let resultAssignment;

      if (editingAssignment) {
        // Update existing assignment
        const { data: updatedAssignment, error: assignmentError } =
          await supabase
            .from("assignments")
            .update(assignmentData)
            .eq("id", editingAssignment.id)
            .select()
            .single();

        if (assignmentError) throw assignmentError;
        resultAssignment = updatedAssignment;

        // Delete existing attachments
        await supabase
          .from("assignment_attachments")
          .delete()
          .eq("assignment_id", editingAssignment.id);
      } else {
        // Create new assignment
        const { data: createdAssignment, error: assignmentError } =
          await supabase
            .from("assignments")
            .insert(assignmentData)
            .select()
            .single();

        if (assignmentError) throw assignmentError;
        resultAssignment = createdAssignment;
      }

      // Upload assignment attachments
      if (uploadedFiles.length > 0) {
        const attachments = uploadedFiles.map((file) => ({
          assignment_id: resultAssignment.id,
          file_name: file.name,
          file_url: file.url,
          file_type: file.type,
          file_size: file.size,
          caption: fileCaptions[file.name] || null,
          uploaded_by: user.id,
        }));

        const { error: attachmentError } = await supabase
          .from("assignment_attachments")
          .insert(attachments);

        if (attachmentError) throw attachmentError;
      }

      // Create notifications for students (only for new published assignments)
      if (assignment.is_published && !editingAssignment) {
        const { data: enrolledStudents } = await supabase
          .from("student_subjects")
          .select("student_id")
          .eq("subject_id", assignment.subject_id)
          .eq("status", "active");

        if (enrolledStudents && enrolledStudents.length > 0) {
          const notifications = enrolledStudents.map((enrollment) => ({
            recipient_id: enrollment.student_id,
            title: "New Assignment",
            message: `New assignment "${assignment.title}" has been posted`,
            type: "assignment",
            related_id: resultAssignment.id,
          }));

          await supabase.from("notifications").insert(notifications);
        }
      }

      onAssignmentCreated(resultAssignment);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assignment-creator">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {editingAssignment ? "Edit Assignment" : "Create New Assignment"}
          </h3>
        </div>

        {error && <div className="message message-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label
              htmlFor="title"
              style={{ color: "white", marginBottom: "8px", display: "block" }}
            >
              Assignment Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={assignment.title}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter assignment title"
              required
            />
          </div>

          <div className="form-group">
            <label
              htmlFor="subject_id"
              style={{ color: "white", marginBottom: "8px", display: "block" }}
            >
              Subject *
            </label>
            <select
              id="subject_id"
              name="subject_id"
              value={assignment.subject_id}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label
              htmlFor="description"
              style={{ color: "white", marginBottom: "8px", display: "block" }}
            >
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={assignment.description}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Describe the assignment"
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label
              htmlFor="instructions"
              style={{ color: "white", marginBottom: "8px", display: "block" }}
            >
              Instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={assignment.instructions}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Detailed instructions for students"
              rows="6"
            />
          </div>

          <div className="form-group">
            <label
              htmlFor="due_date"
              style={{ color: "white", marginBottom: "8px", display: "block" }}
            >
              Due Date
            </label>
            <input
              type="datetime-local"
              id="due_date"
              name="due_date"
              value={assignment.due_date}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label
              htmlFor="max_score"
              style={{ color: "white", marginBottom: "8px", display: "block" }}
            >
              Maximum Score
            </label>
            <input
              type="number"
              id="max_score"
              name="max_score"
              value={assignment.max_score}
              onChange={handleInputChange}
              className="form-input"
              min="1"
              max="1000"
            />
          </div>

          <div className="form-group">
            <label
              htmlFor="submission_format"
              style={{ color: "white", marginBottom: "8px", display: "block" }}
            >
              Submission Format
            </label>
            <select
              id="submission_format"
              name="submission_format"
              value={assignment.submission_format}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="any">Any format</option>
              <option value="document">Document only</option>
              <option value="image">Image only</option>
              <option value="text">Text only</option>
            </select>
          </div>

          {/* Enhanced Checkboxes Section */}
          <div className="form-group">
            <label
              style={{
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                userSelect: "none",
                padding: "8px",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                backgroundColor: hoverStates.allow_late_submission
                  ? "rgba(255, 255, 255, 0.05)"
                  : "transparent",
              }}
              onMouseEnter={() =>
                setHoverStates((prev) => ({
                  ...prev,
                  allow_late_submission: true,
                }))
              }
              onMouseLeave={() =>
                setHoverStates((prev) => ({
                  ...prev,
                  allow_late_submission: false,
                }))
              }
            >
              <div style={{ position: "relative" }}>
                <input
                  type="checkbox"
                  name="allow_late_submission"
                  checked={assignment.allow_late_submission}
                  onChange={handleInputChange}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    cursor: "pointer",
                    height: 0,
                    width: 0,
                  }}
                />
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: assignment.allow_late_submission
                      ? "#667eea"
                      : hoverStates.allow_late_submission
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(255, 255, 255, 0.08)",
                    border: assignment.allow_late_submission
                      ? "2px solid #667eea"
                      : hoverStates.allow_late_submission
                      ? "2px solid rgba(255, 255, 255, 0.5)"
                      : "2px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    backdropFilter: "blur(10px)",
                    boxShadow: assignment.allow_late_submission
                      ? "0 0 16px rgba(102, 126, 234, 0.5), 0 4px 12px rgba(0, 0, 0, 0.2)"
                      : hoverStates.allow_late_submission
                      ? "0 0 8px rgba(255, 255, 255, 0.2)"
                      : "none",
                    transform: hoverStates.allow_late_submission
                      ? "scale(1.05)"
                      : "scale(1)",
                  }}
                >
                  {assignment.allow_late_submission && (
                    <svg
                      width="12"
                      height="9"
                      viewBox="0 0 12 9"
                      fill="none"
                      style={{
                        transition: "all 0.2s ease",
                        opacity: assignment.allow_late_submission ? 1 : 0,
                        transform: assignment.allow_late_submission
                          ? "scale(1)"
                          : "scale(0.5)",
                      }}
                    >
                      <path
                        d="M1 4.5L4 7.5L11 1"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
              Allow late submissions
            </label>
          </div>

          <div className="form-group">
            <label
              style={{
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                userSelect: "none",
                padding: "8px",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                backgroundColor: hoverStates.is_published
                  ? "rgba(255, 255, 255, 0.05)"
                  : "transparent",
              }}
              onMouseEnter={() =>
                setHoverStates((prev) => ({ ...prev, is_published: true }))
              }
              onMouseLeave={() =>
                setHoverStates((prev) => ({ ...prev, is_published: false }))
              }
            >
              <div style={{ position: "relative" }}>
                <input
                  type="checkbox"
                  name="is_published"
                  checked={assignment.is_published}
                  onChange={handleInputChange}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    cursor: "pointer",
                    height: 0,
                    width: 0,
                  }}
                />
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: assignment.is_published
                      ? "#667eea"
                      : hoverStates.is_published
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(255, 255, 255, 0.08)",
                    border: assignment.is_published
                      ? "2px solid #667eea"
                      : hoverStates.is_published
                      ? "2px solid rgba(255, 255, 255, 0.5)"
                      : "2px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    backdropFilter: "blur(10px)",
                    boxShadow: assignment.is_published
                      ? "0 0 16px rgba(102, 126, 234, 0.5), 0 4px 12px rgba(0, 0, 0, 0.2)"
                      : hoverStates.is_published
                      ? "0 0 8px rgba(255, 255, 255, 0.2)"
                      : "none",
                    transform: hoverStates.is_published
                      ? "scale(1.05)"
                      : "scale(1)",
                  }}
                >
                  {assignment.is_published && (
                    <svg
                      width="12"
                      height="9"
                      viewBox="0 0 12 9"
                      fill="none"
                      style={{
                        transition: "all 0.2s ease",
                        opacity: assignment.is_published ? 1 : 0,
                        transform: assignment.is_published
                          ? "scale(1)"
                          : "scale(0.5)",
                      }}
                    >
                      <path
                        d="M1 4.5L4 7.5L11 1"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
              Publish immediately (students will be notified)
            </label>
          </div>

          {/* File Upload Section */}
          <div className="assignment-files">
            <h4>Assignment Materials</h4>
            <FileUpload
              onFileUpload={handleFileUpload}
              bucket="assignments"
              folder={`assignment-${Date.now()}`}
              label="Upload Assignment Files"
              maxFiles={5}
            />

            {uploadedFiles.length > 0 && (
              <div className="files-grid">
                {uploadedFiles.map((file, index) => (
                  <FilePreview
                    key={index}
                    file={file}
                    onRemove={handleFileRemove}
                    showCaption={true}
                    caption={fileCaptions[file.name] || ""}
                    onCaptionChange={handleCaptionChange}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Assignment"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentCreator;
