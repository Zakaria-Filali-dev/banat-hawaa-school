// src/components/ProtectedRoute.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react"; // or your own session context

export default function ProtectedRoute({ children }) {
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session === null) {
      navigate("/login", { replace: true });
    }
  }, [session, navigate]);

  // Only render children if session exists
  return session ? children : null;
}
