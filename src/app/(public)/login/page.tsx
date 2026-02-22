"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const redirectPath = searchParams?.get('redirect') || "/dashboard";

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectPath);
    }
  }, [user, authLoading, router, redirectPath]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const formatFirebaseError = (error: string) => {
    if (error.includes("auth/invalid-credential")) return "Invalid email or password.";
    if (error.includes("auth/user-not-found")) return "No account found with this email.";
    if (error.includes("auth/wrong-password")) return "Incorrect password.";
    if (error.includes("auth/too-many-requests")) return "Too many failed attempts. Please try again later.";
    return error.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      router.push(redirectPath);
    } catch (err: any) {
      setError(formatFirebaseError(err.message || "Failed to log in"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.push(redirectPath);
    } catch (err: any) {
      setError(formatFirebaseError(err.message || "Google login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your account to continue."
    >
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-[#1b110e] mb-2">Welcome to Supriseal</h1>
        <p className="text-[#97604e]">Log in to your account to continue.</p>
      </div>

      <div className="mb-8">
        <div className="flex rounded-2xl bg-gray-100 p-1.5">
          <Link href={`/signup${redirectPath !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`} className="w-1/2 py-2.5 text-center text-sm font-semibold text-[#97604e] hover:text-[#1b110e] transition-colors">Sign Up</Link>
          <div className="w-1/2 rounded-xl bg-white py-2.5 text-center text-sm font-bold text-[#1b110e] shadow-sm">Log In</div>
        </div>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleLogin}>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-[#1b110e] ml-1">Email Address</span>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#97604e] text-[20px]">mail</span>
            <input 
              className="w-full rounded-2xl border-0 bg-white py-3.5 pl-11 pr-4 text-[#1b110e] shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-all" 
              placeholder="name@example.com" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center ml-1">
            <span className="text-sm font-semibold text-[#1b110e]">Password</span>
            <Link href="/forgot-password" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Forgot Password?</Link>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#97604e] text-[20px]">lock</span>
            <input 
              className="w-full rounded-2xl border-0 bg-white py-3.5 pl-11 pr-12 text-[#1b110e] shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-all" 
              placeholder="••••••••" 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#97604e] hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </label>

        <button 
          className="mt-2 flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed" 
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Logging in...</span>
            </div>
          ) : (
            "Log In"
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#f8f6f6] px-4 text-[#97604e] font-medium tracking-wider">Or continue with</span></div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          className="flex items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-[#1b110e] shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-[#97604e]">
          Don&apos;t have an account?{" "}
          <Link href={`/signup${redirectPath !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`} className="font-bold text-primary hover:text-primary/80 transition-colors">Sign up here</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
