"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { 
  User, 
  Mail, 
  Camera, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Shield,
  CreditCard,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
      setLoading(false);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Update Auth Profile
      await updateProfile(user, {
        displayName,
        photoURL
      });

      // Update Firestore
      const userRef = doc(db!, "users", user.uid);
      await updateDoc(userRef, {
        displayName,
        photoURL,
        updatedAt: new Date()
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] dark:bg-[#1b110e] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary size-8" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Back Button */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-[#97604e] hover:text-primary transition-colors text-sm font-bold mb-8"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-white/5 rounded-lg p-8 border border-[#e7d6d0] shadow-sm flex flex-col items-center">
              <div className="relative group mb-6">
                <div className="size-32 rounded-full bg-primary/10 border-4 border-white dark:border-[#2a1d19] shadow-md flex items-center justify-center text-primary overflow-hidden">
                  {photoURL ? (
                    <img src={photoURL} alt={displayName} className="size-full object-cover" />
                  ) : (
                    <User size={64} strokeWidth={1.5} />
                  )}
                </div>
                <button className="absolute bottom-1 right-1 size-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#2a1d19] hover:scale-110 transition-transform cursor-pointer">
                  <Camera size={18} />
                </button>
              </div>
              
              <h2 className="text-xl font-bold text-[#1b110e] dark:text-white text-center mb-1">
                {displayName || "User"}
              </h2>
              <p className="text-sm text-[#97604e] font-medium mb-6">{user?.email}</p>
              
              <div className="w-full pt-6 border-t border-[#f3eae7] dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#97604e] font-medium">Account Status</span>
                  <span className="flex items-center gap-1.5 text-green-600 font-bold">
                    <CheckCircle2 size={14} />
                    Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary to-orange-600 rounded-lg p-6 text-white shadow-lg overflow-hidden relative">
              <Sparkles className="absolute -right-4 -top-4 size-24 opacity-20 rotate-12" />
              <h3 className="font-bold mb-2 relative z-10">Premium Experience</h3>
              <p className="text-sm text-white/80 mb-4 relative z-10 leading-relaxed font-medium">
                Get more from Surpriseal with personalized domains, scheduled reveals, and premium templates.
              </p>
              <Button className="w-full bg-white text-primary hover:bg-white/90 font-bold shadow-sm relative z-10 h-10">
                View Pricing
              </Button>
            </div>
          </div>

          {/* Right Column: Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-white/5 rounded-lg border border-[#e7d6d0] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-[#f3eae7] dark:border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#1b110e] dark:text-white">Profile Settings</h3>
                  <p className="text-xs text-[#97604e] font-medium">Manage your public information and account details.</p>
                </div>
                {success && (
                  <div className="flex items-center gap-2 text-green-600 animate-in fade-in slide-in-from-right-2">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-bold uppercase tracking-tight">Saved!</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-8">
                <div className="space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-[#1b110e] dark:text-white uppercase tracking-wider ml-1">
                      Display Name
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="text-[#97604e] group-focus-within:text-primary transition-colors h-5 w-5" />
                      </div>
                      <input 
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-[#fcf9f8] dark:bg-white/5 border border-[#e7d6d0] rounded-lg text-[#1b110e] dark:text-white placeholder:text-[#97604e]/40 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-medium"
                        placeholder="e.g. Sarah Jenkins"
                      />
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-[#1b110e]/50 dark:text-white/50 uppercase tracking-wider ml-1">
                      Email Address
                    </label>
                    <div className="relative opacity-60">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="text-[#97604e] h-5 w-5" />
                      </div>
                      <input 
                        type="email"
                        value={user?.email || ""}
                        readOnly
                        className="w-full h-14 pl-12 pr-4 bg-[#fcf9f8] dark:bg-white/5 border border-[#e7d6d0] rounded-lg text-[#1b110e] dark:text-white outline-none font-medium cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-[#97604e] font-medium ml-1">Email cannot be changed directly. Contact support for assistance.</p>
                  </div>

                  {/* Photo URL */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-[#1b110e] dark:text-white uppercase tracking-wider ml-1">
                      Profile Picture URL
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Camera className="text-[#97604e] group-focus-within:text-primary transition-colors h-5 w-5" />
                      </div>
                      <input 
                        type="url"
                        value={photoURL}
                        onChange={(e) => setPhotoURL(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-[#fcf9f8] dark:bg-white/5 border border-[#e7d6d0] rounded-lg text-[#1b110e] dark:text-white placeholder:text-[#97604e]/40 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-medium"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center gap-3 text-red-600 text-sm font-medium">
                    <AlertCircle size={20} />
                    {error}
                  </div>
                )}

                <div className="pt-4 flex items-center gap-4">
                  <Button 
                    type="submit"
                    disabled={saving}
                    className="h-12 px-8 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 transform active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin size-4" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Security Section Placeholder */}
            <div className="bg-white dark:bg-white/5 rounded-lg border border-[#e7d6d0] shadow-sm p-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Shield size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-[#1b110e] dark:text-white">Security & Password</h4>
                  <p className="text-xs text-[#97604e] font-medium">Update your password and secure your account.</p>
                </div>
              </div>
              <Button variant="outline" className="h-10 rounded-lg border-[#e7d6d0] text-xs font-bold px-6">
                Manage
              </Button>
            </div>
          </div>
        </div>
    </div>
  );
}
