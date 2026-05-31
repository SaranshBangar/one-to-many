"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { Spinner } from "@/components/ui/misc";

export function SignOutClient() {
  const { signOut } = useClerk();
  useEffect(() => {
    signOut({ redirectUrl: "/" });
  }, [signOut]);
  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-muted">
      <Spinner /> Signing out…
    </div>
  );
}
