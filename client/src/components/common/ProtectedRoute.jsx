// src/components/common/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { token, role } = useAuth();

  // not logged in -> go to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // logged in but wrong role -> send to their own dashboard
  if (allowedRoles && !allowedRoles.includes(role)) {
    const fallback = role === "admin" ? "/admin" : "/user";
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
