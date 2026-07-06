"use client";

// Error boundaries must be client components — they use state to offer
// a retry via reset().
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: "20px" }}>
      <p style={{ color: "red" }}>{error.message || "Failed to fetch anime details"}</p>
      <button
        onClick={reset}
        style={{ padding: "8px 12px", borderRadius: "8px", cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}
