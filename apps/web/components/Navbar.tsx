"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StudySphereLogoIcon from "./StudySphereLogoIcon";

export function Navbar() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  return (
    <div className="ramain-navbar-wrapper">
      <nav className="ramain-navbar">
        {/* Brand Logo (StudySphere Icon + Text) */}
        <Link
          href="/"
          className="ramain-logo"
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          <StudySphereLogoIcon size={38} />
          <span>StudySphere</span>
        </Link>

        {/* Center Nav Links */}
        <div className="ramain-nav-links">
          <Link href="/" className="ramain-nav-link">
            Platform
          </Link>
          <span
            onClick={() => {
              const el = document.getElementById("features");
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
              } else {
                router.push("/#features");
              }
            }}
            className="ramain-nav-link"
            style={{ cursor: "pointer" }}
          >
            Features
          </span>
          {isAuthenticated ? (
            <Link href="/history" className="ramain-nav-link">
              Study History
            </Link>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="ramain-nav-actions">
          {isAuthenticated ? (
            <>
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#111827",
                  background: "#F3F4F6",
                  padding: "6px 14px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span className="vector-pulse-dot"></span>
                {user?.username || "Student"}
              </span>
              <button
                type="button"
                className="btn-lime"
                onClick={() => router.push("/")}
              >
                Study Hall →
              </button>
              <button
                type="button"
                className="btn-dark"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-outline"
                onClick={() => router.push("/auth")}
              >
                Sign In
              </button>
              <button
                type="button"
                className="btn-lime"
                onClick={() => router.push("/auth")}
              >
                Get Started →
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
