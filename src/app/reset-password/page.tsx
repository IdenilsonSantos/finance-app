"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Redirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  useEffect(() => {
    router.replace(token ? `/auth/reset-password?token=${token}` : "/auth/reset-password");
  }, [router, token]);
  return null;
}

export default function Page() {
  return <Suspense fallback={null}><Redirect /></Suspense>;
}
