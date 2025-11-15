import ErrorBoundary from "./ErrorBoundary.jsx";

export default function App() {
  return (
    <ErrorBoundary>
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>UI Test ✅</h1>
        <p>ErrorBoundary is now active.</p>
      </div>
    </ErrorBoundary>
  );
}
