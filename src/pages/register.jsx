import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { Link } from "react-router-dom";
import "./register.css";

export default function Register() {
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

  const handleSubjectChange = (subjectName) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subjectName)) {
        return prev.filter((s) => s !== subjectName);
      } else {
        return [...prev, subjectName];
      }
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    // Validate that at least one subject is selected
    if (selectedSubjects.length === 0) {
      setErrorMsg("Please select at least one subject you're interested in.");
      setLoading(false);
      return;
    }

    // Use consistent table name: pending_applications
    const { error } = await supabase.from("pending_applications").insert([
      {
        full_name: fullName,
        email,
        date_of_birth: dateOfBirth,
        phone,
        address,
        subjects: selectedSubjects, // This was missing!
        motivation,
        previous_experience: previousExperience,
        status: "pending",
      },
    ]);
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setSuccessMsg("Registration submitted! Await admin approval.");
    // Reset form
    setEmail("");
    setFullName("");
    setDateOfBirth("");
    setPhone("");
    setAddress("");
    setSelectedSubjects([]);
    setMotivation("");
    setPreviousExperience("");
  };

  return (
    <div className="page-wrapper">
      <div className="header">
        <div className="container">
          <h1>Tutoring School Portal</h1>
        </div>
      </div>
      <div className="container">
        <div className="form-container">
          <h2>Student Registration</h2>
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                type="date"
                placeholder="Date of Birth"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                disabled={loading}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
                className="form-input"
              />
            </div>

            <h3>Subject Selection (Required)</h3>
            <div className="form-group">
              <p>Select the subjects you're interested in:</p>
              {subjects.map((subject) => (
                <label key={subject.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.name)}
                    onChange={() => handleSubjectChange(subject.name)}
                    disabled={loading}
                  />
                  {subject.name} - {subject.description}
                </label>
              ))}
            </div>

            <div className="form-group">
              <textarea
                placeholder="Why do you want to join our tutoring school? (Optional)"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                disabled={loading}
                className="form-input"
                rows="3"
              />
            </div>

            <div className="form-group">
              <textarea
                placeholder="Previous experience or background in these subjects (Optional)"
                value={previousExperience}
                onChange={(e) => setPreviousExperience(e.target.value)}
                disabled={loading}
                className="form-input"
                rows="3"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
            {errorMsg && (
              <div className="message message-error mt-2">{errorMsg}</div>
            )}
            {successMsg && (
              <div className="message message-success mt-2">{successMsg}</div>
            )}
          </form>
          <div className="text-center mt-3">
            <Link to="/login" className="btn btn-secondary">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
