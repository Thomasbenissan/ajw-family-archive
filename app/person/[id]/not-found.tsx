import Link from "next/link";

export default function PersonNotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f2ee",
        fontFamily: "'Inter', sans-serif",
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "#3d3832",
          marginBottom: 8,
        }}
      >
        Person not found
      </h1>
      <p style={{ fontSize: 14, color: "#8a8279", marginBottom: 20 }}>
        No one in this family tree matches that ID.
      </p>
      <Link
        href="/"
        style={{
          fontSize: 13,
          color: "#ffffff",
          backgroundColor: "#7c9a92",
          padding: "8px 18px",
          borderRadius: 6,
          textDecoration: "none",
          fontWeight: 500,
        }}
      >
        ← Back to family tree
      </Link>
    </div>
  );
}
