import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/env";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <Logo />
      {isClerkConfigured ? (
        <SignUp signInUrl="/sign-in" forceRedirectUrl="/dashboard" />
      ) : (
        <DemoCard />
      )}
    </div>
  );
}

function DemoCard() {
  return (
    <Card className="w-full max-w-sm text-center">
      <h1 className="text-xl font-bold">Start your free trial</h1>
      <p className="mt-2 text-sm text-muted">
        Auth isn&apos;t configured, so you&apos;ll jump straight into a demo
        founder account. Add Clerk keys to{" "}
        <code className="text-accent">.env.local</code> for real sign-up.
      </p>
      <Link href="/dashboard" className="mt-6 block">
        <Button size="lg" className="w-full">
          Enter the app
        </Button>
      </Link>
    </Card>
  );
}
