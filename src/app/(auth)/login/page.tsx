"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loginAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Leads CRM</CardTitle>
          <CardDescription>
            Sign in to manage AfterWayX prospecting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            action={(fd) => {
              startTransition(async () => {
                const res = await loginAction(fd);
                if (res?.error) setError(res.error);
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@afterwayx.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-zinc-500">
            No account?{" "}
            <Link href="/signup" className="text-zinc-900 underline">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
