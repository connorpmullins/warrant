"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, XCircle } from "lucide-react";
import Link from "next/link";

function getErrorMessage(error: string | null, token: string | null): string | null {
  if (error) {
    switch (error) {
      case "missing_token":
        return "No verification token provided.";
      case "invalid_token":
        return "This link is invalid or has expired. Please request a new one.";
      case "verification_failed":
        return "Verification failed. Please try again.";
      default:
        return "An unexpected error occurred.";
    }
  }
  if (!token) {
    return "No verification token provided.";
  }
  return null;
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");
  const errorMessage = getErrorMessage(error, token);
  const status = errorMessage ? "error" : "loading";

  useEffect(() => {
    if (!errorMessage && token) {
      // The actual verification happens server-side at /api/auth/verify
      // If we're here with a token and no error, redirect to the API route
      window.location.href = `/api/auth/verify?token=${encodeURIComponent(token)}`;
    }
  }, [token, errorMessage]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {status === "loading" && "Verifying..."}
            {status === "error" && "Verification Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Verifying your magic link...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <p className="text-muted-foreground">{errorMessage}</p>
              <Link
                href="/auth/login"
                className="inline-block mt-4 text-sm font-medium underline underline-offset-4 hover:text-primary"
              >
                Back to login
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
