import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import MessageModal from "../../components/MessageModal";
import SuspensionModal from "../../components/SuspensionModal";
import SubjectEditModal from "../../components/SubjectEditModal";
import AnnouncementEditModal from "../../components/AnnouncementEditModal";
import MultipleTeacherAssignModal from "../../components/MultipleTeacherAssignModal";
import "./admin.css";

// Dynamic API base URL configuration
const getApiBaseUrl = () => {
  const currentPort = window.location.port;
  console.log("Current port:", currentPort);

  // Map frontend ports to backend ports
  const portMap = {
    5173: "3000", // Default Vite dev port
    5174: "3000", // Alternative Vite port
    5175: "3000", // Another alternative port
    4173: "3000", // Vite preview port
    3000: "3000", // Direct backend port
  };

  const backendPort = portMap[currentPort] || "3000";

  // For development (localhost), use the mapped backend port
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return `http://localhost:${backendPort}`;
  }

  // For production, use the same protocol and hostname with backend port
  return `${window.location.protocol}//${window.location.hostname}:${backendPort}`;
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState("applications");
  const [applications, setApplications] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [pendingSessions, setPendingSessions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    pendingApplications: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Form states
  const [newTeacher, setNewTeacher] = useState({
    email: "",
    fullName: "",
    phone: "",
    address: "",
    assignedSubjects: [], // Array of subject IDs to assign to teacher
  });
  const [newSubject, setNewSubject] = useState({
    name: "",
    description: "",
    teacherId: "",
  });
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    targetAudience: "all",
    priority: "normal",
  });

  // Modal States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [modalState, setModalState] = useState({
    message: "",
    type: "success",
  });
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [applicationToRemove, setApplicationToRemove] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Teacher Subject Management States
  const [showSubjectAssignModal, setShowSubjectAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [applicationToReject, setApplicationToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Student Subject Management States
  const [showStudentSubjectModal, setShowStudentSubjectModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSubjects, setStudentSubjects] = useState([]);

  // Suspension Modal States
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState(null);

  // Messages States
  const [messages, setMessages] = useState([]);
  const [subjectStats, setSubjectStats] = useState({});
  const [newMessage, setNewMessage] = useState({
    subject: "",
    content: "",
    recipientId: "",
  });
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDeleteMessageModal, setShowDeleteMessageModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  // Suspended Users States
  const [suspendedUsers, setSuspendedUsers] = useState([]);

  // Collapsible form states
  const [showNewSubjectForm, setShowNewSubjectForm] = useState(false);
  const [showNewTeacherForm, setShowNewTeacherForm] = useState(false);
  const [showNewAnnouncementForm, setShowNewAnnouncementForm] = useState(false);

  // Edit modal states
  const [showSubjectEditModal, setShowSubjectEditModal] = useState(false);
  const [selectedSubjectForEdit, setSelectedSubjectForEdit] = useState(null);
  const [showAnnouncementEditModal, setShowAnnouncementEditModal] =
    useState(false);
  const [selectedAnnouncementForEdit, setSelectedAnnouncementForEdit] =
    useState(null);
  const [showMultipleTeacherModal, setShowMultipleTeacherModal] =
    useState(false);
  const [selectedSubjectForTeachers, setSelectedSubjectForTeachers] =
    useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pending_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select(
          `
          *,
          teacher:profiles(full_name, email)
        `
        )
        .order("name");

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          *,
          teacher_subjects(
            subject:subjects(
              id,
              name
            )
          )
        `
        )
        .eq("role", "teacher")
        .order("full_name");

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          *,
          student_subjects(
            subjects(name)
          )
        `
        )
        .eq("role", "student")
        .order("full_name");

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select(
          `
          *,
          author:profiles(full_name),
          subject:subjects(name)
        `
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [appRes, studentRes, teacherRes, subjectRes] = await Promise.all([
        supabase
          .from("pending_applications")
          .select("*", { count: "exact" })
          .eq("status", "pending"),
        supabase
          .from("profiles")
          .select("*", { count: "exact" })
          .eq("role", "student"),
        supabase
          .from("profiles")
          .select("*", { count: "exact" })
          .eq("role", "teacher"),
        supabase
          .from("subjects")
          .select("*", { count: "exact" })
          .eq("status", "active"),
      ]);

      setStats({
        pendingApplications: appRes.count || 0,
        totalStudents: studentRes.count || 0,
        totalTeachers: teacherRes.count || 0,
        totalSubjects: subjectRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  const fetchPendingSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("class_sessions")
        .select(
          `
          *,
          teacher:profiles!class_sessions_teacher_id_fkey(full_name, email),
          subject:subjects(name)
        `
        )
        .eq("approval_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingSessions(data || []);
    } catch (error) {
      console.error("Error fetching pending sessions:", error);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("class_sessions")
        .select(
          `
          *,
          teacher:profiles!class_sessions_teacher_id_fkey(full_name, email),
          subject:subjects(name)
        `
        )
        .order("session_date", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  }, []);

  const fetchSubjectStats = useCallback(async () => {
    try {
      const { data: subjects, error: subjectsError } = await supabase
        .from("subjects")
        .select("id, name");

      if (subjectsError) throw subjectsError;

      const stats = {};

      for (const subject of subjects) {
        // Count students enrolled in this subject
        const { count: studentCount, error: studentError } = await supabase
          .from("student_subjects")
          .select("*", { count: "exact", head: true })
          .eq("subject_id", subject.id);

        // Count assignments for this subject
        const { count: assignmentCount, error: assignmentError } =
          await supabase
            .from("assignments")
            .select("*", { count: "exact", head: true })
            .eq("subject_id", subject.id);

        if (!studentError && !assignmentError) {
          stats[subject.id] = {
            studentCount: studentCount || 0,
            assignmentCount: assignmentCount || 0,
          };
        }
      }

      setSubjectStats(stats);
    } catch (error) {
      console.error("Error fetching subject stats:", error);
    }
  }, []);

  const fetchSuspendedUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("user_suspensions")
        .select(
          `
          *,
          user:profiles!user_suspensions_user_id_fkey(id, full_name, email, role),
          admin:profiles!user_suspensions_admin_id_fkey(full_name)
        `
        )
        .eq("is_active", true)
        .order("suspended_at", { ascending: false });

      if (error) throw error;
      setSuspendedUsers(data || []);
    } catch (error) {
      console.error("Error fetching suspended users:", error);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("admin_messages")
        .select(
          `
          *,
          sender:profiles!admin_messages_sender_id_fkey(full_name),
          recipient:profiles!admin_messages_recipient_id_fkey(full_name, role)
        `
        )
        .eq("sender_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [user?.id]);

  const fetchAllData = useCallback(async () => {
    try {
      await Promise.all([
        fetchApplications(),
        fetchSubjects(),
        fetchTeachers(),
        fetchStudents(),
        fetchAnnouncements(),
        fetchStats(),
        fetchPendingSessions(),
        fetchSessions(),
        fetchSuspendedUsers(),
        fetchSubjectStats(),
      ]);

      // Fetch messages separately as it depends on user
      if (user?.id) {
        await fetchMessages();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [
    fetchApplications,
    fetchSubjects,
    fetchTeachers,
    fetchStudents,
    fetchAnnouncements,
    fetchStats,
    fetchPendingSessions,
    fetchSessions,
    fetchSuspendedUsers,
    fetchSubjectStats,
    fetchMessages,
    user?.id,
  ]);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      setLoading(true);
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

        if (profileError || !profile?.role || profile.role !== "admin") {
          navigate("/login");
          return;
        }

        setUser(userData.user);
        await fetchAllData();
      } catch (error) {
        console.error("Error checking auth:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [navigate, fetchAllData]);

  // Handle URL tab parameter from notifications
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");

    if (tabParam) {
      // Map notification tab names to admin tab names
      const tabMapping = {
        sessions: "session-approvals",
        announcements: "announcements",
      };

      const targetTab = tabMapping[tabParam] || tabParam;

      // Valid admin tabs
      const validTabs = [
        "applications",
        "teachers",
        "subjects",
        "students",
        "session-approvals",
        "announcements",
        "user-management",
        "messages",
      ];

      if (validTabs.includes(targetTab)) {
        setActiveTab(targetTab);
        // Clear the URL parameter
        window.history.replaceState({}, "", "/admin");
      }
    }
  }, [location.search]);

  const handleApprove = async (applicationId) => {
    try {
      // Get the application details first
      const { data: application, error: fetchError } = await supabase
        .from("pending_applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (fetchError) throw fetchError;

      // Update application status
      const { error: updateError } = await supabase
        .from("pending_applications")
        .update({
          status: "accepted",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (updateError) throw updateError;

      // Create student account via API
      const response = await fetch(`${getApiBaseUrl()}/api/invite-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: application.email,
          role: "student",
          full_name: application.full_name,
          phone: application.phone,
          address: application.address,
          date_of_birth: application.date_of_birth,
          parent_name: application.parent_name,
          parent_email: application.parent_email,
          parent_phone: application.parent_phone,
          subjects: application.subjects,
          // Production mode: sending real invitation emails
        }),
      });

      if (!response.ok) {
        // Get detailed error message
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", errorData);

        // If account creation fails, revert the application status
        await supabase
          .from("pending_applications")
          .update({ status: "pending" })
          .eq("id", applicationId);
        throw new Error(
          `Failed to create student account: ${
            errorData.error || response.statusText
          }`
        );
      }

      fetchApplications();
      fetchStats();
      setModalState({
        message:
          "Student approved and account created successfully! Invitation email sent.",
        type: "success",
      });
    } catch (error) {
      console.error("Error approving application:", error);
      setModalState({
        message: "Error approving application: " + error.message,
        type: "error",
      });
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason) {
      setModalState({
        message: "Rejection reason cannot be empty.",
        type: "error",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("pending_applications")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationToReject);

      if (error) throw error;

      setShowRejectModal(false);
      setRejectionReason("");
      setApplicationToReject(null);
      fetchApplications();
      fetchStats();
    } catch (error) {
      console.error("Error rejecting application:", error);
      setModalState({
        message: "Error rejecting application: " + error.message,
        type: "error",
      });
    }
  };

  const handleRemoveApplication = async () => {
    try {
      const { error } = await supabase
        .from("pending_applications")
        .delete()
        .eq("id", applicationToRemove);

      if (error) throw error;

      setShowRemoveConfirmModal(false);
      setApplicationToRemove(null);
      fetchApplications();
      fetchStats();
      // No success message as per request
    } catch (error) {
      console.error("Error removing application:", error);
      setShowRemoveConfirmModal(false);
      setModalState({
        message: "Error removing application: " + error.message,
        type: "error",
      });
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      // First create the teacher account via API
      const response = await fetch(`${getApiBaseUrl()}/api/invite-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newTeacher.email,
          role: "teacher",
          full_name: newTeacher.fullName,
          phone: newTeacher.phone,
          address: newTeacher.address,
          // Production mode: sending real invitation emails
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", errorData);
        throw new Error(
          `Failed to create teacher: ${errorData.error || response.statusText}`
        );
      }

      const result = await response.json();
      const teacherId = result.user?.id;

      // If subjects were assigned, update them in the database
      if (newTeacher.assignedSubjects.length > 0 && teacherId) {
        for (const subjectId of newTeacher.assignedSubjects) {
          await supabase
            .from("subjects")
            .update({ teacher_id: teacherId })
            .eq("id", subjectId);
        }
      }

      setNewTeacher({
        email: "",
        fullName: "",
        phone: "",
        address: "",
        assignedSubjects: [],
      });
      fetchTeachers();
      fetchSubjects(); // Refresh subjects to show new assignments
      fetchStats();
      setModalState({
        message: `Teacher account created successfully!${
          newTeacher.assignedSubjects.length > 0
            ? ` ${newTeacher.assignedSubjects.length} subject(s) assigned.`
            : ""
        }`,
        type: "success",
      });
    } catch (error) {
      console.error("Error creating teacher:", error);
      setModalState({
        message: "Error creating teacher account: " + error.message,
        type: "error",
      });
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("subjects").insert([
        {
          name: newSubject.name,
          description: newSubject.description,
          teacher_id: newSubject.teacherId || null,
        },
      ]);

      if (error) throw error;

      setNewSubject({ name: "", description: "", teacherId: "" });
      fetchSubjects();
      fetchStats();
      setModalState({
        message: "Subject created successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error creating subject:", error);
      setModalState({
        message: "Error creating subject: " + error.message,
        type: "error",
      });
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("announcements")
        .insert([
          {
            title: newAnnouncement.title,
            content: newAnnouncement.content,
            author_id: user.user.id,
            target_audience: newAnnouncement.targetAudience,
            priority: newAnnouncement.priority,
          },
        ])
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Announcement was not created - check permissions");
      }

      setNewAnnouncement({
        title: "",
        content: "",
        targetAudience: "all",
        priority: "normal",
      });
      setShowNewAnnouncementForm(false);
      fetchAnnouncements();
      setModalState({
        message: "Announcement created successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error creating announcement:", error);
      setModalState({
        message: "Error creating announcement: " + error.message,
        type: "error",
      });
    }
  };

  // Session Approval Handlers
  const handleApproveSession = async (sessionId) => {
    try {
      const { error } = await supabase
        .from("class_sessions")
        .update({ approval_status: "approved" })
        .eq("id", sessionId);

      if (error) throw error;

      // Create notification for teacher
      const session = pendingSessions.find((s) => s.id === sessionId);
      if (session) {
        await supabase.from("notifications").insert({
          user_id: session.teacher_id,
          title: "Session Approved",
          message: `Your session "${session.title}" has been approved by admin.`,
          type: "session_approved",
          related_id: sessionId,
          is_read: false,
        });
      }

      await fetchPendingSessions();
      setModalState({
        message: "Session approved successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error approving session:", error);
      setModalState({
        message: "Error approving session: " + error.message,
        type: "error",
      });
    }
  };

  const handleRejectSession = async (
    sessionId,
    reason = "No reason provided"
  ) => {
    try {
      const { error } = await supabase
        .from("class_sessions")
        .update({
          approval_status: "rejected",
          rejection_reason: reason,
        })
        .eq("id", sessionId);

      if (error) throw error;

      // Create notification for teacher
      const session = pendingSessions.find((s) => s.id === sessionId);
      if (session) {
        await supabase.from("notifications").insert({
          user_id: session.teacher_id,
          title: "Session Rejected",
          message: `Your session "${session.title}" has been rejected. Reason: ${reason}`,
          type: "session_rejected",
          related_id: sessionId,
          is_read: false,
        });
      }

      await fetchPendingSessions();
      setModalState({
        message: "Session rejected successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error rejecting session:", error);
      setModalState({
        message: "Error rejecting session: " + error.message,
        type: "error",
      });
    }
  };

  const handleAdminCancelSession = async (sessionId, reason, teacherId) => {
    try {
      // Update session status to cancelled using existing columns
      const { error: updateError } = await supabase
        .from("class_sessions")
        .update({
          is_cancelled: true,
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (updateError) throw updateError;

      // Send message to teacher about admin cancellation
      const session = sessions.find((s) => s.id === sessionId);
      if (session && teacherId) {
        await supabase.from("admin_messages").insert({
          sender_id: user.id,
          recipient_id: teacherId,
          subject: "Session Cancelled by Admin",
          content: `Your session "${
            session.title
          }" has been cancelled by the administrator.\n\nSession Details:\n- Subject: ${
            session.subject?.name
          }\n- Date: ${new Date(
            session.session_date
          ).toLocaleDateString()}\n- Time: ${session.start_time} - ${
            session.end_time
          }\n\nReason for cancellation:\n${reason}`,
          is_read: false,
        });

        // Also create a notification
        await supabase.from("notifications").insert({
          user_id: teacherId,
          title: "Session Cancelled by Admin",
          message: `Your session "${session.title}" has been cancelled by admin. Check messages for details.`,
          type: "session_cancelled",
          related_id: sessionId,
          is_read: false,
        });
      }

      // Refresh sessions data
      await fetchSessions();
      await fetchPendingSessions();

      setModalState({
        message: "Session cancelled successfully! Teacher has been notified.",
        type: "success",
      });
    } catch (error) {
      console.error("Error cancelling session:", error);
      setModalState({
        message: "Error cancelling session: " + error.message,
        type: "error",
      });
    }
  };

  // Student Management Handlers
  const handleSuspendStudent = async (studentId, studentName) => {
    setUserToSuspend({ id: studentId, name: studentName, type: "student" });
    setShowSuspensionModal(true);
  };

  const handleSuspendTeacher = async (teacherId, teacherName) => {
    setUserToSuspend({ id: teacherId, name: teacherName, type: "teacher" });
    setShowSuspensionModal(true);
  };

  const handleConfirmSuspension = async (reasonCategory, reasonDetails) => {
    if (!userToSuspend) return;

    try {
      // Update user status
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .update({ status: "suspended" })
        .eq("id", userToSuspend.id)
        .select();

      if (profileError) throw profileError;

      if (!profileData || profileData.length === 0) {
        throw new Error(
          "User not found or you don't have permission to suspend them"
        );
      }

      // Insert suspension record
      const { data: suspensionData, error: suspensionError } = await supabase
        .from("user_suspensions")
        .insert({
          user_id: userToSuspend.id,
          admin_id: user.id,
          reason_category: reasonCategory,
          reason_details: reasonDetails,
          is_active: true,
        })
        .select();

      if (suspensionError) throw suspensionError;

      if (!suspensionData || suspensionData.length === 0) {
        throw new Error("Failed to create suspension record");
      }

      // Create notification
      let notificationMessage = `Your account has been suspended. Reason: ${reasonCategory}`;
      if (reasonDetails && reasonCategory === "Other") {
        notificationMessage = `Your account has been suspended. Reason: ${reasonDetails}`;
      }

      if (userToSuspend.type === "teacher") {
        notificationMessage +=
          ". Students will be notified to contact administration about your classes.";
      }

      await supabase.from("notifications").insert({
        user_id: userToSuspend.id,
        title: "Account Suspended",
        message: notificationMessage,
        type: "system",
        is_read: false,
      });

      // If teacher, notify their students
      if (userToSuspend.type === "teacher") {
        const { data: teacherStudents } = await supabase
          .from("enrollments")
          .select("student_id")
          .eq("teacher_id", userToSuspend.id);

        if (teacherStudents && teacherStudents.length > 0) {
          const studentNotifications = teacherStudents.map((enrollment) => ({
            user_id: enrollment.student_id,
            title: "Teacher Suspended",
            message: `Your teacher has been suspended. Please contact administration for information about your classes and assignments.`,
            type: "system",
            is_read: false,
          }));

          await supabase.from("notifications").insert(studentNotifications);
        }
      }

      // Refresh data
      if (userToSuspend.type === "student") {
        fetchStudents();
      } else {
        fetchTeachers();
      }

      setModalState({
        message: `${userToSuspend.name} has been suspended successfully.`,
        type: "success",
      });
    } catch (error) {
      console.error("Error suspending user:", error);
      setModalState({
        message: "Error suspending user: " + error.message,
        type: "error",
      });
    }
  };

  const handleUnsuspendStudent = async (studentId, studentName) => {
    if (
      !window.confirm(
        `Are you sure you want to unsuspend ${studentName}? They will regain access to the platform.`
      )
    ) {
      return;
    }

    try {
      // Update profile status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ status: "active" })
        .eq("id", studentId);

      if (profileError) throw profileError;

      // Deactivate suspension records
      const { error: suspensionError } = await supabase
        .from("user_suspensions")
        .update({ is_active: false })
        .eq("user_id", studentId)
        .eq("is_active", true);

      if (suspensionError) throw suspensionError;

      // Create notification for the user
      await supabase.from("notifications").insert({
        recipient_id: studentId,
        title: "Account Reactivated",
        message:
          "Your account has been reactivated. You can now access the platform again.",
        type: "system",
        is_read: false,
      });

      // Refresh all relevant data
      fetchStudents();
      fetchTeachers();
      fetchSuspendedUsers();

      setModalState({
        message: `${studentName} has been unsuspended successfully.`,
        type: "success",
      });
    } catch (error) {
      console.error("Error unsuspending user:", error);
      setModalState({
        message: "Error unsuspending user: " + error.message,
        type: "error",
      });
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    const confirmMessage = `⚠️ DANGER: This will permanently delete ${studentName} and ALL their data including:
    
• Student profile
• Assignment submissions
• Grades and progress
• File uploads
• All records

This action CANNOT be undone. Are you absolutely sure?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Second confirmation
    const secondConfirm = window.prompt(
      `To confirm deletion, please type "${studentName}" exactly:`
    );
    if (secondConfirm !== studentName) {
      setModalState({
        message: "Deletion cancelled - name did not match exactly.",
        type: "error",
      });
      return;
    }

    try {
      // Delete in order to handle foreign key constraints
      // 1. Delete submission files first
      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select("id")
        .eq("student_id", studentId);

      if (submissions) {
        for (const submission of submissions) {
          await supabase
            .from("submission_files")
            .delete()
            .eq("submission_id", submission.id);
        }
      }

      // 2. Delete assignment submissions
      await supabase
        .from("assignment_submissions")
        .delete()
        .eq("student_id", studentId);

      // 3. Delete student subject enrollments
      await supabase
        .from("student_subjects")
        .delete()
        .eq("student_id", studentId);

      // 4. Delete notifications
      await supabase
        .from("notifications")
        .delete()
        .eq("recipient_id", studentId);

      // 5. Delete class attendance records
      await supabase
        .from("class_attendance")
        .delete()
        .eq("student_id", studentId);

      // 6. Finally delete the profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", studentId);

      if (error) throw error;

      fetchStudents();
      setModalState({
        message: `${studentName} and all associated data have been permanently deleted.`,
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      setModalState({
        message: "Error deleting student: " + error.message,
        type: "error",
      });
    }
  };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    const confirmMessage = `⚠️ DANGER: This will permanently delete ${teacherName} and ALL their data including:
• All assignments they created
• All class sessions they scheduled
• All grades they assigned
• All subject assignments
• All notifications and messages
• Complete account and profile

⚠️ THIS ACTION CANNOT BE UNDONE! ⚠️

Type "DELETE" to confirm permanent deletion:`;

    const confirmation = window.prompt(confirmMessage);
    if (confirmation !== "DELETE") {
      return;
    }

    const finalConfirm = window.confirm(
      `Last chance! Are you absolutely sure you want to permanently delete ${teacherName}?`
    );
    if (!finalConfirm) return;

    try {
      // Delete in order to handle foreign key constraints
      // 1. Delete assignment files first
      const { data: teacherAssignments } = await supabase
        .from("assignments")
        .select("id")
        .eq("teacher_id", teacherId);

      if (teacherAssignments) {
        for (const assignment of teacherAssignments) {
          await supabase.storage
            .from("assignment-files")
            .remove([`${assignment.id}/`]);
        }
      }

      // 2. Delete assignment submissions
      await supabase
        .from("assignment_submissions")
        .delete()
        .in("assignment_id", teacherAssignments?.map((a) => a.id) || []);

      // 3. Delete assignments
      await supabase.from("assignments").delete().eq("teacher_id", teacherId);

      // 4. Delete class sessions
      await supabase
        .from("class_sessions")
        .delete()
        .eq("teacher_id", teacherId);

      // 5. Delete teacher subject assignments
      await supabase
        .from("teacher_subjects")
        .delete()
        .eq("teacher_id", teacherId);

      // 6. Delete notifications
      await supabase
        .from("notifications")
        .delete()
        .or(`sender_id.eq.${teacherId},user_id.eq.${teacherId}`);

      // 7. Delete admin messages
      await supabase
        .from("admin_messages")
        .delete()
        .or(`sender_id.eq.${teacherId},recipient_id.eq.${teacherId}`);

      // 8. Delete suspension records
      await supabase.from("user_suspensions").delete().eq("user_id", teacherId);

      // 9. Finally delete the profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", teacherId);

      if (error) throw error;

      fetchTeachers();
      setModalState({
        message: `${teacherName} and all associated data have been permanently deleted.`,
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      setModalState({
        message: "Error deleting teacher: " + error.message,
        type: "error",
      });
    }
  };

  const handleSendMessage = async (
    recipientId,
    recipientName,
    recipientType = "student"
  ) => {
    setSelectedRecipient({
      id: recipientId,
      name: recipientName,
      type: recipientType,
    });
    setShowMessageModal(true);
  };

  const handleConfirmSendMessage = async () => {
    if (
      !selectedRecipient ||
      !newMessage.subject.trim() ||
      !newMessage.content.trim()
    ) {
      alert("Please fill in both subject and message content");
      return;
    }

    try {
      // Insert into admin_messages table
      await supabase.from("admin_messages").insert({
        sender_id: user.id,
        recipient_id: selectedRecipient.id,
        subject: newMessage.subject.trim(),
        content: newMessage.content.trim(),
        is_read: false,
      });

      // Also create a notification for immediate visibility
      await supabase.from("notifications").insert({
        user_id: selectedRecipient.id,
        title: `Message from Admin: ${newMessage.subject}`,
        message: `You have received a new message from administration. Subject: ${newMessage.subject}`,
        type: "admin_message",
        is_read: false,
      });

      setModalState({
        message: `Message sent to ${selectedRecipient.name} successfully.`,
        type: "success",
      });

      // Reset form
      setNewMessage({ subject: "", content: "", recipientId: "" });
      setShowMessageModal(false);
      setSelectedRecipient(null);
    } catch (error) {
      console.error("Error sending message:", error);
      setModalState({
        message: "Error sending message: " + error.message,
        type: "error",
      });
    }
  };

  // Teacher Subject Management Handlers
  const handleAssignSubjectsToTeacher = async (teacherId, teacherName) => {
    try {
      // Get current subjects assigned to this teacher from teacher_subjects table
      const { data: currentSubjects } = await supabase
        .from("teacher_subjects")
        .select("subject_id")
        .eq("teacher_id", teacherId);

      setSelectedTeacher({ id: teacherId, name: teacherName });
      setTeacherSubjects(currentSubjects?.map((s) => s.subject_id) || []);
      setShowSubjectAssignModal(true);
    } catch (error) {
      console.error("Error fetching teacher subjects:", error);
      setModalState({
        message: "Error loading teacher subjects: " + error.message,
        type: "error",
      });
    }
  };

  const handleSaveTeacherSubjects = async () => {
    try {
      if (!selectedTeacher) return;

      // First, remove all current assignments for this teacher
      const { error: deleteError } = await supabase
        .from("teacher_subjects")
        .delete()
        .eq("teacher_id", selectedTeacher.id);

      if (deleteError) throw deleteError;

      // Then add the selected subject assignments
      if (teacherSubjects.length > 0) {
        const assignments = teacherSubjects.map((subjectId) => ({
          teacher_id: selectedTeacher.id,
          subject_id: subjectId,
          assigned_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
          .from("teacher_subjects")
          .insert(assignments);

        if (insertError) throw insertError;
      }

      setShowSubjectAssignModal(false);
      setSelectedTeacher(null);
      setTeacherSubjects([]);
      fetchTeachers();
      fetchSubjects();
      setModalState({
        message: `Subject assignments updated for ${selectedTeacher.name}`,
        type: "success",
      });
    } catch (error) {
      console.error("Error updating teacher subjects:", error);
      setModalState({
        message: "Error updating subject assignments: " + error.message,
        type: "error",
      });
    }
  };

  const handleToggleSubjectAssignment = (subjectId) => {
    setTeacherSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  // Student Subject Management Handlers
  const handleManageStudentSubjects = async (studentId, studentName) => {
    try {
      // Get current subjects this student is enrolled in
      const { data: currentEnrollments } = await supabase
        .from("student_subjects")
        .select("subject_id")
        .eq("student_id", studentId);

      setSelectedStudent({ id: studentId, name: studentName });
      setStudentSubjects(currentEnrollments?.map((s) => s.subject_id) || []);
      setShowStudentSubjectModal(true);
    } catch (error) {
      console.error("Error fetching student subjects:", error);
      setModalState({
        message: "Error loading student subjects: " + error.message,
        type: "error",
      });
    }
  };

  const handleSaveStudentSubjects = async () => {
    try {
      if (!selectedStudent) return;

      // First, remove all current enrollments for this student
      const { error: deleteError } = await supabase
        .from("student_subjects")
        .delete()
        .eq("student_id", selectedStudent.id);

      if (deleteError) throw deleteError;

      // Then add the selected subject enrollments
      if (studentSubjects.length > 0) {
        const enrollments = studentSubjects.map((subjectId) => ({
          student_id: selectedStudent.id,
          subject_id: subjectId,
          enrolled_at: new Date().toISOString(),
          status: "active",
        }));

        const { error: insertError } = await supabase
          .from("student_subjects")
          .insert(enrollments);

        if (insertError) throw insertError;
      }

      setShowStudentSubjectModal(false);
      setSelectedStudent(null);
      setStudentSubjects([]);
      fetchStudents();
      setModalState({
        message: `Subject enrollments updated for ${
          selectedStudent.full_name || selectedStudent.name
        }`,
        type: "success",
      });
    } catch (error) {
      console.error("Error updating student subjects:", error);
      setModalState({
        message: "Error updating student enrollments: " + error.message,
        type: "error",
      });
    }
  };

  const handleToggleStudentSubjectAssignment = (subjectId) => {
    setStudentSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  // Subject Edit Modal Handlers
  const handleEditSubject = (subject) => {
    setSelectedSubjectForEdit(subject);
    setShowSubjectEditModal(true);
  };

  const handleSaveSubjectEdit = async (subjectId, editData) => {
    try {
      const { error } = await supabase
        .from("subjects")
        .update({
          name: editData.name,
          description: editData.description,
          status: editData.status,
        })
        .eq("id", subjectId);

      if (error) throw error;

      fetchSubjects();
      setModalState({
        message: "Subject updated successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating subject:", error);
      setModalState({
        message: "Error updating subject: " + error.message,
        type: "error",
      });
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subjectId);

      if (error) throw error;

      fetchSubjects();
      fetchStats();
      setModalState({
        message: "Subject deleted successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting subject:", error);
      setModalState({
        message: "Error deleting subject: " + error.message,
        type: "error",
      });
    }
  };

  const handleSuspendSubject = async (subjectId, newStatus) => {
    try {
      const { error } = await supabase
        .from("subjects")
        .update({ status: newStatus })
        .eq("id", subjectId);

      if (error) throw error;

      fetchSubjects();
      setModalState({
        message: `Subject ${
          newStatus === "active" ? "activated" : "suspended"
        } successfully!`,
        type: "success",
      });
    } catch (error) {
      console.error("Error updating subject status:", error);
      setModalState({
        message: "Error updating subject status: " + error.message,
        type: "error",
      });
    }
  };

  // Announcement Edit Modal Handlers
  const handleEditAnnouncement = (announcement) => {
    setSelectedAnnouncementForEdit(announcement);
    setShowAnnouncementEditModal(true);
  };

  const handleSaveAnnouncementEdit = async (announcementId, editData) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({
          title: editData.title,
          content: editData.content,
          target_audience: editData.target_audience,
          priority: editData.priority,
        })
        .eq("id", announcementId);

      if (error) throw error;

      fetchAnnouncements();
      setModalState({
        message: "Announcement updated successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating announcement:", error);
      setModalState({
        message: "Error updating announcement: " + error.message,
        type: "error",
      });
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", announcementId);

      if (error) throw error;

      fetchAnnouncements();
      setModalState({
        message: "Announcement deleted successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      setModalState({
        message: "Error deleting announcement: " + error.message,
        type: "error",
      });
    }
  };

  // Multiple Teacher Assignment Handlers
  const handleAssignMultipleTeachers = (subject) => {
    setSelectedSubjectForTeachers(subject);
    setShowMultipleTeacherModal(true);
  };

  const handleSaveMultipleTeachers = async (subjectId, teacherIds) => {
    try {
      // First, remove all current teacher assignments for this subject
      await supabase
        .from("teacher_subjects")
        .delete()
        .eq("subject_id", subjectId);

      // Then add new assignments
      if (teacherIds.length > 0) {
        const assignments = teacherIds.map((teacherId, index) => ({
          teacher_id: teacherId,
          subject_id: subjectId,
          is_primary: index === 0, // First teacher is primary
        }));

        await supabase.from("teacher_subjects").insert(assignments);
      }

      fetchSubjects();
      fetchTeachers();
      setModalState({
        message: "Teacher assignments updated successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating teacher assignments:", error);
      setModalState({
        message: "Error updating teacher assignments: " + error.message,
        type: "error",
      });
    }
  };

  // Message Management Handlers
  const handleDeleteMessage = async (messageId) => {
    try {
      console.log("Attempting to delete message with ID:", messageId);

      // Use server-side API to bypass RLS restrictions
      const response = await fetch(
        `${getApiBaseUrl()}/api/admin/delete-message`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              (
                await supabase.auth.getSession()
              ).data.session?.access_token
            }`,
          },
          body: JSON.stringify({ messageId }),
        }
      );

      console.log("Delete response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Delete response error:", errorData);
        throw new Error(errorData.error || "Failed to delete message");
      }

      const result = await response.json();
      console.log("Delete success:", result);

      await fetchMessages();
      setModalState({
        message: "Message deleted successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      setModalState({
        message: "Error deleting message: " + error.message,
        type: "error",
      });
    }
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-container">
      <MessageModal
        message={modalState.message}
        type={modalState.type}
        onClose={() => setModalState({ message: "", type: "success" })}
      />

      <SuspensionModal
        isOpen={showSuspensionModal}
        onClose={() => {
          setShowSuspensionModal(false);
          setUserToSuspend(null);
        }}
        onConfirm={handleConfirmSuspension}
        userName={userToSuspend?.name || ""}
        userType={userToSuspend?.type || "student"}
      />

      {/* Message Modal */}
      {showMessageModal && (
        <div
          className="suspension-modal-overlay"
          onClick={() => setShowMessageModal(false)}
        >
          <div
            className="suspension-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="suspension-modal-header">
              <h2>📧 Send Message</h2>
              <button
                className="close-btn"
                onClick={() => setShowMessageModal(false)}
              >
                ×
              </button>
            </div>

            <div className="suspension-modal-body">
              <p style={{ color: "#fbbf24", marginBottom: "1.5rem" }}>
                Sending message to: <strong>{selectedRecipient?.name}</strong> (
                {selectedRecipient?.type})
              </p>

              <div className="form-group">
                <label
                  style={{
                    color: "white",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Subject:
                </label>
                <input
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) =>
                    setNewMessage((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  className="custom-reason-input"
                  style={{ minHeight: "auto", height: "40px" }}
                  placeholder="Enter message subject..."
                />
              </div>

              <div className="form-group">
                <label
                  style={{
                    color: "white",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Message:
                </label>
                <textarea
                  value={newMessage.content}
                  onChange={(e) =>
                    setNewMessage((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  className="custom-reason-input"
                  rows="5"
                  placeholder="Enter your message..."
                />
              </div>
            </div>

            <div className="suspension-modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowMessageModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmSendMessage}
                disabled={
                  !newMessage.subject.trim() || !newMessage.content.trim()
                }
                style={{
                  background:
                    !newMessage.subject.trim() || !newMessage.content.trim()
                      ? "#6b7280"
                      : "linear-gradient(135deg, #3b82f6, #2563eb)",
                }}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="admin-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h1>🎓 Admin Dashboard</h1>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
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
        <div className="stats-grid">
          <div className="stat-card pending">
            <h3>{stats.pendingApplications}</h3>
            <p>Pending Applications</p>
          </div>
          <div className="stat-card students">
            <h3>{stats.totalStudents}</h3>
            <p>Total Students</p>
          </div>
          <div className="stat-card teachers">
            <h3>{stats.totalTeachers}</h3>
            <p>Total Teachers</p>
          </div>
          <div className="stat-card subjects">
            <h3>{stats.totalSubjects}</h3>
            <p>Active Subjects</p>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "applications" ? "active" : ""}
          onClick={() => setActiveTab("applications")}
          data-tab="applications"
        >
          📝 Applications
        </button>
        <button
          className={activeTab === "teachers" ? "active" : ""}
          onClick={() => setActiveTab("teachers")}
          data-tab="teachers"
        >
          👩‍🏫 Teachers
        </button>
        <button
          className={activeTab === "subjects" ? "active" : ""}
          onClick={() => setActiveTab("subjects")}
          data-tab="subjects"
        >
          📚 Subjects
        </button>
        <button
          className={activeTab === "students" ? "active" : ""}
          onClick={() => setActiveTab("students")}
          data-tab="students"
        >
          🎓 Students
        </button>
        <button
          className={activeTab === "session-approvals" ? "active" : ""}
          onClick={() => setActiveTab("session-approvals")}
          data-tab="session-approvals"
        >
          📅 Session Approvals ({pendingSessions.length})
        </button>
        <button
          className={activeTab === "sessions" ? "active" : ""}
          onClick={() => setActiveTab("sessions")}
          data-tab="sessions"
        >
          🗓️ Sessions Overview ({sessions.length})
        </button>
        <button
          className={activeTab === "announcements" ? "active" : ""}
          onClick={() => setActiveTab("announcements")}
          data-tab="announcements"
        >
          📢 Announcements
        </button>
        <button
          className={activeTab === "user-management" ? "active" : ""}
          onClick={() => setActiveTab("user-management")}
          data-tab="user-management"
        >
          👥 User Management ({suspendedUsers.length})
        </button>
        <button
          className={activeTab === "messages" ? "active" : ""}
          onClick={() => setActiveTab("messages")}
          data-tab="messages"
        >
          📧 Messages ({messages.length})
        </button>
      </div>

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

      {showRemoveConfirmModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal-content">
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to permanently delete this application? This
              action cannot be undone.
            </p>
            <div className="logout-modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowRemoveConfirmModal(false);
                  setApplicationToRemove(null);
                }}
              >
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleRemoveApplication}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal-content">
            <h2>Provide Rejection Reason</h2>
            <form onSubmit={handleReject}>
              <textarea
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows="4"
                style={{
                  width: "100%",
                  marginBottom: "1rem",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
                required
              />
              <div className="logout-modal-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                    setApplicationToReject(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="confirm-btn">
                  Submit Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteMessageModal && (
        <div
          className="logout-modal-overlay"
          style={{
            animation: "fadeIn 0.3s ease-out",
            backdropFilter: "blur(8px)",
            background: "rgba(0, 0, 0, 0.7)",
          }}
        >
          <div
            className="logout-modal-content"
            style={{
              animation:
                "slideInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow:
                "0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h2
              style={{
                color: "white",
                marginBottom: "1rem",
                fontSize: "1.5rem",
                fontWeight: "600",
              }}
            >
              🗑️ Delete Message
            </h2>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                marginBottom: "1.5rem",
                lineHeight: "1.6",
              }}
            >
              Are you sure you want to delete this message? This action cannot
              be undone.
            </p>
            {messageToDelete && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <p
                  style={{
                    color: "white",
                    fontWeight: "500",
                    margin: "0 0 4px 0",
                  }}
                >
                  "{messageToDelete.subject}"
                </p>
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.9rem",
                    margin: 0,
                  }}
                >
                  To: {messageToDelete.recipient?.full_name}
                </p>
              </div>
            )}
            <div className="logout-modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteMessageModal(false);
                  setMessageToDelete(null);
                }}
                style={{
                  transition: "all 0.3s ease",
                  transform: "scale(1)",
                }}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={() => {
                  console.log(
                    "Confirming delete for messageToDelete:",
                    messageToDelete
                  );
                  if (messageToDelete?.id) {
                    handleDeleteMessage(messageToDelete.id);
                  } else {
                    console.error(
                      "No messageToDelete or missing ID:",
                      messageToDelete
                    );
                  }
                  setShowDeleteMessageModal(false);
                  setMessageToDelete(null);
                }}
                style={{
                  background:
                    "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                  transition: "all 0.3s ease",
                  transform: "scale(1)",
                }}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              >
                Delete Message
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-content">
        {activeTab === "applications" && (
          <div className="applications-section">
            <h2>Student Applications</h2>
            {applications.length === 0 ? (
              <p>No applications found.</p>
            ) : (
              <div className="applications-grid">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className={`application-card ${app.status}`}
                  >
                    <div className="application-header">
                      <h3>{app.full_name}</h3>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span className={`status-badge ${app.status}`}>
                          {app.status}
                        </span>
                        <button
                          onClick={() => {
                            setApplicationToRemove(app.id);
                            setShowRemoveConfirmModal(true);
                          }}
                          className="remove-btn"
                          title="Permanently delete application"
                        >
                          &times;
                        </button>
                      </div>
                    </div>

                    <div className="application-details">
                      <p>
                        <strong>Email:</strong> {app.email}
                      </p>
                      <p>
                        <strong>Age:</strong>{" "}
                        {new Date().getFullYear() -
                          new Date(app.date_of_birth).getFullYear()}
                      </p>
                      <p>
                        <strong>Phone:</strong> {app.phone}
                      </p>
                      <p>
                        <strong>Address:</strong> {app.address}
                      </p>

                      <div className="parent-info">
                        <h4>Parent/Guardian Information</h4>
                        <p>
                          <strong>Name:</strong> {app.parent_name}
                        </p>
                        <p>
                          <strong>Email:</strong> {app.parent_email}
                        </p>
                        <p>
                          <strong>Phone:</strong> {app.parent_phone}
                        </p>
                      </div>

                      <div className="subjects-requested">
                        <h4>Subjects Requested</h4>
                        <div className="subjects-list">
                          {app.subjects &&
                            app.subjects.map((subject, index) => (
                              <span key={index} className="subject-tag">
                                {subject}
                              </span>
                            ))}
                        </div>
                      </div>

                      {app.motivation && (
                        <div className="motivation">
                          <h4>Motivation</h4>
                          <p>{app.motivation}</p>
                        </div>
                      )}

                      {app.previous_experience && (
                        <div className="experience">
                          <h4>Previous Experience</h4>
                          <p>{app.previous_experience}</p>
                        </div>
                      )}

                      {app.status === "rejected" && app.rejection_reason && (
                        <div className="rejection-reason">
                          <h4>Rejection Reason</h4>
                          <p>{app.rejection_reason}</p>
                        </div>
                      )}
                    </div>

                    {app.status === "pending" && (
                      <div className="application-actions">
                        <button
                          className="approve-btn"
                          onClick={() => handleApprove(app.id)}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => {
                            setApplicationToReject(app.id);
                            setShowRejectModal(true);
                          }}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    )}

                    <div className="application-footer">
                      <small>
                        Applied: {new Date(app.created_at).toLocaleDateString()}
                        {app.reviewed_at && (
                          <>
                            {" "}
                            • Reviewed:{" "}
                            {new Date(app.reviewed_at).toLocaleDateString()}
                          </>
                        )}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "teachers" && (
          <div className="teachers-section">
            <div className="section-header">
              <h2>Teachers Management</h2>
              <button
                className="btn btn-primary new-button"
                onClick={() => setShowNewTeacherForm(!showNewTeacherForm)}
              >
                {showNewTeacherForm ? "− Cancel" : "+ New Teacher"}
              </button>
            </div>

            {showNewTeacherForm && (
              <div className="create-teacher-form collapsible-form">
                <h3>Create New Teacher Account</h3>
                <form onSubmit={handleCreateTeacher}>
                  <div className="form-grid">
                    <input
                      type="email"
                      placeholder="Email"
                      value={newTeacher.email}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, email: e.target.value })
                      }
                      required
                    />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newTeacher.fullName}
                      onChange={(e) =>
                        setNewTeacher({
                          ...newTeacher,
                          fullName: e.target.value,
                        })
                      }
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={newTeacher.phone}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, phone: e.target.value })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={newTeacher.address}
                      onChange={(e) =>
                        setNewTeacher({
                          ...newTeacher,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Subject Assignment Section */}
                  <div className="subject-assignment-section">
                    <h4>Assign Subjects (Optional)</h4>
                    <div className="subjects-checkbox-grid">
                      {subjects
                        .filter((subject) => !subject.teacher_id)
                        .map((subject) => (
                          <label key={subject.id} className="subject-checkbox">
                            <input
                              type="checkbox"
                              checked={newTeacher.assignedSubjects.includes(
                                subject.id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewTeacher({
                                    ...newTeacher,
                                    assignedSubjects: [
                                      ...newTeacher.assignedSubjects,
                                      subject.id,
                                    ],
                                  });
                                } else {
                                  setNewTeacher({
                                    ...newTeacher,
                                    assignedSubjects:
                                      newTeacher.assignedSubjects.filter(
                                        (id) => id !== subject.id
                                      ),
                                  });
                                }
                              }}
                            />
                            <span className="checkmark"></span>
                            {subject.name}
                          </label>
                        ))}
                    </div>
                    {subjects.filter((subject) => !subject.teacher_id)
                      .length === 0 && (
                      <p className="no-subjects-available">
                        No unassigned subjects available
                      </p>
                    )}
                  </div>

                  <button type="submit" className="create-btn">
                    Create Teacher Account
                  </button>
                </form>
              </div>
            )}

            <div className="teachers-list">
              <h3>Current Teachers</h3>
              <div className="teachers-grid">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="teacher-card">
                    <div className="teacher-info">
                      <div className="teacher-header">
                        <h4>{teacher.full_name}</h4>
                      </div>
                      <p>
                        <strong>Email:</strong> {teacher.email}
                      </p>
                      <p>
                        <strong>Phone:</strong>{" "}
                        {teacher.phone || "Not provided"}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span className={`status ${teacher.status}`}>
                          {teacher.status}
                        </span>
                      </p>
                      <div className="assigned-subjects">
                        <strong>Assigned Subjects:</strong>
                        <div className="subject-tags">
                          {teacher.teacher_subjects &&
                          teacher.teacher_subjects.length > 0 ? (
                            teacher.teacher_subjects.map((ts) => (
                              <span key={ts.subject.id} className="subject-tag">
                                {ts.subject.name}
                              </span>
                            ))
                          ) : (
                            <span className="no-subjects">
                              No subjects assigned
                            </span>
                          )}
                        </div>
                      </div>
                      <p>
                        <strong>Joined:</strong>{" "}
                        {new Date(teacher.created_at).toLocaleDateString()}
                      </p>

                      {/* Action Buttons */}
                      <div className="user-actions">
                        <button
                          className="action-btn primary"
                          onClick={() =>
                            handleAssignSubjectsToTeacher(
                              teacher.id,
                              teacher.full_name
                            )
                          }
                          title="Manage Subjects"
                        >
                          📚 Manage Subjects
                        </button>

                        {teacher.status === "active" ? (
                          <button
                            className="action-btn warning"
                            onClick={() =>
                              handleSuspendTeacher(
                                teacher.id,
                                teacher.full_name
                              )
                            }
                            title="Suspend Teacher"
                          >
                            🚫 Suspend
                          </button>
                        ) : (
                          <button
                            className="action-btn success"
                            onClick={() =>
                              handleUnsuspendStudent(
                                teacher.id,
                                teacher.full_name
                              )
                            }
                            title="Unsuspend Teacher"
                          >
                            ✅ Unsuspend
                          </button>
                        )}

                        <button
                          className="action-btn danger"
                          onClick={() =>
                            handleDeleteTeacher(teacher.id, teacher.full_name)
                          }
                          title="Delete Teacher"
                        >
                          🗑️ Delete
                        </button>

                        <button
                          className="action-btn info"
                          onClick={() =>
                            handleSendMessage(
                              teacher.id,
                              teacher.full_name,
                              "teacher"
                            )
                          }
                          title="Send Message"
                        >
                          📨 Message
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "subjects" && (
          <div className="subjects-section">
            <div className="section-header">
              <h2>Subjects Management</h2>
              <button
                className="btn btn-primary new-button"
                onClick={() => setShowNewSubjectForm(!showNewSubjectForm)}
              >
                {showNewSubjectForm ? "− Cancel" : "+ New Subject"}
              </button>
            </div>

            {showNewSubjectForm && (
              <div className="create-subject-form collapsible-form">
                <h3>Create New Subject</h3>
                <form onSubmit={handleCreateSubject}>
                  <input
                    type="text"
                    placeholder="Subject Name"
                    value={newSubject.name}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, name: e.target.value })
                    }
                    required
                  />
                  <textarea
                    placeholder="Subject Description"
                    value={newSubject.description}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        description: e.target.value,
                      })
                    }
                    rows="3"
                  />
                  <select
                    value={newSubject.teacherId}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        teacherId: e.target.value,
                      })
                    }
                  >
                    <option value="">Assign Teacher (Optional)</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="create-btn">
                    Create Subject
                  </button>
                </form>
              </div>
            )}

            <div className="subjects-list">
              <h3>Current Subjects</h3>
              <div className="subjects-grid improved-grid">
                {subjects.map((subject) => (
                  <div key={subject.id} className="subject-card enhanced-card">
                    <div className="subject-header">
                      <div className="subject-title-section">
                        <h4>{subject.name}</h4>
                        <span
                          className={`status-badge status-${subject.status}`}
                        >
                          {subject.status}
                        </span>
                      </div>
                      <div className="subject-actions">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleAssignMultipleTeachers(subject)}
                          title="Assign Multiple Teachers"
                        >
                          👥 Teachers
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditSubject(subject)}
                          title="Edit Subject"
                        >
                          ✏️ Edit
                        </button>
                      </div>
                    </div>

                    <div className="subject-content">
                      <p className="subject-description">
                        {subject.description}
                      </p>

                      <div className="subject-teachers">
                        <strong>Teachers:</strong>
                        <div className="teacher-list">
                          {subject.teacher?.full_name ? (
                            <span className="teacher-badge primary">
                              {subject.teacher.full_name}
                            </span>
                          ) : (
                            <span className="no-teacher">
                              No teacher assigned
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="subject-stats">
                        <div className="stat-item">
                          <span className="stat-label">Students:</span>
                          <span className="stat-value">
                            {subjectStats[subject.id]?.studentCount || 0}
                          </span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Assignments:</span>
                          <span className="stat-value">
                            {subjectStats[subject.id]?.assignmentCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <div className="students-section">
            <div className="section-header">
              <h2>Student Management</h2>
              <div className="stats-summary">
                <span className="stat-item">Total: {students.length}</span>
                <span className="stat-item">
                  Active: {students.filter((s) => s.status === "active").length}
                </span>
                <span className="stat-item">
                  Suspended:{" "}
                  {students.filter((s) => s.status === "suspended").length}
                </span>
              </div>
            </div>

            <div className="students-grid">
              {students.map((student) => (
                <div key={student.id} className="student-card">
                  <div className="student-info">
                    <div className="student-header">
                      <h4>{student.full_name}</h4>
                    </div>
                    <p>
                      <strong>Email:</strong> {student.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {student.phone || "Not provided"}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={`status ${student.status}`}>
                        {student.status}
                      </span>
                    </p>
                    <div className="enrolled-subjects">
                      <strong>Enrolled Subjects:</strong>
                      {student.student_subjects?.length > 0 ? (
                        student.student_subjects.map((enrollment, index) => (
                          <span key={index} className="subject-tag small">
                            {enrollment.subjects.name}
                          </span>
                        ))
                      ) : (
                        <span className="no-subjects">
                          No subjects enrolled
                        </span>
                      )}
                    </div>
                    <p>
                      <strong>Joined:</strong>{" "}
                      {new Date(student.created_at).toLocaleDateString()}
                    </p>

                    {/* Action Buttons */}
                    <div className="user-actions">
                      <button
                        className="action-btn primary"
                        onClick={() =>
                          handleManageStudentSubjects(
                            student.id,
                            student.full_name
                          )
                        }
                        title="Manage Subjects"
                      >
                        📚 Manage Subjects
                      </button>

                      {student.status === "active" ? (
                        <button
                          className="action-btn warning"
                          onClick={() =>
                            handleSuspendStudent(student.id, student.full_name)
                          }
                          title="Suspend Student"
                        >
                          🚫 Suspend
                        </button>
                      ) : (
                        <button
                          className="action-btn success"
                          onClick={() =>
                            handleUnsuspendStudent(
                              student.id,
                              student.full_name
                            )
                          }
                          title="Unsuspend Student"
                        >
                          ✅ Unsuspend
                        </button>
                      )}

                      <button
                        className="action-btn danger"
                        onClick={() =>
                          handleDeleteStudent(student.id, student.full_name)
                        }
                        title="Delete Student"
                      >
                        🗑️ Delete
                      </button>

                      <button
                        className="action-btn info"
                        onClick={() =>
                          handleSendMessage(
                            student.id,
                            student.full_name,
                            "student"
                          )
                        }
                        title="Send Message"
                      >
                        📨 Message
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <div className="no-data">
                  <p>No students found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "session-approvals" && (
          <div className="session-approvals-section">
            <div className="section-header">
              <h2>Session Approval Requests</h2>
              <p>Review and approve session requests from teachers</p>
            </div>

            <div className="sessions-grid">
              {pendingSessions.length > 0 ? (
                pendingSessions.map((session) => (
                  <div key={session.id} className="session-card">
                    <div className="card-header">
                      <h3>{session.title}</h3>
                      <span className="pending-badge">Pending Approval</span>
                    </div>
                    <div className="card-content">
                      <p>
                        <strong>Teacher:</strong> {session.teacher?.full_name} (
                        {session.teacher?.email})
                      </p>
                      <p>
                        <strong>Subject:</strong> {session.subject?.name}
                      </p>
                      <p>
                        <strong>Description:</strong> {session.description}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(session.session_date).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Time:</strong> {session.start_time} -{" "}
                        {session.end_time}
                      </p>
                      <p>
                        <strong>Location:</strong> {session.location}
                      </p>
                      <p>
                        <strong>Type:</strong> {session.session_type}
                      </p>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn btn-success"
                        onClick={() => handleApproveSession(session.id)}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          const reason = prompt(
                            "Enter rejection reason (optional):"
                          );
                          if (reason !== null) {
                            handleRejectSession(
                              session.id,
                              reason || "No reason provided"
                            );
                          }
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <h3>📅 No Pending Sessions</h3>
                  <p>All session requests have been reviewed.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="sessions-section">
            <div className="section-header">
              <h2>Sessions Overview</h2>
              <p>Manage all teacher sessions and cancellations</p>
            </div>

            <div className="sessions-grid">
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`session-card ${
                      session.is_cancelled ? "cancelled-session" : ""
                    }`}
                  >
                    <div className="card-header">
                      <h3>{session.title}</h3>
                      <div className="session-badges">
                        <span
                          className={`status-badge ${session.approval_status}`}
                        >
                          {session.approval_status}
                        </span>
                        {session.is_cancelled && (
                          <span className="status-badge cancelled">
                            cancelled
                          </span>
                        )}
                        {!session.is_cancelled && session.status && (
                          <span
                            className={`status-badge ${session.status.replace(
                              "_",
                              "-"
                            )}`}
                          >
                            {session.status.replace("_", " ").toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="card-content">
                      <p>
                        <strong>Teacher:</strong> {session.teacher?.full_name} (
                        {session.teacher?.email})
                      </p>
                      <p>
                        <strong>Subject:</strong> {session.subject?.name}
                      </p>
                      <p>
                        <strong>Description:</strong> {session.description}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(session.session_date).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Time:</strong> {session.start_time} -{" "}
                        {session.end_time}
                      </p>
                      <p>
                        <strong>Location:</strong> {session.location}
                      </p>
                      <p>
                        <strong>Type:</strong> {session.session_type}
                      </p>
                      {session.cancellation_reason && (
                        <div className="cancellation-info">
                          <p>
                            <strong>Cancellation Reason:</strong>
                          </p>
                          <p className="cancellation-reason">
                            {session.cancellation_reason}
                          </p>
                          <p>
                            <strong>Cancelled At:</strong>{" "}
                            {new Date(session.updated_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="card-actions">
                      {!session.is_cancelled &&
                        session.approval_status === "approved" && (
                          <button
                            className="btn btn-danger"
                            onClick={() => {
                              const reason = prompt(
                                "Enter cancellation reason:"
                              );
                              if (reason && reason.trim()) {
                                handleAdminCancelSession(
                                  session.id,
                                  reason.trim(),
                                  session.teacher.id
                                );
                              }
                            }}
                          >
                            🚫 Cancel Session
                          </button>
                        )}
                      {session.approval_status === "pending" && (
                        <>
                          <button
                            className="btn btn-success"
                            onClick={() => handleApproveSession(session.id)}
                          >
                            ✅ Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => {
                              const reason = prompt(
                                "Enter rejection reason (optional):"
                              );
                              if (reason !== null) {
                                handleRejectSession(
                                  session.id,
                                  reason || "No reason provided"
                                );
                              }
                            }}
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          alert(
                            `Session created: ${new Date(
                              session.created_at
                            ).toLocaleString()}\nLast updated: ${new Date(
                              session.updated_at
                            ).toLocaleString()}`
                          );
                        }}
                      >
                        ℹ️ Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <h3>📅 No Sessions Found</h3>
                  <p>No sessions have been created yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "announcements" && (
          <div className="announcements-section">
            <div className="section-header">
              <h2>Announcements Management</h2>
              <button
                className="btn btn-primary new-button"
                onClick={() =>
                  setShowNewAnnouncementForm(!showNewAnnouncementForm)
                }
              >
                {showNewAnnouncementForm ? "− Cancel" : "+ New Announcement"}
              </button>
            </div>

            {showNewAnnouncementForm && (
              <div className="create-announcement-form collapsible-form">
                <h3>Create New Announcement</h3>
                <form onSubmit={handleCreateAnnouncement}>
                  <input
                    type="text"
                    placeholder="Announcement Title"
                    value={newAnnouncement.title}
                    onChange={(e) =>
                      setNewAnnouncement({
                        ...newAnnouncement,
                        title: e.target.value,
                      })
                    }
                    required
                  />
                  <textarea
                    placeholder="Announcement Content"
                    value={newAnnouncement.content}
                    onChange={(e) =>
                      setNewAnnouncement({
                        ...newAnnouncement,
                        content: e.target.value,
                      })
                    }
                    rows="4"
                    required
                  />
                  <div className="form-row">
                    <select
                      value={newAnnouncement.targetAudience}
                      onChange={(e) =>
                        setNewAnnouncement({
                          ...newAnnouncement,
                          targetAudience: e.target.value,
                        })
                      }
                    >
                      <option value="all">All Users</option>
                      <option value="students">Students Only</option>
                      <option value="teachers">Teachers Only</option>
                    </select>
                    <select
                      value={newAnnouncement.priority}
                      onChange={(e) =>
                        setNewAnnouncement({
                          ...newAnnouncement,
                          priority: e.target.value,
                        })
                      }
                    >
                      <option value="low">Low Priority</option>
                      <option value="normal">Normal Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <button type="submit" className="create-btn">
                    Create Announcement
                  </button>
                </form>
              </div>
            )}

            <div className="announcements-list">
              <h3>Recent Announcements</h3>
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="announcement-card enhanced-card"
                >
                  <div className="announcement-header">
                    <div className="announcement-title-section">
                      <h4>{announcement.title}</h4>
                      <span
                        className={`priority-badge ${announcement.priority}`}
                      >
                        {announcement.priority}
                      </span>
                    </div>
                    <div className="announcement-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEditAnnouncement(announcement)}
                        title="Edit Announcement"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this announcement?"
                            )
                          ) {
                            handleDeleteAnnouncement(announcement.id);
                          }
                        }}
                        title="Delete Announcement"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  <p className="announcement-content">{announcement.content}</p>
                  <div className="announcement-meta">
                    <span>
                      <strong>Author:</strong> {announcement.author.full_name}
                    </span>
                    <span>
                      <strong>Audience:</strong> {announcement.target_audience}
                    </span>
                    <span>
                      <strong>Created:</strong>{" "}
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === "user-management" && (
          <div className="user-management-section">
            <div className="section-header">
              <h2>User Management</h2>
              <p>Manage suspended users and their status</p>
            </div>

            <div className="suspended-users-grid">
              {suspendedUsers.length > 0 ? (
                suspendedUsers.map((suspension) => (
                  <div key={suspension.id} className="suspension-card card">
                    <div className="card-header">
                      <h3>{suspension.user?.full_name}</h3>
                      <span className="status-badge status-suspended">
                        🚫 Suspended
                      </span>
                    </div>
                    <div className="card-content">
                      <p>
                        <strong>Email:</strong> {suspension.user?.email}
                      </p>
                      <p>
                        <strong>Role:</strong> {suspension.user?.role}
                      </p>
                      <p>
                        <strong>Suspended by:</strong>{" "}
                        {suspension.admin?.full_name || "System"}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(suspension.suspended_at).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Reason:</strong> {suspension.reason_category}
                      </p>
                      {suspension.reason_details && (
                        <div
                          style={{
                            marginTop: "1rem",
                            padding: "0.75rem",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "6px",
                          }}
                        >
                          <p
                            style={{
                              color: "#FCA5A5",
                              margin: 0,
                              fontSize: "0.9rem",
                            }}
                          >
                            <strong>Details:</strong>{" "}
                            {suspension.reason_details}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() =>
                          suspension.user?.role === "student"
                            ? handleUnsuspendStudent(
                                suspension.user_id,
                                suspension.user?.full_name
                              )
                            : handleUnsuspendStudent(
                                suspension.user_id,
                                suspension.user?.full_name
                              )
                        }
                      >
                        ✅ Unsuspend
                      </button>
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() =>
                          handleSendMessage(
                            suspension.user_id,
                            suspension.user?.full_name,
                            suspension.user?.role
                          )
                        }
                      >
                        📨 Message
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <h3>👥 No Suspended Users</h3>
                  <p>All users are currently active.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="messages-section">
            <div className="section-header">
              <h2>Sent Messages</h2>
              <p>View and manage all messages sent to users</p>
            </div>

            <div className="messages-list">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className="message-card card enhanced-card"
                  >
                    <div className="message-header">
                      <div className="message-meta">
                        <h4 style={{ color: "white", margin: 0 }}>
                          {message.subject}
                        </h4>
                        <div
                          style={{
                            color: "rgba(255,255,255,0.7)",
                            fontSize: "0.9rem",
                            marginTop: "0.25rem",
                          }}
                        >
                          <span>
                            To: {message.recipient?.full_name} (
                            {message.recipient?.role})
                          </span>
                          <span style={{ margin: "0 0.5rem" }}>•</span>
                          <span>
                            {new Date(message.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="message-actions">
                        <div
                          className={`read-status ${
                            message.is_read ? "read" : "unread"
                          }`}
                        >
                          {message.is_read ? "✅ Read" : "📬 Unread"}
                        </div>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            console.log("Setting message to delete:", message);
                            setMessageToDelete(message);
                            setShowDeleteMessageModal(true);
                          }}
                          title="Delete Message"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>

                    <div className="message-content">
                      <p
                        style={{
                          color: "rgba(255,255,255,0.9)",
                          lineHeight: "1.6",
                          margin: "1rem 0 0 0",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <h3>📧 No Messages Sent</h3>
                  <p>You haven't sent any messages yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subject Assignment Modal */}
      {showSubjectAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content subject-assign-modal">
            <div className="modal-header">
              <h3>Manage Subjects for {selectedTeacher?.name}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowSubjectAssignModal(false);
                  setSelectedTeacher(null);
                  setTeacherSubjects([]);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Select the subjects you want to assign to this teacher. They
                will be responsible for creating assignments and managing
                students in these subjects.
              </p>

              <div className="subjects-selection-grid">
                {subjects.map((subject) => {
                  const isCurrentlyAssigned = teacherSubjects.includes(
                    subject.id
                  );
                  const isAssignedToOtherTeacher =
                    subject.teacher_id &&
                    subject.teacher_id !== selectedTeacher?.id;

                  return (
                    <label
                      key={subject.id}
                      className={`subject-selection-item ${
                        isAssignedToOtherTeacher ? "disabled" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isCurrentlyAssigned}
                        disabled={isAssignedToOtherTeacher}
                        onChange={() =>
                          handleToggleSubjectAssignment(subject.id)
                        }
                      />
                      <div className="subject-info">
                        <span className="subject-name">{subject.name}</span>
                        {subject.description && (
                          <span className="subject-description">
                            {subject.description}
                          </span>
                        )}
                        {isAssignedToOtherTeacher && (
                          <span className="assigned-to">
                            Assigned to:{" "}
                            {subjects.find((s) => s.id === subject.id)?.teacher
                              ?.full_name || "Another teacher"}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {subjects.length === 0 && (
                <div className="no-subjects-message">
                  <p>
                    No subjects available. Create subjects first in the Subjects
                    tab.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowSubjectAssignModal(false);
                  setSelectedTeacher(null);
                  setTeacherSubjects([]);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveTeacherSubjects}
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Subject Management Modal */}
      {showStudentSubjectModal && (
        <div className="modal-overlay">
          <div className="modal-content subject-assign-modal">
            <div className="modal-header">
              <h3>Manage Subjects for {selectedStudent?.name}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowStudentSubjectModal(false);
                  setSelectedStudent(null);
                  setStudentSubjects([]);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Select the subjects you want to enroll this student in. They
                will be able to view assignments and participate in sessions for
                these subjects.
              </p>

              <div className="subjects-selection-grid">
                {subjects.map((subject) => {
                  const isCurrentlyEnrolled = studentSubjects.includes(
                    subject.id
                  );
                  const hasTeacher = subject.teacher_id;

                  return (
                    <label
                      key={subject.id}
                      className={`subject-selection-item ${
                        !hasTeacher ? "disabled" : ""
                      }`}
                      title={
                        !hasTeacher
                          ? "This subject needs a teacher assigned before students can enroll"
                          : ""
                      }
                    >
                      <input
                        type="checkbox"
                        checked={isCurrentlyEnrolled}
                        disabled={!hasTeacher}
                        onChange={() =>
                          handleToggleStudentSubjectAssignment(subject.id)
                        }
                      />
                      <div className="subject-info">
                        <span className="subject-name">{subject.name}</span>
                        {subject.description && (
                          <span className="subject-description">
                            {subject.description}
                          </span>
                        )}
                        {!hasTeacher && (
                          <span className="no-teacher-warning">
                            No teacher assigned
                          </span>
                        )}
                        {hasTeacher && (
                          <span className="teacher-info">
                            Teacher:{" "}
                            {
                              teachers.find((t) => t.id === subject.teacher_id)
                                ?.full_name
                            }
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {subjects.length === 0 && (
                <div className="no-subjects-message">
                  <p>
                    No subjects available. Create subjects first in the Subjects
                    tab.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowStudentSubjectModal(false);
                  setSelectedStudent(null);
                  setStudentSubjects([]);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveStudentSubjects}
              >
                Save Enrollment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Edit Modal */}
      <SubjectEditModal
        isOpen={showSubjectEditModal}
        onClose={() => {
          setShowSubjectEditModal(false);
          setSelectedSubjectForEdit(null);
        }}
        subject={selectedSubjectForEdit}
        onSave={handleSaveSubjectEdit}
        onDelete={handleDeleteSubject}
        onSuspend={handleSuspendSubject}
        teachers={teachers}
      />

      {/* Announcement Edit Modal */}
      <AnnouncementEditModal
        isOpen={showAnnouncementEditModal}
        onClose={() => {
          setShowAnnouncementEditModal(false);
          setSelectedAnnouncementForEdit(null);
        }}
        announcement={selectedAnnouncementForEdit}
        onSave={handleSaveAnnouncementEdit}
        onDelete={handleDeleteAnnouncement}
      />

      {/* Multiple Teacher Assignment Modal */}
      <MultipleTeacherAssignModal
        isOpen={showMultipleTeacherModal}
        onClose={() => {
          setShowMultipleTeacherModal(false);
          setSelectedSubjectForTeachers(null);
        }}
        subject={selectedSubjectForTeachers}
        teachers={teachers}
        currentTeacherIds={
          selectedSubjectForTeachers?.teacher_id
            ? [selectedSubjectForTeachers.teacher_id]
            : []
        }
        onSave={handleSaveMultipleTeachers}
      />
    </div>
  );
};

export default Admin;
