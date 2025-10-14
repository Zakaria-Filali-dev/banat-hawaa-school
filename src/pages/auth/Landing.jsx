import React from "react";
import { useNavigate } from "react-router-dom";
import interactiveLearningImg from "../../assets/interactive-learning.png";
import expertTutorsImg from "../../assets/expert-tutors.png";
import analyticsImg from "../../assets/analitics.png";
import globalAccessImg from "../../assets/global-access.png";
import siteLogo from "../../assets/site-logo.png";
import "./Landing.css";

// Scroll Reveal Hook
const useScrollReveal = () => {
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".scroll-reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
};

// Particle Effect Component
const ParticleBackground = () => {
  const [particles, setParticles] = React.useState([]);

  React.useEffect(() => {
    const createParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 25; i++) {
        // Reduced particle count
        newParticles.push({
          id: i,
          left: Math.random() * 100,
          animationDelay: Math.random() * 20, // Increased delay range
          size: Math.random() * 1.5 + 0.5, // Made particles smaller
        });
      }
      setParticles(newParticles);
    };

    createParticles();
  }, []);

  return (
    <div className="particles">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.animationDelay}s`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
        />
      ))}
    </div>
  );
};

// Animated Text Cycling Component
const AnimatedText = ({ words, style }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 3000); // Change word every 3 seconds

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        overflow: "hidden",
        verticalAlign: "top",
        minWidth: "fit-content",
        ...style,
      }}
    >
      {words.map((word, index) => (
        <span
          key={word}
          style={{
            position: index === currentIndex ? "relative" : "absolute",
            left: 0,
            top: 0,
            opacity: index === currentIndex ? 1 : 0,
            transform: `translateY(${
              index === currentIndex
                ? "0%"
                : index < currentIndex
                ? "-100%"
                : "100%"
            })`,
            transition: "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            whiteSpace: "nowrap",
          }}
        >
          {word}
        </span>
      ))}
    </span>
  );
};

const Landing = () => {
  const navigate = useNavigate();

  // Initialize scroll reveal
  useScrollReveal();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
          linear-gradient(135deg, #667eea 0%, #764ba2 100%),
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.3) 0%, transparent 50%)
        `,
        backgroundSize: "100% 100%, 50% 50%, 50% 50%",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        overflow: "auto",
        position: "relative",
      }}
    >
      {/* Enhanced Particle Background */}
      <ParticleBackground />

      {/* Enhanced Animated Background Elements */}
      <div className="background-orb orb-1" />
      <div className="background-orb orb-2" />
      <div className="background-orb orb-3" />
      <div className="background-orb orb-4" />
      <div className="background-orb orb-5" />

      {/* Main Content Container */}
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Enhanced Hero Section */}
        <div
          className="glassmorphism-card scroll-reveal fade-in-scale glow-effect"
          style={{
            padding: "50px 40px",
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          {/* Enhanced School Logo */}
          <div
            className="bounce-in animate-delay-200"
            style={{
              width: "120px",
              height: "120px",
              marginBottom: "20px",
              margin: "0 auto 20px auto",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
              background: "rgba(255, 255, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "15px",
              border: "2px solid rgba(255, 215, 0, 0.3)",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.1) rotate(5deg)";
              e.target.style.boxShadow = "0 15px 35px rgba(255, 215, 0, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1) rotate(0deg)";
              e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.3)";
            }}
          >
            <img
              src={siteLogo}
              alt="BANAT-HAWAA-SCHOOL Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))",
              }}
            />
          </div>

          <h1
            className="gradient-text fade-in-up animate-delay-300"
            style={{
              marginBottom: "15px",
              fontSize: "3rem",
              fontWeight: "bold",
              textShadow: "2px 2px 8px rgba(0,0,0,0.5)",
              letterSpacing: "2px",
              background: "linear-gradient(45deg, #FFFFFF, #E0C3FC)",
              backgroundSize: "400% 400%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            BANAT-HAWAA-SCHOOL
          </h1>

          <div
            style={{
              background: "rgba(255, 215, 0, 0.2)",
              padding: "8px 20px",
              borderRadius: "20px",
              display: "inline-block",
              marginBottom: "25px",
              border: "1px solid rgba(255, 215, 0, 0.3)",
            }}
          >
            <span
              style={{
                color: "#FFD700",
                fontWeight: "bold",
                fontSize: "0.9rem",
              }}
            >
              ⭐ Premium Educational Excellence ⭐
            </span>
          </div>

          <p
            style={{
              color: "rgba(255, 255, 255, 0.95)",
              fontSize: "1.4rem",
              marginBottom: "35px",
              lineHeight: "1.7",
              fontWeight: "300",
              maxWidth: "700px",
              margin: "0 auto 35px auto",
            }}
          >
            <AnimatedText
              words={["Transform", "Revolutionize", "Elevate", "Enhance"]}
              style={{
                fontWeight: "bold",
                color: "#FF6B6B",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              }}
            />{" "}
            your educational journey with our{" "}
            <AnimatedText
              words={[
                "state-of-the-art",
                "cutting-edge",
                "revolutionary",
                "innovative",
              ]}
              style={{
                fontWeight: "bold",
                color: "#FFD700",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              }}
            />{" "}
            tutoring platform. Experience{" "}
            <AnimatedText
              words={[
                "personalized learning",
                "adaptive education",
                "tailored instruction",
                "custom curriculum",
              ]}
              style={{
                fontWeight: "bold",
                color: "#4ECDC4",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              }}
            />
            ,{" "}
            <AnimatedText
              words={[
                "expert guidance",
                "professional mentoring",
                "skilled coaching",
                "specialized support",
              ]}
              style={{
                fontWeight: "bold",
                color: "#9B59B6",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              }}
            />
            , and{" "}
            <AnimatedText
              words={[
                "academic excellence",
                "educational mastery",
                "learning success",
                "scholarly achievement",
              ]}
              style={{
                fontWeight: "bold",
                color: "#45B7D1",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              }}
            />{" "}
            like never before.
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "30px",
            }}
          >
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "18px 35px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(45deg, #FF6B35, #F7931E)",
                color: "white",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(255, 107, 53, 0.4)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-3px)";
                e.target.style.boxShadow = "0 8px 25px rgba(255, 107, 53, 0.6)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 15px rgba(255, 107, 53, 0.4)";
              }}
            >
              🚀 Start Learning Now
            </button>

            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "18px 35px",
                borderRadius: "12px",
                border: "2px solid rgba(255, 255, 255, 0.8)",
                background: "rgba(255, 255, 255, 0.1)",
                color: "white",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.3s ease",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.2)";
                e.target.style.transform = "translateY(-3px)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.1)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              🔑 Member Login
            </button>
          </div>

          {/* Trust Indicators */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "30px",
              flexWrap: "wrap",
              marginTop: "20px",
            }}
          >
            <div
              style={{ color: "rgba(255, 255, 255, 0.8)", textAlign: "center" }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "5px" }}>🎯</div>
              <div style={{ fontSize: "0.9rem" }}>100% Success Rate</div>
            </div>
            <div
              style={{ color: "rgba(255, 255, 255, 0.8)", textAlign: "center" }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "5px" }}>🏆</div>
              <div style={{ fontSize: "0.9rem" }}>Award Winning</div>
            </div>
            <div
              style={{ color: "rgba(255, 255, 255, 0.8)", textAlign: "center" }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "5px" }}>⚡</div>
              <div style={{ fontSize: "0.9rem" }}>24/7 Support</div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "25px",
            marginBottom: "30px",
          }}
        >
          <FeatureCard
            icon={interactiveLearningImg}
            title="Interactive Learning"
            description="Engage with dynamic content, multimedia resources, and interactive assignments designed to make learning enjoyable and effective."
          />
          <FeatureCard
            icon={expertTutorsImg}
            title="Expert Tutors"
            description="Learn from certified professionals with years of experience and passion for teaching. Get personalized attention and guidance."
          />
          <FeatureCard
            icon={analyticsImg}
            title="Progress Analytics"
            description="Track your learning journey with detailed analytics, performance insights, and personalized recommendations for improvement."
          />
          <FeatureCard
            icon={globalAccessImg}
            title="Global Access"
            description="Access your education from anywhere in the world with our cloud-based platform. Learn at your own pace, anytime, anywhere."
          />
        </div>

        {/* Statistics Section */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(15px)",
            borderRadius: "20px",
            padding: "40px",
            marginBottom: "30px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <h2
            style={{
              color: "white",
              textAlign: "center",
              fontSize: "2.2rem",
              marginBottom: "30px",
              fontWeight: "bold",
            }}
          >
            🌟 Why Students Choose Us
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "30px",
              textAlign: "center",
            }}
          >
            <StatCard number="500+" label="Happy Students" icon="👨‍🎓" />
            <StatCard number="50+" label="Expert Tutors" icon="🎯" />
            <StatCard number="25+" label="Subjects Offered" icon="📚" />
            <StatCard number="98%" label="Success Rate" icon="⭐" />
          </div>
        </div>

        {/* Testimonials Section */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(15px)",
            borderRadius: "20px",
            padding: "40px",
            marginBottom: "30px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <h2
            style={{
              color: "white",
              textAlign: "center",
              fontSize: "2.2rem",
              marginBottom: "30px",
              fontWeight: "bold",
            }}
          >
            💬 What Our Students Say
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "25px",
            }}
          >
            <TestimonialCard
              quote="This platform completely transformed my understanding of mathematics. The tutors are amazing!"
              author="Sarah Ahmed"
              role="High School Student"
              rating={5}
            />
            <TestimonialCard
              quote="I improved my grades significantly thanks to the personalized learning approach. Highly recommend!"
              author="Omar Hassan"
              role="University Student"
              rating={5}
            />
            <TestimonialCard
              quote="The interactive lessons and 24/7 support made all the difference in my academic journey."
              author="Fatima Ali"
              role="Middle School Student"
              rating={5}
            />
          </div>
        </div>

        {/* Final CTA Section */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(15px)",
            borderRadius: "20px",
            padding: "50px 40px",
            textAlign: "center",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <h2
            style={{
              color: "white",
              fontSize: "2.5rem",
              marginBottom: "20px",
              fontWeight: "bold",
            }}
          >
            Ready to Begin Your Journey? 🚀
          </h2>

          <p
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "1.2rem",
              marginBottom: "35px",
              lineHeight: "1.6",
            }}
          >
            Join thousands of successful students who have achieved their
            academic goals with us. Your future starts here, and it starts now!
          </p>

          <button
            onClick={() => navigate("/register")}
            style={{
              padding: "20px 30px",
              borderRadius: "15px",
              border: "none",
              background: "linear-gradient(45deg, #FFD700, #FFA500)",
              color: "#333",
              fontSize: "20px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 6px 20px rgba(255, 215, 0, 0.4)",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-4px) scale(1.05)";
              e.target.style.boxShadow = "0 10px 30px rgba(255, 215, 0, 0.6)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0) scale(1)";
              e.target.style.boxShadow = "0 6px 20px rgba(255, 215, 0, 0.4)";
            }}
          >
            🎓 Enroll Today
          </button>

          <div style={{ marginTop: "25px", color: "rgba(255, 255, 255, 0.7)" }}>
            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: "bold" }}>
              ✨ Secure • Trusted • Excellence Guaranteed ✨
            </p>
          </div>
        </div>
      </div>

      {/* Redesigned Footer */}
      <footer className="landing-footer glassmorphism-card scroll-reveal">
        <div className="footer-content">
          <div className="footer-logo">
            <img
              src={siteLogo}
              alt="Logo"
              style={{ width: "50px", height: "50px" }}
            />
            <span
              style={{ fontSize: "1.2rem", fontWeight: "bold", color: "white" }}
            >
              BANAT-HAWAA-SCHOOL
            </span>
          </div>
          <p className="footer-text">
            Empowering the next generation of learners through technology and
            expert guidance.
          </p>
          <div className="footer-links">
            <a href="mailto:zakariafilali2007@gmail.com">Contact</a>
            <a href="https://github.com/Zakaria-Filali-dev">GitHub</a>
            <a href="#privacy">Privacy Policy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} BANAT-HAWAA-SCHOOL. All Rights
            Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Enhanced Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
  <div
    style={{
      background: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(15px)",
      borderRadius: "18px",
      padding: "30px",
      textAlign: "center",
      transition: "all 0.3s ease",
      cursor: "pointer",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      position: "relative",
      overflow: "hidden",
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
    }}
  >
    <div
      style={{
        width: "80px",
        height: "80px",
        marginBottom: "20px",
        margin: "0 auto 20px auto",
        borderRadius: "15px",
        overflow: "hidden",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        background: "rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px",
      }}
    >
      <img
        src={icon}
        alt={title}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))",
        }}
      />
    </div>
    <h3
      style={{
        color: "white",
        fontSize: "1.4rem",
        fontWeight: "bold",
        marginBottom: "15px",
      }}
    >
      {title}
    </h3>
    <p
      style={{
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: "1rem",
        lineHeight: "1.6",
        margin: 0,
      }}
    >
      {description}
    </p>
  </div>
);

// Statistics Card Component
const StatCard = ({ number, label, icon }) => (
  <div style={{ color: "white" }}>
    <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>{icon}</div>
    <div
      style={{
        fontSize: "2.5rem",
        fontWeight: "bold",
        marginBottom: "5px",
        color: "#FFD700",
      }}
    >
      {number}
    </div>
    <div style={{ fontSize: "1.1rem", color: "rgba(255, 255, 255, 0.9)" }}>
      {label}
    </div>
  </div>
);

// Testimonial Card Component
const TestimonialCard = ({ quote, author, role, rating }) => (
  <div
    style={{
      background: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(10px)",
      borderRadius: "15px",
      padding: "25px",
      border: "1px solid rgba(255, 255, 255, 0.2)",
    }}
  >
    <div style={{ marginBottom: "15px" }}>
      {[...Array(rating)].map((_, i) => (
        <span key={i} style={{ color: "#FFD700", fontSize: "1.2rem" }}>
          ⭐
        </span>
      ))}
    </div>
    <p
      style={{
        color: "rgba(255, 255, 255, 0.95)",
        fontSize: "1.1rem",
        lineHeight: "1.6",
        marginBottom: "20px",
        fontStyle: "italic",
      }}
    >
      "{quote}"
    </p>
    <div>
      <div style={{ color: "white", fontWeight: "bold", fontSize: "1.1rem" }}>
        {author}
      </div>
      <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.9rem" }}>
        {role}
      </div>
    </div>
  </div>
);

export default Landing;
