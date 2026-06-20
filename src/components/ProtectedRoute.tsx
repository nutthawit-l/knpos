import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#fff8f8] font-quicksand text-text-brown">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-[16px]">Loading Charni POS...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
