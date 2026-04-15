import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
      <Link
        href="/"
        className="mb-10 font-display text-lg font-semibold text-gymsanity-950 hover:text-gymsanity-800"
      >
        Gymsanity
      </Link>
      <Suspense fallback={<p className="text-center text-sm text-gymsanity-800">Loading…</p>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
