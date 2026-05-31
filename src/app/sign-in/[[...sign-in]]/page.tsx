import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/env";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <Logo />
      {isClerkConfigured ? (
        <SignIn signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
      ) : (
        <DemoCard />
      )}
    </div>
  );
}

function DemoCard() {
  return (
    <Card className="w-full max-w-sm text-center">
      <h1 className="text-xl font-bold">Demo mode</h1>
      <p className="mt-2 text-sm text-muted">
        Auth isn&apos;t configured, so you&apos;re signed in as a demo founder.
        Add Clerk keys to <code className="text-accent">.env.local</code> to
        enable real login.
      </p>
      <Link href="/dashboard" className="mt-6 block">
        <Button size="lg" className="w-full">
          Continue to dashboard
        </Button>
      </Link>
    </Card>
  );
}
