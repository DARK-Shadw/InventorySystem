"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        padding: "10px 24px",
        background: "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        fontSize: "14px",
        cursor: "pointer",
        zIndex: 100,
      }}
      className="no-print"
    >
      Print / Save PDF
    </button>
  );
}
