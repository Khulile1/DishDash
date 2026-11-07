import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import StatusPopup from "../components/common/StatusPopup";

const PopupContext = createContext(null);

const initialPopup = {
  isOpen: false,
  type: "success",
  title: "",
  message: "",
  details: "",
  primaryLabel: "Continue",
  secondaryLabel: "",
  onPrimary: null,
  onSecondary: null,
  dismissible: true,
  closeOnBackdrop: false,
};

export function PopupProvider({ children }) {
  const [popup, setPopup] = useState(initialPopup);

  const closePopup = useCallback(() => {
    setPopup(initialPopup);
  }, []);

  const showPopup = useCallback((options) => {
    setPopup({
      ...initialPopup,
      ...options,
      isOpen: true,
    });
  }, []);

  const showSuccess = useCallback(
    (options) => showPopup({ ...options, type: "success" }),
    [showPopup],
  );

  const showError = useCallback(
    (options) => showPopup({ ...options, type: "error" }),
    [showPopup],
  );

  const showWarning = useCallback(
    (options) => showPopup({ ...options, type: "warning" }),
    [showPopup],
  );

  const showInfo = useCallback(
    (options) => showPopup({ ...options, type: "info" }),
    [showPopup],
  );

  const handlePrimary = useCallback(() => {
    const action = popup.onPrimary;
    closePopup();
    action?.();
  }, [closePopup, popup.onPrimary]);

  const handleSecondary = useCallback(() => {
    const action = popup.onSecondary;
    closePopup();
    action?.();
  }, [closePopup, popup.onSecondary]);

  const contextValue = useMemo(
    () => ({
      showPopup,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      closePopup,
    }),
    [closePopup, showError, showInfo, showPopup, showSuccess, showWarning],
  );

  return (
    <PopupContext.Provider value={contextValue}>
      {children}

      <StatusPopup
        {...popup}
        onPrimary={handlePrimary}
        onSecondary={handleSecondary}
        onClose={closePopup}
      />
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const context = useContext(PopupContext);

  if (!context) {
    throw new Error("usePopup must be used inside PopupProvider.");
  }

  return context;
}
