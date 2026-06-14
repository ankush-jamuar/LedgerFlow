/**
 * src/components/system/DashboardErrorBoundary.tsx — DEBUG INSTRUMENT
 *
 * Temporary React Error Boundary placed inside the dashboard layout
 * to catch and log any component render errors that would otherwise
 * produce a blank screen silently.
 *
 * TODO: Remove after blank-screen root cause is identified.
 */

"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class DashboardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    console.error("[DASHBOARD_ERROR_BOUNDARY] getDerivedStateFromError:", error.message);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[DASHBOARD_ERROR_BOUNDARY] componentDidCatch");
    console.error("[DASHBOARD_ERROR_BOUNDARY] Error:", error);
    console.error("[DASHBOARD_ERROR_BOUNDARY] Error message:", error.message);
    console.error("[DASHBOARD_ERROR_BOUNDARY] Error stack:", error.stack);
    console.error("[DASHBOARD_ERROR_BOUNDARY] Component stack:", errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            margin: "2rem",
            background: "#1a0000",
            border: "2px solid #ff4444",
            borderRadius: "8px",
            color: "#ff8888",
            fontFamily: "monospace",
            fontSize: "14px",
          }}
        >
          <h2 style={{ color: "#ff4444", marginBottom: "1rem" }}>
            [DEBUG] Dashboard Error Boundary Caught an Error
          </h2>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {this.state.error?.message}
          </pre>
          <details style={{ marginTop: "1rem" }}>
            <summary style={{ cursor: "pointer", color: "#ffaaaa" }}>
              Full Stack Trace
            </summary>
            <pre style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem", fontSize: "12px" }}>
              {this.state.error?.stack}
            </pre>
            {this.state.errorInfo && (
              <pre style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem", fontSize: "12px" }}>
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </details>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
            }}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Retry Render
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
