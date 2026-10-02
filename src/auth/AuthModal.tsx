import React, { useState } from 'react';
import {
  UserProfile,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  loginAsGuest,
  logoutUser,
  isFirebaseConfigured,
} from '../firebase/config';
import {
  X,
  LogIn,
  LogOut,
  User,
  Mail,
  Lock,
  Sparkles,
  ShieldCheck,
  Flame,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChange?: (user: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await loginWithGoogle();
      setSuccessMsg('Successfully connected via Google Auth!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Google authentication was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in both email and password.');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      if (mode === 'register') {
        await registerWithEmail(email, password);
        setSuccessMsg('Account registered successfully!');
      } else {
        await loginWithEmail(email, password);
        setSuccessMsg('Signed in successfully!');
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await loginAsGuest();
      setSuccessMsg('Signed in as Guest Architect.');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Could not sign in anonymously.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await logoutUser();
      setSuccessMsg('Signed out.');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign out failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Firebase Authentication</h2>
              <p className="text-xs text-slate-400">Sync projects, backups & cloud databases</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Avatar'}
                    className="w-12 h-12 rounded-full border border-orange-500/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-lg border border-orange-500/30">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="font-medium text-white truncate">
                    {currentUser.displayName || 'Authenticated Developer'}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {currentUser.email || 'Anonymous / Guest Session'}
                  </div>
                  <div className="text-[10px] text-orange-400/80 font-mono mt-0.5 truncate">
                    UID: {currentUser.uid}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Cloud Firestore Sync Active</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Projects saved in this session automatically persist to your secure Firestore partition.
                </div>
              </div>

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Google OAuth Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider">or with email</span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              {/* Email/Password form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="developer@example.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  {mode === 'login' ? 'Sign In with Email' : 'Create Free Account'}
                </button>
              </form>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="hover:text-orange-400 transition"
                >
                  {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>

                <button
                  type="button"
                  onClick={handleGuestSignIn}
                  disabled={loading}
                  className="text-slate-500 hover:text-slate-300 transition"
                >
                  Guest Mode
                </button>
              </div>

              {!isFirebaseConfigured && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
                  <strong>Notice:</strong> Running in local sandbox mode. Configure <code className="bg-amber-950/40 px-1 py-0.5 rounded">VITE_FIREBASE_API_KEY</code> in <code className="bg-amber-950/40 px-1 py-0.5 rounded">.env</code> for direct live cloud syncing.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
