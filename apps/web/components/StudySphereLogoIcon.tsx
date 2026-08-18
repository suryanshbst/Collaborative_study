import React, { type CSSProperties } from "react";

interface StudySphereLogoIconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export default function StudySphereLogoIcon({
  size = 36,
  className = "",
  style = {},
}: StudySphereLogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", flexShrink: 0, ...style }}
    >
      <circle cx="20" cy="20" r="18" fill="#111827" stroke="#374151" strokeWidth="1.5" />
      {/* Orbital Study Sphere Rings */}
      <ellipse
        cx="20"
        cy="20"
        rx="14"
        ry="6"
        stroke="#C5FF4A"
        strokeWidth="2"
        strokeDasharray="4 2"
        transform="rotate(-25 20 20)"
      />
      <ellipse
        cx="20"
        cy="20"
        rx="14"
        ry="6"
        stroke="#38BDF8"
        strokeWidth="2"
        transform="rotate(35 20 20)"
      />
      {/* Core Node */}
      <circle cx="20" cy="20" r="4.5" fill="#C5FF4A" />
      <circle cx="20" cy="20" r="2" fill="#111827" />
      {/* Small satellite particle */}
      <circle cx="31" cy="14" r="2" fill="#38BDF8" />
    </svg>
  );
}
