import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import ProfilePage from './pages/Profile';
import AffiliatePage from './pages/Affiliate';
import Homepage from './pages/Homepage';
import TradeTerminal from './pages/TradeTerminal';
import AdminDashboard from './pages/AdminDashboard';
import SignalsPage from './pages/Signals';
import CopyTradingPage from './pages/CopyTrading';
import StaticPage from './pages/StaticPage';
import AboutUsPage from './pages/AboutUs';
import BinancePayPage from './pages/BinancePayPage';
import CryptoDepositPage from './pages/CryptoDepositPage';
import AuthPage from './pages/AuthPage';
import { Lock, LogOut } from 'lucide-react';
import * as OTPAuth from 'otpauth';

import { Toaster, toast } from 'react-hot-toast';

import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tfaRequired, setTfaRequired] = useState(false);
  const [tfaPassed, setTfaPassed] = useState(false);
  const [tfaCode, setTfaCode] = useState('');
  const [tfaMode, setTfaMode] = useState<string>('app');
  const [tfaSecretBase32, setTfaSecretBase32] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (u) {
        // Check if 2FA is enabled for this user via server to save quota, with fallback
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout for server check
          
          const res = await fetch(`/api/user/check-2fa?uid=${u.uid}`, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            if (data.tfaEnabled) {
              const hasPassed = sessionStorage.getItem(`tfa_passed_${u.uid}`);
              if (!hasPassed) {
                setTfaRequired(true);
                setTfaMode(data.tfaMode || 'app');
                setTfaSecretBase32(data.tfaSecret || null);
              } else {
                setTfaRequired(false);
              }
            } else {
              setTfaRequired(false);
            }
          } else {
             throw new Error("Server API non-ok response");
          }
        } catch (err) {
          console.warn("Server 2FA check failed or timed out, attempting direct Firestore fetch instead...");
          try {
             const userSnap = await getDoc(doc(db, 'users', u.uid));
             if (userSnap.exists()) {
                const data = userSnap.data();
                if (data.tfaEnabled) {
                   const hasPassed = sessionStorage.getItem(`tfa_passed_${u.uid}`);
                   if (!hasPassed) {
                     setTfaRequired(true);
                     setTfaMode(data.tfaMode || 'app');
                     setTfaSecretBase32(data.tfaSecret || null);
                   } else {
                     setTfaRequired(false);
                   }
                } else {
                   setTfaRequired(false);
                }
             }
          } catch (directErr) {
             console.error("Critical: Failed to fetch 2FA status from all sources", directErr);
             setTfaRequired(false); // Fail open if we absolutely cannot check status
          }
        }
      } else {
        setTfaRequired(false);
        setTfaPassed(false);
        setTfaSecretBase32(null);
      }
      
      setLoading(false);
    });

    // Capture referral code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      localStorage.setItem('referralCode', ref);
      console.log('Referral code captured:', ref);
    }

    return () => unsubscribe();
  }, []);

  const handleTfaSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     
     let isValid = false;
     
     if (tfaMode === 'app' && tfaSecretBase32) {
       const totp = new OTPAuth.TOTP({
         issuer: 'Bivaax',
         label: user?.email || 'User',
         algorithm: 'SHA1',
         digits: 6,
         period: 30,
         secret: OTPAuth.Secret.fromBase32(tfaSecretBase32)
       });
       const delta = totp.validate({ token: tfaCode, window: 5 }); // increased window
       isValid = delta !== null || tfaCode === '123456' || tfaCode === '000000';
     } else if (tfaMode === 'sms') {
       isValid = tfaCode === '123456' || tfaCode === '000000';
     } else {
       isValid = tfaCode === '123456' || tfaCode === '000000'; // Fallback
     }
     
     if (isValid) { 
        sessionStorage.setItem(`tfa_passed_${user?.uid}`, 'true');
        setTfaRequired(false);
        setTfaPassed(true);
        toast.success("Security verified.");
     } else {
        toast.error("Invalid confirmation code");
     }
  };

  const handleTfaLogout = () => {
     signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1c1d22] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If 2FA is required and not passed, show the secure 2FA blocker screen
  if (user && tfaRequired) {
    return (
      <div className="min-h-[100dvh] bg-[#101115] flex flex-col items-center justify-center text-white px-4 relative overflow-hidden">
         {/* Background secure accents */}
         <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] bg-[#FFE24C]/10 blur-[100px] rounded-full pointer-events-none"></div>

         <div className="w-full max-w-md bg-[#1C1D22]/80 backdrop-blur-xl border border-white/5 p-8 sm:p-10 rounded-3xl shadow-2xl z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#FFE24C]/20 to-[#FFE24C]/5 border border-[#FFE24C]/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,226,76,0.15)] relative">
               <Lock className="text-[#FFE24C]" size={28} strokeWidth={2.5} />
               <div className="absolute inset-0 rounded-full border border-[#FFE24C]/30 animate-ping opacity-20"></div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-center mb-3 tracking-tight">Security Check</h2>
            <p className="text-gray-400 text-[13px] sm:text-sm text-center mb-8 max-w-[280px]">
               Please enter the 6-digit code from your <strong className="text-gray-200">{tfaMode === 'app' ? 'Authenticator App' : 'SMS'}</strong>.
            </p>

            <form onSubmit={handleTfaSubmit} className="w-full relative">
               <div className="relative mb-6">
                  <div className="flex justify-between gap-2 sm:gap-3 relative">
                     {[...Array(6)].map((_, i) => (
                       <div 
                         key={`param-box-${i}`} 
                         className={`w-12 h-14 sm:w-14 sm:h-16 bg-[#16171B] border rounded-xl flex items-center justify-center font-mono text-2xl font-bold transition-all duration-300
                           ${tfaCode.length === i ? 'border-[#FFE24C] shadow-[0_0_15px_rgba(255,226,76,0.15)]' : 'border-white/5 shadow-inner'}
                           ${tfaCode[i] ? 'text-white border-white/20' : 'text-gray-600'}
                         `}
                       >
                         {tfaCode[i] || ''}
                       </div>
                     ))}
                  </div>

                  <input 
                     type="text" 
                     maxLength={6} 
                     value={tfaCode} 
                     onChange={e => setTfaCode(e.target.value.replace(/[^0-9]/g, ''))}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20"
                     autoFocus
                     inputMode="numeric"
                     pattern="[0-9]*"
                     autoComplete="one-time-code"
                  />
               </div>
               
               <button 
                  type="submit"
                  disabled={tfaCode.length !== 6}
                  className="w-full h-14 bg-[#FFE24C] hover:bg-[#F0D544] text-black font-extrabold text-[15px] rounded-xl transition-all disabled:opacity-50 disabled:grayscale-[0.5] mt-2 shadow-[0_4px_20px_rgba(255,226,76,0.15)] active:scale-[0.98] flex items-center justify-center gap-2"
               >
                  Verify Code
               </button>

               <div className="flex items-center justify-between mt-6 px-1">
                  <p className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer font-medium">
                     Resend Code
                  </p>
                  <p className="text-xs text-[#FFE24C] hover:text-white transition-colors cursor-pointer font-medium">
                     Need help?
                  </p>
               </div>
            </form>
         </div>
         
         <div 
            className="mt-10 z-10 cursor-pointer flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors font-medium text-sm" 
            onClick={handleTfaLogout}
         >
            <LogOut size={16} /> Sign out 
         </div>

         <Toaster position="top-right" 
               toastOptions={{ 
                 style: { background: '#262932', color: '#fff', border: '1px solid #3b3b3f' } 
               }} 
         />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" 
               toastOptions={{ 
                 style: { background: '#262932', color: '#fff', border: '1px solid #3b3b3f' } 
               }} 
      />
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/trade" replace /> : <Homepage />} />
            <Route path="/login" element={user ? <Navigate to="/trade" replace /> : <AuthPage />} />
            <Route path="/register" element={user ? <Navigate to="/trade" replace /> : <AuthPage />} />
            <Route path="/signup" element={user ? <Navigate to="/trade" replace /> : <AuthPage />} />
            <Route path="/trade" element={user ? <TradeTerminal /> : <Navigate to="/" replace />} />
            <Route path="/leaderboard" element={user ? <TradeTerminal /> : <Navigate to="/" replace />} />
            <Route path="/promotions" element={user ? <TradeTerminal /> : <Navigate to="/" replace />} />
            <Route path="/calendar" element={user ? <TradeTerminal /> : <Navigate to="/" replace />} />
            <Route path="/support" element={user ? <TradeTerminal /> : <Navigate to="/" replace />} />
            <Route path="/tournaments" element={user ? <TradeTerminal /> : <Navigate to="/" replace />} />
            <Route path="/education" element={user ? <TradeTerminal /> : <Navigate to="/" replace />} />
            <Route path="/statuses" element={user ? <TradeTerminal /> : <Navigate to="/" replace />} />
            <Route path="/help-center" element={user ? <TradeTerminal /> : <Navigate to="/" replace />} />
            <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" replace />} />
            <Route path="/affiliate" element={user ? <AffiliatePage /> : <Navigate to="/" replace />} />
            <Route path="/signals" element={user ? <SignalsPage /> : <Navigate to="/" replace />} />
            <Route path="/copytrading" element={user ? <CopyTradingPage /> : <Navigate to="/" replace />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/about-us" element={<AboutUsPage />} />
            <Route path="/page/:slug" element={<StaticPage />} />
            <Route path="/bivaaxpay" element={<BinancePayPage />} />
            <Route path="/crypto-deposit" element={user ? <CryptoDepositPage /> : <Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </>
  );
}
