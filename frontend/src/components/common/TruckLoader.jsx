// ======================================
// IMPORTS
// ======================================

import { useEffect, useRef, useState } from "react";

import { Truck } from "lucide-react";

import "../../styles/TruckLoader.css";

// ======================================
// TRUCK LOADER
// ======================================

function TruckLoader() {
  // ======================================
  // ACTIVE API REQUESTS
  // ======================================

  const [activeRequests, setActiveRequests] = useState(0);

  // ======================================
  // VISIBILITY
  // ======================================

  const [visible, setVisible] = useState(false);

  // ======================================
  // TRUCK PROGRESS
  // ======================================

  const [progress, setProgress] = useState(4);

  // ======================================
  // TIMER REFERENCES
  // ======================================

  const progressTimer = useRef(null);

  const hideTimer = useRef(null);

  const showTimer = useRef(null);

  // ======================================
  // LISTEN FOR API EVENTS
  // ======================================

  useEffect(() => {
    const handleStart = () => {
      setActiveRequests((current) => current + 1);
    };

    const handleEnd = () => {
      setActiveRequests((current) => Math.max(current - 1, 0));
    };

    window.addEventListener("api-loading-start", handleStart);

    window.addEventListener("api-loading-end", handleEnd);

    return () => {
      window.removeEventListener("api-loading-start", handleStart);

      window.removeEventListener("api-loading-end", handleEnd);
    };
  }, []);

  // ======================================
  // HANDLE REQUEST STATE
  // ======================================

  useEffect(() => {
    // ======================================
    // API IS BUSY
    // ======================================

    if (activeRequests > 0) {
      // Cancel hide timer
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      // Avoid loader flashing for
      // extremely fast requests.
      if (!visible && !showTimer.current) {
        showTimer.current = setTimeout(() => {
          setVisible(true);

          setProgress((current) => (current >= 90 ? 4 : current));

          showTimer.current = null;
        }, 120);
      }

      return;
    }

    // ======================================
    // API FINISHED
    // ======================================

    if (showTimer.current) {
      clearTimeout(showTimer.current);

      showTimer.current = null;
    }

    if (visible) {
      // Send truck to destination
      setProgress(100);

      hideTimer.current = setTimeout(() => {
        setVisible(false);

        setProgress(4);
      }, 280);
    }
  }, [activeRequests, visible]);

  // ======================================
  // MOVE TRUCK WHILE WAITING
  // ======================================

  useEffect(() => {
    if (!visible || activeRequests === 0) {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);

        progressTimer.current = null;
      }

      return;
    }

    progressTimer.current = setInterval(() => {
      setProgress((current) => {
        // Never reach the destination
        // until the backend responds.
        if (current >= 88) {
          return current;
        }

        // Move quicker at the start
        // and slower near the end.
        const remaining = 88 - current;

        const movement = Math.max(remaining * 0.08, 0.4);

        return Math.min(current + movement, 88);
      });
    }, 100);

    return () => {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);

        progressTimer.current = null;
      }
    };
  }, [visible, activeRequests]);

  // ======================================
  // CLEANUP
  // ======================================

  useEffect(() => {
    return () => {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }

      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      if (showTimer.current) {
        clearTimeout(showTimer.current);
      }
    };
  }, []);

  // ======================================
  // HIDDEN
  // ======================================

  if (!visible) {
    return null;
  }

  // ======================================
  // LOADER
  // ======================================

  return (
    <div
      className="truck-loader-overlay"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="truck-loader">
        {/* ROAD */}

        <div className="truck-loader-road">
          <div className="truck-loader-road-line" />

          {/* TRUCK */}

          <div
            className="truck-loader-truck"
            style={{
              left: `${progress}%`,
            }}
          >
            <div className="truck-loader-truck-icon">
              <Truck size={31} strokeWidth={2.3} />
            </div>

            {/* SHADOW */}

            <span className="truck-loader-shadow" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TruckLoader;
