import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudySphere — Collaborative Study Rooms & Synchronized Pomodoro",
  description:
    "Supercharge your focus with multi-peer video study rooms, real-time synchronized Pomodoro timer, collaborative note taking, and in-depth study analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
