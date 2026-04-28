import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types/user";
import { getAuthorizedSidebarSections } from "../utils/permissions";

interface Props {
  allowedRoles?: Role[];
  requiredSections?: string[];
}

export default function ProtectedRoute({ allowedRoles, requiredSections }: Props) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredSections && requiredSections.length > 0) {
    // SUPER_ADMIN always has access to all sections
    if (user.role === "SUPER_ADMIN") {
      return <Outlet />;
    }
    const authorizedSections = getAuthorizedSidebarSections(user.role);
    const hasAccess = requiredSections.some(sec =>
      authorizedSections.some(s => s.section === sec)
    );
    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
}