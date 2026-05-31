import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/env";
import { SignOutClient } from "@/components/sign-out-client";

export default function SignOutPage() {
  // In mock mode there's no ClerkProvider, so just go home.
  if (!isClerkConfigured) redirect("/");
  return <SignOutClient />;
}
