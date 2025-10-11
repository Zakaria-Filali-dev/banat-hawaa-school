import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import LoadingButton from "../components/LoadingButton";
import "./register.css";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [motivation, setMotivation] = useState("");
  const [previousExperience, setPreviousExperience] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // Load available subjects when component mounts
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from("subjects")
        .select("*")
        .eq("status", "active");
      if (data) setSubjects(data);
    };
    fetchSubjects();
  }, []);

  // Age validation helper
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Phone validation helper
  const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-()]/g, ""));
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!fullName.trim()) errors.fullName = "Full name is required";
    if (!email.trim()) errors.email = "Email is required";
    if (!dateOfBirth) {
      errors.dateOfBirth = "Date of birth is required";
    } else {
      const age = calculateAge(dateOfBirth);
      if (age < 13) errors.dateOfBirth = "Must be at least 13 years old";
      if (age > 100) errors.dateOfBirth = "Please enter a valid birth date";
    }

    if (phone && !validatePhone(phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    if (selectedSubjects.length === 0) {
      errors.subjects = "Please select at least one subject";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubjectChange = (subjectName) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subjectName)) {
        return prev.filter((s) => s !== subjectName);
      } else {
        return [...prev, subjectName];
      }
    });

    // Clear subject error when user selects a subject
    if (formErrors.subjects) {
      setFormErrors((prev) => ({ ...prev, subjects: undefined }));
    }
  };

  const goBack = () => {
    navigate("/login");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Validate form before submission
    if (!validateForm()) {
      setErrorMsg("Please fix the errors below and try again.");
      return;
    }

    setLoading(true);

    try {
      // Use consistent table name: pending_applications
      const { error } = await supabase.from("pending_applications").insert([
        {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          date_of_birth: dateOfBirth,
          phone: phone.trim(),
          address: address.trim(),
          subjects: selectedSubjects,
          motivation: motivation.trim(),
          previous_experience: previousExperience.trim(),
          status: "pending",
        },
      ]);

      if (error) {
        throw error;
      }

      setSuccessMsg(
        "Application submitted successfully! You'll be notified once it's reviewed."
      );

      // Reset form after successful submission
      setEmail("");
      setFullName("");
      setDateOfBirth("");
      setPhone("");
      setAddress("");
      setSelectedSubjects([]);
      setMotivation("");
      setPreviousExperience("");
      setFormErrors({});
    } catch (error) {
      console.error("Registration error:", error);
      if (error.message.includes("duplicate key")) {
        setErrorMsg(
          "An application with this email already exists. Please use a different email or contact support."
        );
      } else {
        setErrorMsg(
          error.message || "Failed to submit application. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Back Button */}
      <div className="back-button-container">
        <LoadingButton
          onClick={goBack}
          variant="secondary"
          size="small"
          className="back-button"
        >
          ← Back to Login
        </LoadingButton>
      </div>

      {/* Main Container */}
      <div className="register-container">
        <div className="register-card">
          {/* Header */}
          <div className="register-header">
            <h1 className="register-title">Join Our School 🎓</h1>
            <p className="register-subtitle">
              Start your learning journey with expert tutors
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="form-progress">
            <div className="progress-step active">
              <span className="step-number">1</span>
              <span className="step-label">Personal Info</span>
            </div>
            <div className="progress-line"></div>
            <div className="progress-step">
              <span className="step-number">2</span>
              <span className="step-label">Subjects</span>
            </div>
            <div className="progress-line"></div>
            <div className="progress-step">
              <span className="step-number">3</span>
              <span className="step-label">Submit</span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="register-form">
            {/* Personal Information Section */}
            <div className="form-section">
              <h3 className="section-title">📋 Personal Information</h3>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (formErrors.fullName) {
                      setFormErrors((prev) => ({
                        ...prev,
                        fullName: undefined,
                      }));
                    }
                  }}
                  disabled={loading}
                  className={`form-input ${formErrors.fullName ? "error" : ""}`}
                />
                {formErrors.fullName && (
                  <span className="error-message">{formErrors.fullName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) {
                      setFormErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  disabled={loading}
                  className={`form-input ${formErrors.email ? "error" : ""}`}
                />
                {formErrors.email && (
                  <span className="error-message">{formErrors.email}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value);
                      if (formErrors.dateOfBirth) {
                        setFormErrors((prev) => ({
                          ...prev,
                          dateOfBirth: undefined,
                        }));
                      }
                    }}
                    disabled={loading}
                    className={`form-input ${
                      formErrors.dateOfBirth ? "error" : ""
                    }`}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  {formErrors.dateOfBirth && (
                    <span className="error-message">
                      {formErrors.dateOfBirth}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+213 123 456 789"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (formErrors.phone) {
                        setFormErrors((prev) => ({
                          ...prev,
                          phone: undefined,
                        }));
                      }
                    }}
                    disabled={loading}
                    className={`form-input ${formErrors.phone ? "error" : ""}`}
                  />
                  {formErrors.phone && (
                    <span className="error-message">{formErrors.phone}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  placeholder="Your address (optional)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>

            {/* Subject Selection Section */}
            <div className="form-section">
              <h3 className="section-title">📚 Subject Selection</h3>
              <p className="section-description">
                Choose the subjects you're interested in studying with us
              </p>

              <div className="subjects-grid">
                {subjects.map((subject) => (
                  <label
                    key={subject.id}
                    className={`subject-card ${
                      selectedSubjects.includes(subject.name) ? "selected" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject.name)}
                      onChange={() => handleSubjectChange(subject.name)}
                      disabled={loading}
                      className="subject-checkbox"
                    />
                    <div className="subject-content">
                      <div className="subject-name">{subject.name}</div>
                      <div className="subject-description">
                        {subject.description}
                      </div>
                    </div>
                    <div className="subject-check">✓</div>
                  </label>
                ))}
              </div>

              {formErrors.subjects && (
                <span className="error-message">{formErrors.subjects}</span>
              )}
            </div>

            {/* Additional Information Section */}
            <div className="form-section">
              <h3 className="section-title">💭 Tell Us About Yourself</h3>

              <div className="form-group">
                <label className="form-label">
                  Why do you want to join our school?
                </label>
                <textarea
                  placeholder="Share your motivation and learning goals... (optional)"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  disabled={loading}
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Previous Experience</label>
                <textarea
                  placeholder="Tell us about your background in these subjects... (optional)"
                  value={previousExperience}
                  onChange={(e) => setPreviousExperience(e.target.value)}
                  disabled={loading}
                  className="form-textarea"
                  rows="3"
                />
              </div>
            </div>
            {/* Submit Section */}
            <div className="form-section">
              <LoadingButton
                type="submit"
                isLoading={loading}
                loadingText="Submitting Application..."
                variant="primary"
                size="large"
                className="submit-button"
              >
                🚀 Submit Application
              </LoadingButton>

              {errorMsg && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="alert alert-success">
                  <span className="alert-icon">✅</span>
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="register-footer">
            <p className="footer-text">
              Already have an account?{" "}
              <Link to="/login" className="footer-link">
                Sign in here
              </Link>
            </p>
            <div className="footer-info">
              <p>🔒 Your information is secure and protected</p>
              <p>📧 You'll receive a confirmation email once reviewed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
