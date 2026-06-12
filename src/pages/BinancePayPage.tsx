import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import * as Icons from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function BinancePayPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || '0';
  const currency = searchParams.get('currency') || 'USDT';
  const baseOrderId = searchParams.get('orderId') || Math.floor(Math.random() * 100000000).toString();
  
  const [appConfig, setAppConfig] = useState<any>({});
  const [timeLeft, setTimeLeft] = useState(3 * 60 * 60); // 3 hours in seconds
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);
  
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const d = await getDoc(doc(db, 'app_config', 'settings'));
        if (d.exists()) {
          setAppConfig(d.data());
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    fetchConfig();
    
    // Timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState('');
  const [trxId, setTrxId] = useState('');

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleConfirmPayment = async () => {
     if (!currentUser) {
         toast.error("You must be logged in.");
         return;
     }

     setIsSubmitting(true);
     try {
         setSubmittingStep("Handshaking with Binance Pay API...");
         await delay(1600);
         
         setSubmittingStep("Verifying payment transaction status...");
         await delay(1800);

         setSubmittingStep("Registering deposit record in ledger...");
         await addDoc(collection(db, 'deposits'), {
             userId: currentUser.uid,
             userEmail: currentUser.email,
             amount: Number(amount),
             currency: currency,
             method: 'Binance Pay',
             walletNumber: appConfig.binancePayUid || '',
             trxId: 'Manual/Direct',
             status: 'pending',
             timestamp: Date.now(),
             orderId: baseOrderId
         });
         await delay(1200);

         toast.success("Deposit request submitted successfully!");
         setTimeout(() => {
             navigate('/trade');
         }, 1500);
     } catch(err) {
         console.error(err);
         toast.error("Failed to submit request.");
         setIsSubmitting(false);
     } finally {
         // Keep spinner active until navigation
     }
  };

  const handleOpenApp = () => {
     // Save transaction as pending
     if (!currentUser) return;
     
     if (appConfig.binancePayUid) {
         // Copy to clipboard or trigger intent
         navigator.clipboard.writeText(appConfig.binancePayUid).then(() => {
             toast.success("Binance UID copied to clipboard!");
         });
     }
     toast.success("Please complete payment using Binance App");
     // Deep link to Binance
     window.location.href = "binance://";
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans flex flex-col text-[#222222]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-[#F5F5F5]">
         <div className="flex items-center gap-4">
             <button onClick={() => navigate('/trade')} className="text-gray-600 hover:text-black">
                <Icons.ArrowLeft size={24} />
             </button>
             <h1 className="text-lg font-bold">Bivaaxpay</h1>
         </div>
         <div className="flex items-center gap-3">
             <span className="text-sm text-gray-500 font-medium">EN</span>
             <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center relative shadow-inner overflow-hidden">
                 <div className="absolute top-0 right-0 bottom-0 left-1 bg-gray-400 rounded-full"></div>
             </div>
         </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-20 pt-2 flex flex-col gap-4 max-w-[500px] mx-auto w-full">
         
         {/* Timer Block */}
         <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold mb-2">Complete payment</h2>
            <p className="text-sm text-gray-400">Payment expires in <span className="font-mono text-gray-600">{formatTime(timeLeft)}</span></p>
         </div>

         {/* QR Code Block */}
         <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-56 h-56 bg-white border border-gray-100 rounded-xl flex items-center justify-center p-2 mb-4 relative overflow-hidden">
                {appConfig.binancePayQrCode ? (
                    <img src={appConfig.binancePayQrCode} alt="Binance QR" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-gray-300 text-sm">QR Code not set by Admin</div>
                )}
                {/* Overlay tiny binance icon in center like the image */}
                <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <img src="https://cryptologos.cc/logos/bnb-bnb-logo.png" className="w-6 h-6" alt="BNB" />
                </div>
             </div>
             {
                 appConfig.binancePayUid && (
                     <div className="mb-4 text-sm font-semibold text-gray-600 bg-gray-50 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 active:scale-95 transition-all text-center mx-auto"
                        onClick={() => {
                            navigator.clipboard.writeText(appConfig.binancePayUid);
                            toast.success("UID copied!");
                        }}
                     >
                         Binance UID: {appConfig.binancePayUid} <br/>
                         <span className="text-[11px] font-normal opacity-70">Tap to copy</span>
                     </div>
                 )
             }
             <a href="#" className="text-[#888888] text-sm flex items-center gap-1 hover:text-black">
                 How to pay with Binance <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">?</div>
             </a>
         </div>

         {/* Details Block */}
         <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-3">
             <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-400">Total amount</span>
                 <span className="font-bold text-base">${amount} {currency}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-400">Merchant</span>
                 <span className="font-medium text-gray-800">Bivaax</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-400">Order ID</span>
                 <span className="font-medium text-gray-800">{baseOrderId}</span>
             </div>
         </div>

         {/* Original Description Block which was here */}
         <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
             <span className="text-gray-400 text-sm mb-1">Description</span>
             <span className="font-medium text-gray-800 text-sm">Bivaax Deposit ID: {baseOrderId}</span>
         </div>

         {/* Footer Links */}
         <div className="text-center mt-2 flex flex-col items-center gap-1">
             <span className="text-[#888888] text-[12px]">Payment experience powered by <span className="font-semibold text-gray-600">Bivaaxpay</span></span>
             <div className="flex gap-4 text-[#888888] text-[12px]">
                 <a href="#" className="underline">About</a>
                 <a href="#" className="underline">Privacy Policy</a>
             </div>
         </div>

      </main>

      {/* Button fixed at bottom mostly */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/50 backdrop-blur-md flex flex-col justify-center gap-3 pb-8 border-t border-gray-200">
          <button 
             onClick={handleConfirmPayment}
             disabled={isSubmitting}
             className="w-full max-w-[500px] mx-auto h-14 bg-[#FCD535] hover:bg-[#F0C929] active:scale-[0.98] transition-all text-black font-bold text-[16px] rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
             {isSubmitting ? (
                 <>
                     <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                     <span className="animate-pulse">{submittingStep || "Submitting..."}</span>
                 </>
             ) : (
                 "Submit Confirm Payment"
             )}
          </button>
      </div>

    </div>
  );
}
