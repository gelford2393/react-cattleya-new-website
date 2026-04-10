import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export function RequireAdminAuth() {
  const location = useLocation();
  const { session, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-background text-foreground">
        <Spinner className="size-5" />
        <span className="text-sm font-medium">Checking admin session...</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
