import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

interface ContentErrorBoundaryProps {
  error: string;
  contentType: "case" | "simulacrum";
  contentId: string;
  onRetry?: () => void;
}

/**
 * Dedicated error UI for content load failures in production.
 * Shows clear error message with retry and navigation options.
 */
export function ContentErrorBoundary({
  error,
  contentType,
  contentId,
  onRetry,
}: ContentErrorBoundaryProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full space-y-6">
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg">Content Load Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">
              Unable to load {contentType} content: <strong>{contentId}</strong>
            </p>
            <p className="text-sm opacity-80">{error}</p>
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-3">
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Loading
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate("/")} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          If this problem persists, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
