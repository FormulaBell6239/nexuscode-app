import React from "react";

interface ProgressBarProps {
  value: number;      // Current progress (e.g. 3)
  max: number;        // Maximum value (e.g. 10)
  label?: string;     // Optional label to show above the bar
  color?: string;     // Optional color for the bar
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, label, color }) => {
  const percent = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ width: "100%", margin: "1rem 0" }}>
      {label && (
        <div style={{ marginBottom: "0.3rem", fontWeight: 600, color: "#93beff" }}>
          {label}
        </div>
      )}
      <div style={{
        background: "#42537d",
        borderRadius: "8px",
        height: "12px",
        width: "100%",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(127,156,245,0.10)"
      }}>
        <div style={{
          height: "100%",
          width: `${percent}%`,
          background: color || "linear-gradient(90deg, #0070f3 0%, #00bcd4 100%)",
          borderRadius: "8px",
          transition: "width 0.4s"
        }} />
      </div>
      <div style={{ textAlign: "right", fontSize: "0.95rem", color: "#93beff", marginTop: "0.2rem" }}>
        {value} / {max}
      </div>
    </div>
  );
};

export default ProgressBar;