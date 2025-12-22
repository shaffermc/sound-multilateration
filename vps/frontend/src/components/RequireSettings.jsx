
import { Navigate } from "react-router-dom";

export default function RequireSettings({ children }) {
  // TEMP: fake access flag
  const hasAccess = localStorage.getItem("secret") === "true";

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}
