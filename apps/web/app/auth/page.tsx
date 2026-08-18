"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";

  const { login, register, isLoading } = useAuth();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [formState, setFormState] = useState(0); // 0 = Sign In, 1 = Sign Up
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      if (formState === 0) {
        await login({ username: username.trim(), password });
        router.push(redirectTarget);
      } else {
        await register({ username: username.trim(), password });
        // Automatically login after register
        await login({ username: username.trim(), password });
        router.push(redirectTarget);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Authentication failed. Please check your credentials.");
    }
  };

  return (
    <div className="ramain-auth-card">
      {/* Header Section */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          width: "48px",
          height: "48px",
          background: "var(--accent-lime)",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.4rem",
          margin: "0 auto 16px",
          boxShadow: "0 4px 12px rgba(197, 255, 74, 0.4)"
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: "800", marginBottom: "10px", letterSpacing: "-0.03em" }}>
          {formState === 0 ? (
            <>Welcome <span className="lime-highlight">back</span></>
          ) : (
            <>Create <span className="lime-highlight">account</span></>
          )}
        </h1>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.5" }}>
          {redirectTarget !== "/" ? (
            <span style={{ color: "#059669", fontWeight: "700" }}>
              Please sign in or create an account to join your study session!
            </span>
          ) : (
            "Collaborative study rooms, synchronized Pomodoro focus, and live note-taking designed for productive peers."
          )}
        </p>
      </div>

      {/* Tab Toggle Bar */}
      <div style={{
        display: "flex",
        background: "#F3F4F6",
        padding: "6px",
        borderRadius: "14px",
        marginBottom: "28px",
        border: "1px solid var(--border-light)"
      }}>
        <button
          type="button"
          onClick={() => { setFormState(0); setError(""); }}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "10px",
            border: "none",
            fontWeight: "700",
            fontSize: "0.92rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
            background: formState === 0 ? "#111827" : "transparent",
            color: formState === 0 ? "#FFFFFF" : "var(--text-secondary)",
            boxShadow: formState === 0 ? "0 2px 8px rgba(0,0,0,0.15)" : "none"
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setFormState(1); setError(""); }}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "10px",
            border: "none",
            fontWeight: "700",
            fontSize: "0.92rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
            background: formState === 1 ? "#111827" : "transparent",
            color: formState === 1 ? "#FFFFFF" : "var(--text-secondary)",
            boxShadow: formState === 1 ? "0 2px 8px rgba(0,0,0,0.15)" : "none"
          }}
        >
          Sign Up
        </button>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleAuth}>
        <div className="ramain-form-group">
          <label className="ramain-label">Username</label>
          <input
            type="text"
            required
            className="ramain-input"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="ramain-form-group">
          <label className="ramain-label">Password</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              type={showPassword ? "text" : "password"}
              required
              className="ramain-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: "44px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: "12px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: "10px", fontSize: "0.88rem", marginBottom: "16px", fontWeight: "600" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="btn-lime"
          style={{ width: "100%", padding: "14px", fontSize: "1rem", marginTop: "8px" }}
        >
          {isLoading ? "Please wait..." : (formState === 0 ? "Sign In to Account" : "Create Free Account")}
        </button>
      </form>

      {/* Footer Toggle */}
      <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.92rem", color: "var(--text-secondary)" }}>
        {formState === 0 ? "Don't have an account yet? " : "Already registered? "}
        <span
          onClick={() => setFormState(formState === 0 ? 1 : 0)}
          style={{ color: "#111827", fontWeight: "700", cursor: "pointer", textDecoration: "underline" }}
        >
          {formState === 0 ? "Sign up here" : "Sign in here"}
        </span>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div style={{ minHeight: "100vh", paddingBottom: "60px" }}>
      {/* Unified Navbar */}
      <Navbar />
      <Suspense fallback={<div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
