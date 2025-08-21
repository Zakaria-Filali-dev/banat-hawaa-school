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
        const { data: userData, error: userError } = await supabase.auth.getUser();
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
      // Fetch assignments for enrolled subjects
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select(`
          *,
          subjects(name),
          teacher:profiles!assignments_teacher_id_fkey(full_name),
          assignment_attachments(*)
        `)
        .in('subject_id', 
          await supabase
            .from('student_subjects')
            .select('subject_id')
            .eq('student_id', userId)
            .eq('status', 'active')
            .then(res => res.data?.map(s => s.subject_id) || [])
        )
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select(`
          *,
          author:profiles!announcements_author_id_fkey(full_name),
          subjects(name)
        `)
        .in('target_audience', ['all', 'students'])
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      // Fetch student's submissions
      const { data: submissionsData } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignments(title, subjects(name)),
          submission_files(*)
        `)
        .eq('student_id', userId);

      // Fetch class schedule
      const { data: scheduleData } = await supabase
        .from('class_sessions')
        .select(`
          *,
          subjects(name),
          teacher:profiles!class_sessions_teacher_id_fkey(full_name),
          class_attendance!inner(status)
        `)
        .in('subject_id',
          await supabase
            .from('student_subjects')
            .select('subject_id')
            .eq('student_id', userId)
            .eq('status', 'active')
            .then(res => res.data?.map(s => s.subject_id) || [])
        )
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true });

      setAssignments(assignmentsData || []);
      setAnnouncements(announcementsData || []);
      setSubmissions(submissionsData || []);
      setSchedule(scheduleData || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setError('Failed to load dashboard data');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    return submissions.find(sub => sub.assignment_id === assignmentId);
  };

  const handleFileUpload = (files) => {
    setSubmissionFiles(prev => [...prev, ...files]);
  };

  const handleFileRemove = (fileToRemove) => {
    setSubmissionFiles(prev => prev.filter(file => file !== fileToRemove));
    setFileCaptions(prev => {
      const newCaptions = { ...prev };
      delete newCaptions[fileToRemove.name];
      return newCaptions;
    });
  };

  const handleCaptionChange = (file, caption) => {
    setFileCaptions(prev => ({
      ...prev,
      [file.name]: caption
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
        is_late: getDaysUntilDue(selectedAssignment.due_date) < 0
      };

      const { data: newSubmission, error: submissionError } = await supabase
        .from('assignment_submissions')
        .insert(submissionData)
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Upload submission files
      if (submissionFiles.length > 0) {
        const files = submissionFiles.map(file => ({
          submission_id: newSubmission.id,
          file_name: file.name,
          file_url: file.url,
          file_type: file.type,
          file_size: file.size,
          caption: fileCaptions[file.name] || null
        }));

        const { error: filesError } = await supabase
          .from('submission_files')
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
      setError('Failed to submit assignment: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading student dashboard...</div>;
  if (error) return <div className="message message-error">{error}</div>;

  return (
    <div className="page-wrapper">
      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal-content">
            <h2>Confirm Logout</h2>
            <p>Are you sure you want to logout?</p>
            <div className="logout-modal-buttons">
              <button className="cancel-btn" onClick={() => setShowLogoutModal(false)}>
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
          <h1>Student Dashboard</h1>
          <button className="btn btn-secondary" onClick={() => setShowLogoutModal(true)}>
            Logout
          </button>
        </div>
      </div>

      <div className="container">
        <div className="dashboard-tabs">
          <button
            className={activeTab === "assignments" ? "tab-button active" : "tab-button"}
            onClick={() => setActiveTab("assignments")}
          >
            📝 Assignments
          </button>
          <button
            className={activeTab === "announcements" ? "tab-button active" : "tab-button"}
            onClick={() => setActiveTab("announcements")}
          >
            📢 Announcements
          </button>
          <button
            className={activeTab === "schedule" ? "tab-button active" : "tab-button"}
            onClick={() => setActiveTab("schedule")}
          >
            📅 Schedule
          </button>
        </div>

        {/* Assignments Tab */}
        {activeTab === "assignments" && (
          <div className="tab-content">
            {selectedAssignment ? (
              <div className="assignment-submission">
                <div className="card">
                  <div className="card-header">
                    <h3>Submit Assignment: {selectedAssignment.title}</h3>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedAssignment(null)}
                    >
                      ← Back to Assignments
                    </button>
                  </div>

                  <div className="assignment-details">
                    <p><strong>Subject:</strong> {selectedAssignment.subjects?.name}</p>
                    <p><strong>Description:</strong> {selectedAssignment.description}</p>
                    {selectedAssignment.instructions && (
                      <div>
                        <strong>Instructions:</strong>
                        <div style={{ whiteSpace: 'pre-wrap', marginTop: '8px' }}>
                          {selectedAssignment.instructions}
                        </div>
                      </div>
                    )}
                    {selectedAssignment.due_date && (
                      <p><strong>Due:</strong> {formatDate(selectedAssignment.due_date)}</p>
                    )}
                  </div>

                  {selectedAssignment.assignment_attachments?.length > 0 && (
                    <div className="assignment-materials">
                      <h4>Assignment Materials</h4>
                      <div className="files-grid">
                        {selectedAssignment.assignment_attachments.map(attachment => (
                          <FilePreview
                            key={attachment.id}
                            file={{
                              name: attachment.file_name,
                              url: attachment.file_url,
                              type: attachment.file_type,
                              size: attachment.file_size
                            }}
                            caption={attachment.caption}
                            showCaption={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="submission-form">
                    <div className="form-group">
                      <label htmlFor="submission-text" style={{ color: 'white', marginBottom: '8px', display: 'block' }}>
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
                      <h4>Upload Files</h4>
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
                              caption={fileCaptions[file.name] || ''}
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
                        disabled={submitting || (!submissionText.trim() && submissionFiles.length === 0)}
                      >
                        {submitting ? 'Submitting...' : 'Submit Assignment'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="assignments-list">
                {assignments.length === 0 ? (
                  <div className="message message-info">No assignments available</div>
                ) : (
                  assignments.map(assignment => {
                    const submission = getSubmissionStatus(assignment.id);
                    const daysUntilDue = getDaysUntilDue(assignment.due_date);

                    return (
                      <div key={assignment.id} className="assignment-card card">
                        <div className="assignment-header">
                          <div className="assignment-info">
                            <h3>{assignment.title}</h3>
                            <p><strong>Subject:</strong> {assignment.subjects?.name}</p>
                            <p><strong>Teacher:</strong> {assignment.teacher?.full_name}</p>
                            {assignment.due_date && (
                              <p className={daysUntilDue < 1 ? 'due-urgent' : daysUntilDue < 3 ? 'due-soon' : ''}>
                                <strong>Due:</strong> {formatDate(assignment.due_date)}
                                {daysUntilDue !== null && (
                                  <span className="days-remaining">
                                    {daysUntilDue < 0 ? ` (${Math.abs(daysUntilDue)} days overdue)` :
                                     daysUntilDue === 0 ? ' (Due today!)' :
                                     ` (${daysUntilDue} days remaining)`}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          <div className="assignment-status">
                            {submission ? (
                              <span className="status-submitted">
                                ✅ {submission.status === 'graded' ? 'Graded' : 'Submitted'}
                                {submission.score !== null && ` (${submission.score}/${assignment.max_score})`}
                              </span>
                            ) : (
                              <span className="status-pending">📝 Not Submitted</span>
                            )}
                          </div>
                        </div>

                        <p>{assignment.description}</p>

                        <div className="assignment-actions">
                          {assignment.assignment_attachments?.length > 0 && (
                            <span className="material-count">
                              📎 {assignment.assignment_attachments.length} file(s)
                            </span>
                          )}
                          {!submission && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => setSelectedAssignment(assignment)}
                            >
                              Submit Assignment
                            </button>
                          )}
                          {submission && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedAssignment(assignment)}
                            >
                              View Submission
                            </button>
                          )}
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
              <div className="message message-info">No announcements available</div>
            ) : (
              announcements.map(announcement => (
                <div key={announcement.id} className="announcement-card card">
                  <div className="announcement-header">
                    <h3>{announcement.title}</h3>
                    <div className="announcement-meta">
                      <span>By {announcement.author?.full_name}</span>
                      <span>{formatDate(announcement.created_at)}</span>
                      {announcement.subjects && (
                        <span>Subject: {announcement.subjects.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="announcement-content">
                    {announcement.content}
                  </div>
                  {announcement.priority !== 'normal' && (
                    <div className={`priority-badge priority-${announcement.priority}`}>
                      {announcement.priority.toUpperCase()}
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
              <div className="message message-info">No upcoming classes scheduled</div>
            ) : (
              schedule.map(session => (
                <div key={session.id} className="schedule-card card">
                  <div className="schedule-header">
                    <h3>{session.title}</h3>
                    <div className="schedule-time">
                      {new Date(session.session_date).toLocaleDateString()} • {session.start_time} - {session.end_time}
                    </div>
                  </div>
                  <div className="schedule-details">
                    <p><strong>Subject:</strong> {session.subjects?.name}</p>
                    <p><strong>Teacher:</strong> {session.teacher?.full_name}</p>
                    {session.location && <p><strong>Location:</strong> {session.location}</p>}
                    {session.description && <p>{session.description}</p>}
                  </div>
                  {session.is_cancelled && (
                    <div className="cancelled-notice">
                      ❌ This class has been cancelled
                      {session.cancellation_reason && <p>Reason: {session.cancellation_reason}</p>}
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
            <p>Are you sure you want to logout?</p>
            <div className="logout-modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/login");
                }}
              >
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
            <h1>Student Dashboard - Tutoring School</h1>
            <button
              onClick={() => setShowLogoutModal(true)}
              style={{
                backgroundColor: "#dc3545",
                color: "white",
                border: "1px solid #dc3545",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Welcome to Your Dashboard</h2>
          </div>
          <p>This is the students section. Features coming soon!</p>
        </div>
      </div>
    </div>
  );
}
