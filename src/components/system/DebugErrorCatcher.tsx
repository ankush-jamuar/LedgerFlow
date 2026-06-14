/**
 * src/components/system/DebugErrorCatcher.tsx — DEBUG INSTRUMENT
 *
 * Temporary client component that installs global error and
 * unhandledrejection listeners on mount.
 *
 * Catches:
 *  - Unhandled Runtime Errors
 *  - React Errors (via error event)
 *  - Hydration Errors
 *  - Chunk Load Errors
 *  - Uncaught Promise Rejections
 *
 * Logs everything to console with [DEBUG_GLOBAL_ERROR] prefix.
 *
 * TODO: Remove after blank-screen root cause is identified.
 */

"use client";

import { useEffect } from "react";

export function DebugErrorCatcher() {
  useEffect(() => {
    console.log("[DEBUG_GLOBAL_ERROR] DebugErrorCatcher mounted — listening for errors");

    const handleError = (event: ErrorEvent) => {
      console.error("[DEBUG_GLOBAL_ERROR] window.onerror caught:");
      console.error("[DEBUG_GLOBAL_ERROR]   message:", event.message);
      console.error("[DEBUG_GLOBAL_ERROR]   filename:", event.filename);
      console.error("[DEBUG_GLOBAL_ERROR]   lineno:", event.lineno);
      console.error("[DEBUG_GLOBAL_ERROR]   colno:", event.colno);
      console.error("[DEBUG_GLOBAL_ERROR]   error:", event.error);

      // Detect specific error types
      if (event.message?.includes("Hydration")) {
        console.error("[DEBUG_GLOBAL_ERROR]   TYPE: HYDRATION ERROR");
      }
      if (event.message?.includes("ChunkLoadError") || event.message?.includes("Loading chunk")) {
        console.error("[DEBUG_GLOBAL_ERROR]   TYPE: CHUNK LOAD ERROR");
      }
      if (event.message?.includes("Minified React error")) {
        console.error("[DEBUG_GLOBAL_ERROR]   TYPE: REACT ERROR");
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("[DEBUG_GLOBAL_ERROR] unhandledrejection caught:");
      console.error("[DEBUG_GLOBAL_ERROR]   reason:", event.reason);
      if (event.reason?.stack) {
        console.error("[DEBUG_GLOBAL_ERROR]   stack:", event.reason.stack);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  // Render nothing — this is a listener-only component
  return null;
}
