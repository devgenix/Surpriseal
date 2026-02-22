"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formatFirebaseError = (error: string) => {
    if (error.includes("auth/invalid-email")) return "Invalid email address format.";
    if (error.includes("auth/user-not-found")) return "No account found with this email.";
    if (error.includes("auth/too-many-requests")) return "Too many requests. Please try again later.";
    return error.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim();
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(formatFirebaseError(err.message || "Failed to send reset email"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive a password reset link"
    >
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-[#1b110e] mb-2">Forgot Password?</h1>
        <p className="text-[#97604e]">No worries, we&apos;ll send you reset instructions.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          Check your email! We&apos;ve sent a password reset link to <span className="font-bold">{email}</span>.
        </div>
      )}

      {!success && (
        <form className="flex flex-col gap-5" onSubmit={handleReset}>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-[#1b110e] ml-1">Email Address</span>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#97604e] text-[20px]">mail</span>
              <input 
                className="w-full rounded-2xl border-0 bg-white py-4 pl-11 pr-4 text-[#1b110e] shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-all" 
                placeholder="name@example.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </label>
          <button 
            className="mt-4 flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed" 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending link...</span>
              </div>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
      )}

      {success && (
        <Link 
          href="/login"
          className="mt-4 flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
        >
          Back to Log In
        </Link>
      )}

      <div className="mt-10 text-center">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm font-bold text-[#97604e] hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Login
        </Link>
      </div>

      <div className="mt-12 border-t border-gray-200 pt-6">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-[#97604e]">
          <Link className="hover:text-[#1b110e]" href="#">Terms of Service</Link>
          <Link className="hover:text-[#1b110e]" href="#">Privacy Policy</Link>
          <Link className="hover:text-[#1b110e]" href="#">Help Center</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
