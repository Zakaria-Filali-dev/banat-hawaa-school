import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import FileUpload from "../../components/FileUpload";
import FilePreview from "../../components/FilePreview";
import "./students.css";

export default function Students() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState("assignments");
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [submissionText, setSubmissionText] = useState("");
  const [fileCaptions, setFileCaptions] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData?.user) {
          navigate("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("email", userData.user.email)
          .single();

        if (profileError || profile?.role !== "student") {
          navigate("/login");
          return;
        }

        setUser(userData.user);
        await fetchStudentData(userData.user.id);
      } catch {
        setError("Unexpected error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchStudentData = async (userId) => {
    try {
      // Get student's enrolled subjects
      const { data: enrolledSubjects } = await supabase
        .from("student_subjects")
        .select("subject_id")
        .eq("student_id", userId)
        .eq("status", "active");

      const subjectIds = enrolledSubjects?.map((s) => s.subject_id) || [];

      if (subjectIds.length === 0) {
        setAssignments([]);
        setAnnouncements([]);
        setSubmissions([]);
        setSchedule([]);
        return;
      }

      // Fetch assignments for enrolled subjects
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(
          `
          *,
          subjects(name),
          teacher:profiles!assignments_teacher_id_fkey(full_name),
          assignment_attachments(*)
        `
        )
        .in("subject_id", subjectIds)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from("announcements")
        .select(
          `
          *,
          author:profiles!announcements_author_id_fkey(full_name),
          subjects(name)
        `
        )
        .or(
          `target_audience.in.(all,students),and(target_audience.eq.subject_students,subject_id.in.(${subjectIds.join(
            ","
          )}))`
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      // Fetch student's submissions
      const { data: submissionsData } = await supabase
        .from("assignment_submissions")
        .select(
          `
          *,
          assignments(title, subjects(name)),
          submission_files(*)
        `
        )
        .eq("student_id", userId);

      // Fetch class schedule
      const { data: scheduleData } = await supabase
        .from("class_sessions")
        .select(
          `
          *,
          subjects(name),
          teacher:profiles!class_sessions_teacher_id_fkey(full_name)
        `
        )
        .in("subject_id", subjectIds)
        .gte("session_date", new Date().toISOString().split("T")[0])
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true });

      setAssignments(assignmentsData || []);
      setAnnouncements(announcementsData || []);
      setSubmissions(submissionsData || []);
      setSchedule(scheduleData || []);
    } catch (error) {
      console.error("Error fetching student data:", error);
      setError("Failed to load dashboard data");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSubmissionStatus = (assignmentId) => {
    return submissions.find((sub) => sub.assignment_id === assignmentId);
  };

  const handleFileUpload = (files) => {
    setSubmissionFiles((prev) => [...prev, ...files]);
  };

  const handleFileRemove = (fileToRemove) => {
    setSubmissionFiles((prev) => prev.filter((file) => file !== fileToRemove));
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

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      const submissionData = {
        assignment_id: selectedAssignment.id,
        student_id: user.id,
        submission_text: submissionText || null,
        is_late: getDaysUntilDue(selectedAssignment.due_date) < 0,
      };

      const { data: newSubmission, error: submissionError } = await supabase
        .from("assignment_submissions")
        .insert(submissionData)
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Upload submission files
      if (submissionFiles.length > 0) {
        const files = submissionFiles.map((file) => ({
          submission_id: newSubmission.id,
          file_name: file.name,
          file_url: file.url,
          file_type: file.type,
          file_size: file.size,
          caption: fileCaptions[file.name] || null,
        }));

        const { error: filesError } = await supabase
          .from("submission_files")
          .insert(files);

        if (filesError) throw filesError;
      }

      // Reset form
      setSelectedAssignment(null);
      setSubmissionFiles([]);
      setSubmissionText("");
      setFileCaptions({});

      // Refresh submissions
      await fetchStudentData(user.id);
    } catch (error) {
      setError("Failed to submit assignment: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <div className="loading">Loading student dashboard...</div>;
  if (error) return <div className="message message-error">{error}</div>;

  return (
    <div className="page-wrapper">
      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal-content">
            <h2>Confirm Logout</h2>
            <p>Are you sure you want to logout?</p>
            <div className="logout-modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="header">
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1>Student Dashboard</h1>
            <button
              className="btn btn-secondary"
              onClick={() => setShowLogoutModal(true)}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="dashboard-tabs" style={{ marginBottom: "2rem" }}>
          <button
            className={
              activeTab === "assignments"
                ? "btn btn-primary"
                : "btn btn-secondary"
            }
            onClick={() => setActiveTab("assignments")}
            style={{ marginRight: "1rem" }}
          >
            📝 Assignments ({assignments.length})
          </button>
          <button
            className={
              activeTab === "announcements"
                ? "btn btn-primary"
                : "btn btn-secondary"
            }
            onClick={() => setActiveTab("announcements")}
            style={{ marginRight: "1rem" }}
          >
            📢 Announcements ({announcements.length})
          </button>
          <button
            className={
              activeTab === "schedule" ? "btn btn-primary" : "btn btn-secondary"
            }
            onClick={() => setActiveTab("schedule")}
          >
            📅 Schedule ({schedule.length})
          </button>
        </div>

        {/* Assignments Tab */}
        {activeTab === "assignments" && (
          <div className="tab-content">
            {selectedAssignment ? (
              <div className="assignment-submission">
                <div className="card">
                  <div
                    className="card-header"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h3>Submit Assignment: {selectedAssignment.title}</h3>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedAssignment(null)}
                    >
                      ← Back to Assignments
                    </button>
                  </div>

                  <div
                    className="assignment-details"
                    style={{ marginBottom: "1.5rem" }}
                  >
                    <p style={{ color: "white" }}>
                      <strong>Subject:</strong>{" "}
                      {selectedAssignment.subjects?.name}
                    </p>
                    <p style={{ color: "white" }}>
                      <strong>Description:</strong>{" "}
                      {selectedAssignment.description}
                    </p>
                    {selectedAssignment.instructions && (
                      <div style={{ color: "white" }}>
                        <strong>Instructions:</strong>
                        <div
                          style={{
                            whiteSpace: "pre-wrap",
                            marginTop: "8px",
                            padding: "1rem",
                            background: "rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                          }}
                        >
                          {selectedAssignment.instructions}
                        </div>
                      </div>
                    )}
                    {selectedAssignment.due_date && (
                      <p style={{ color: "white" }}>
                        <strong>Due:</strong>{" "}
                        {formatDate(selectedAssignment.due_date)}
                      </p>
                    )}
                  </div>

                  {selectedAssignment.assignment_attachments?.length > 0 && (
                    <div
                      className="assignment-materials"
                      style={{ marginBottom: "1.5rem" }}
                    >
                      <h4 style={{ color: "white" }}>Assignment Materials</h4>
                      <div className="files-grid">
                        {selectedAssignment.assignment_attachments.map(
                          (attachment) => (
                            <FilePreview
                              key={attachment.id}
                              file={{
                                name: attachment.file_name,
                                url: attachment.file_url,
                                type: attachment.file_type,
                                size: attachment.file_size,
                              }}
                              caption={attachment.caption}
                              showCaption={true}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className="submission-form">
                    <div className="form-group">
                      <label
                        htmlFor="submission-text"
                        style={{
                          color: "white",
                          marginBottom: "8px",
                          display: "block",
                        }}
                      >
                        Written Response (optional)
                      </label>
                      <textarea
                        id="submission-text"
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        className="form-input"
                        rows="6"
                        placeholder="Enter your written response here..."
                      />
                    </div>

                    <div className="assignment-files">
                      <h4 style={{ color: "white" }}>Upload Files</h4>
                      <FileUpload
                        onFileUpload={handleFileUpload}
                        bucket="submissions"
                        folder={`assignment-${selectedAssignment.id}/student-${user.id}`}
                        label="Upload Submission Files"
                        maxFiles={3}
                      />

                      {submissionFiles.length > 0 && (
                        <div className="files-grid">
                          {submissionFiles.map((file, index) => (
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
                        className="btn btn-primary"
                        onClick={handleSubmitAssignment}
                        disabled={
                          submitting ||
                          (!submissionText.trim() &&
                            submissionFiles.length === 0)
                        }
                      >
                        {submitting ? "Submitting..." : "Submit Assignment"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="assignments-list">
                {assignments.length === 0 ? (
                  <div className="message message-info">
                    No assignments available. Make sure you're enrolled in
                    subjects to see assignments.
                  </div>
                ) : (
                  assignments.map((assignment) => {
                    const submission = getSubmissionStatus(assignment.id);
                    const daysUntilDue = getDaysUntilDue(assignment.due_date);

                    return (
                      <div key={assignment.id} className="assignment-card card">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "1rem",
                          }}
                        >
                          <div className="assignment-info">
                            <h3
                              style={{ color: "white", marginBottom: "0.5rem" }}
                            >
                              {assignment.title}
                            </h3>
                            <p
                              style={{
                                color: "rgba(255,255,255,0.8)",
                                margin: "0.25rem 0",
                              }}
                            >
                              <strong>Subject:</strong>{" "}
                              {assignment.subjects?.name}
                            </p>
                            <p
                              style={{
                                color: "rgba(255,255,255,0.8)",
                                margin: "0.25rem 0",
                              }}
                            >
                              <strong>Teacher:</strong>{" "}
                              {assignment.teacher?.full_name}
                            </p>
                            {assignment.due_date && (
                              <p
                                style={{
                                  color:
                                    daysUntilDue < 1
                                      ? "#fc8181"
                                      : daysUntilDue < 3
                                      ? "#fbb040"
                                      : "rgba(255,255,255,0.8)",
                                  margin: "0.25rem 0",
                                }}
                              >
                                <strong>Due:</strong>{" "}
                                {formatDate(assignment.due_date)}
                                {daysUntilDue !== null && (
                                  <span className="days-remaining">
                                    {daysUntilDue < 0
                                      ? ` (${Math.abs(
                                          daysUntilDue
                                        )} days overdue)`
                                      : daysUntilDue === 0
                                      ? " (Due today!)"
                                      : ` (${daysUntilDue} days remaining)`}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          <div className="assignment-status">
                            {submission ? (
                              <span
                                style={{
                                  padding: "0.5rem 1rem",
                                  borderRadius: "20px",
                                  background: "rgba(56, 161, 105, 0.2)",
                                  color: "#68d391",
                                  border: "1px solid rgba(56, 161, 105, 0.3)",
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                }}
                              >
                                ✅{" "}
                                {submission.status === "graded"
                                  ? "Graded"
                                  : "Submitted"}
                                {submission.score !== null &&
                                  ` (${submission.score}/${assignment.max_score})`}
                              </span>
                            ) : (
                              <span
                                style={{
                                  padding: "0.5rem 1rem",
                                  borderRadius: "20px",
                                  background: "rgba(237, 137, 54, 0.2)",
                                  color: "#fbb040",
                                  border: "1px solid rgba(237, 137, 54, 0.3)",
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                }}
                              >
                                📝 Not Submitted
                              </span>
                            )}
                          </div>
                        </div>

                        <p
                          style={{
                            color: "rgba(255,255,255,0.9)",
                            marginBottom: "1rem",
                          }}
                        >
                          {assignment.description}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            {assignment.assignment_attachments?.length > 0 && (
                              <span
                                style={{
                                  color: "rgba(255,255,255,0.7)",
                                  fontSize: "0.875rem",
                                }}
                              >
                                📎 {assignment.assignment_attachments.length}{" "}
                                file(s)
                              </span>
                            )}
                          </div>
                          <div>
                            {!submission && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() =>
                                  setSelectedAssignment(assignment)
                                }
                              >
                                Submit Assignment
                              </button>
                            )}
                            {submission && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() =>
                                  setSelectedAssignment(assignment)
                                }
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === "announcements" && (
          <div className="tab-content">
            {announcements.length === 0 ? (
              <div className="message message-info">
                No announcements available
              </div>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="announcement-card card">
                  <div className="announcement-header">
                    <h3 style={{ color: "white", marginBottom: "0.5rem" }}>
                      {announcement.title}
                    </h3>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: "0.875rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <span>By {announcement.author?.full_name}</span>
                      <span style={{ margin: "0 0.5rem" }}>•</span>
                      <span>{formatDate(announcement.created_at)}</span>
                      {announcement.subjects && (
                        <>
                          <span style={{ margin: "0 0.5rem" }}>•</span>
                          <span>Subject: {announcement.subjects.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {announcement.content}
                  </div>
                  {announcement.priority !== "normal" && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "0.5rem 1rem",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        background:
                          announcement.priority === "urgent"
                            ? "rgba(245, 101, 101, 0.2)"
                            : "rgba(237, 137, 54, 0.2)",
                        color:
                          announcement.priority === "urgent"
                            ? "#fc8181"
                            : "#fbb040",
                        border: `1px solid ${
                          announcement.priority === "urgent"
                            ? "rgba(245, 101, 101, 0.3)"
                            : "rgba(237, 137, 54, 0.3)"
                        }`,
                        display: "inline-block",
                      }}
                    >
                      {announcement.priority}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <div className="tab-content">
            {schedule.length === 0 ? (
              <div className="message message-info">
                No upcoming classes scheduled
              </div>
            ) : (
              schedule.map((session) => (
                <div key={session.id} className="schedule-card card">
                  <div className="schedule-header">
                    <h3 style={{ color: "white", marginBottom: "0.5rem" }}>
                      {session.title}
                    </h3>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        marginBottom: "1rem",
                      }}
                    >
                      {new Date(session.session_date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}{" "}
                      • {session.start_time} - {session.end_time}
                    </div>
                  </div>
                  <div className="schedule-details">
                    <p
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        margin: "0.5rem 0",
                      }}
                    >
                      <strong>Subject:</strong> {session.subjects?.name}
                    </p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        margin: "0.5rem 0",
                      }}
                    >
                      <strong>Teacher:</strong> {session.teacher?.full_name}
                    </p>
                    {session.location && (
                      <p
                        style={{
                          color: "rgba(255,255,255,0.9)",
                          margin: "0.5rem 0",
                        }}
                      >
                        <strong>Location:</strong> {session.location}
                      </p>
                    )}
                    {session.description && (
                      <p
                        style={{
                          color: "rgba(255,255,255,0.8)",
                          margin: "1rem 0",
                        }}
                      >
                        {session.description}
                      </p>
                    )}
                  </div>
                  {session.is_cancelled && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        background: "rgba(245, 101, 101, 0.15)",
                        border: "1px solid rgba(245, 101, 101, 0.3)",
                        borderRadius: "8px",
                        color: "#fed7d7",
                      }}
                    >
                      ❌ This class has been cancelled
                      {session.cancellation_reason && (
                        <p style={{ margin: "0.5rem 0 0 0" }}>
                          Reason: {session.cancellation_reason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
