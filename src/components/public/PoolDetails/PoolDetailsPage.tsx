import { HomePage } from "@/components/public/Home";
import { Navigate, useParams } from "react-router-dom";

export function PoolDetailsPage() {
  const { poolId } = useParams();

  if (!poolId) {
    return <Navigate to="/" replace />;
  }

  return <HomePage selectedPoolId={poolId} />;
}
