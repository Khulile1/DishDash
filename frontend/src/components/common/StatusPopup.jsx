import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, Info, X } from "lucide-react";

import "../../styles/StatusPopup.css";

const popupIcons = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
};

function StatusPopup({
  isOpen,
  type = "success",
  title,
  message,
  details,
  primaryLabel = "Continue",
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
  dismissible = true,
  closeOnBackdrop = false,

  // Automatically close after 3 seconds.
  // Set to 0 to disable automatic closing.
  autoCloseDuration = 3000,
}) {
  const dialogRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const onCloseRef = useRef(onClose);

  // ======================================
  // KEEP THE LATEST CLOSE CALLBACK
  // ======================================

  // Updating the callback does not restart the countdown.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // ======================================
  // FOCUS AND KEYBOARD HANDLING
  // ======================================

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return undefined;
    }

    previousActiveElementRef.current = document.activeElement;

    document.body.classList.add("status-popup-open");

    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && dismissible) {
        onCloseRef.current?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);

      document.body.classList.remove("status-popup-open");

      document.removeEventListener("keydown", handleKeyDown);

      previousActiveElementRef.current?.focus?.();
    };
  }, [dismissible, isOpen]);

  // ======================================
  // AUTOMATICALLY CLOSE AFTER 3 SECONDS
  // ======================================

  useEffect(() => {
    if (
      !isOpen ||
      typeof window === "undefined" ||
      !Number.isFinite(autoCloseDuration) ||
      autoCloseDuration <= 0
    ) {
      return undefined;
    }

    const closeTimer = window.setTimeout(() => {
      onCloseRef.current?.();
    }, autoCloseDuration);

    // Cancel the old timer when closing, unmounting,
    // or displaying a different popup message.
    return () => {
      window.clearTimeout(closeTimer);
    };
  }, [isOpen, autoCloseDuration, type, title, message]);

  // ======================================
  // DO NOT RENDER WHEN CLOSED
  // ======================================

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const Icon = popupIcons[type] ?? Info;

  const titleId = "status-popup-title";
  const messageId = "status-popup-message";

  // ======================================
  // BACKDROP CLICK
  // ======================================

  const handleBackdropClick = (event) => {
    if (
      closeOnBackdrop &&
      dismissible &&
      event.target === event.currentTarget
    ) {
      onClose?.();
    }
  };

  // ======================================
  // POPUP
  // ======================================

  return createPortal(
    <div
      className="status-popup-backdrop"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <section
        ref={dialogRef}
        className={`status-popup status-popup--${type}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
      >
        {/* CLOSE BUTTON */}

        {dismissible && (
          <button
            type="button"
            className="status-popup__close"
            onClick={onClose}
            aria-label="Close message"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}

        {/* ICON */}

        <div className="status-popup__icon" aria-hidden="true">
          <Icon size={34} strokeWidth={2.4} />
        </div>

        {/* CONTENT */}

        <div className="status-popup__content">
          <h2 id={titleId} className="status-popup__title">
            {title}
          </h2>

          <p id={messageId} className="status-popup__message">
            {message}
          </p>

          {details && (
            <div className="status-popup__details" role="status">
              {details}
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}

        <div className="status-popup__actions">
          {secondaryLabel && (
            <button
              type="button"
              className="status-popup__button status-popup__button--secondary"
              onClick={onSecondary}
            >
              {secondaryLabel}
            </button>
          )}

          <button
            type="button"
            className="status-popup__button status-popup__button--primary"
            onClick={onPrimary}
          >
            {primaryLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export default StatusPopup;
