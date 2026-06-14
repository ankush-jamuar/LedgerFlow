"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ERROR_BOUNDARY] caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", color: "#EF4444", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", margin: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Something went wrong in the Dashboard shell.</h2>
          <p style={{ fontSize: "0.875rem", color: "#9CA3AF", marginBottom: "1rem" }}>Please check the console for more details.</p>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "0.75rem", color: "#F87171" }}>{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
