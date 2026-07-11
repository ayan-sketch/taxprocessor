export default function Home() {
  return (
    <main style={{
      display: "flex",
      minHeight: "100vh",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2.25rem", fontWeight: "bold", marginBottom: "1rem" }}>
          Tax Processor
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#666" }}>
          Welcome to the tax processing system
        </p>
      </div>
    </main>
  );
}
