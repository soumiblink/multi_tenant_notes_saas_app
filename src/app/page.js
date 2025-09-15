"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.push("/login"); // redirect to your login page
  }, [router]);

  return null; // optional: could show a spinner
}
