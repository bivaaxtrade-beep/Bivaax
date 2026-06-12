import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import * as Icons from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCurrencySymbol } from '../lib/currencies';

export default function CryptoDepositPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || '0';
  const currency = searchParams.get('currency') || 'USDT';
  const baseOrderId = searchParams.get('orderId') || Math.floor(Math.random() * 100000000).toString();
  const methodId = searchParams.get('methodId');
  
  const [methodConfig, setMethodConfig] = useState<any>({});
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
        if (methodId && methodId !== "undefined") {
            const d = await getDoc(doc(db, 'depositMethods', methodId));
            if (d.exists()) {
                setMethodConfig(d.data());
            }
        }
      } catch (err) {
        console.error("Failed to load method config:", err);
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
  }, [methodId]);

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
         setSubmittingStep("Establishing secure transaction gateway...");
         await delay(1500);
         
         setSubmittingStep("Broadcasting payment details to network...");
         await delay(1800);

         setSubmittingStep("Syncing with ledger and finalizing request...");
         await addDoc(collection(db, 'deposits'), {
             userId: currentUser.uid,
             userEmail: currentUser.email,
             amount: Number(amount),
             currency: currency,
             method: methodConfig.name || 'Crypto',
             walletNumber: methodConfig.address || '',
             trxId: 'Manual/Direct',
             status: 'pending',
             timestamp: Date.now(),
             orderId: baseOrderId
         });
         await delay(1200);

         toast.success("Deposit request submitted! Admin will verify soon.");
         setTimeout(() => {
             window.close(); // Attempt to close window
             navigate('/trade'); // Fallback if not allowed
         }, 1500);
     } catch(err) {
         console.error(err);
         toast.error("Failed to submit request.");
         setIsSubmitting(false);
     } finally {
         // Keep the submitting spinner until we navigate away
     }
  };

  const handleOpenApp = () => {
     if (methodConfig.address) {
         navigator.clipboard.writeText(methodConfig.address).then(() => {
             toast.success("Wallet Address copied to clipboard!");
         });
     } else {
         toast.success("Please complete payment using your Wallet App");
     }
  };

  return (
    <div className="min-h-screen bg-[#1c1d22] font-sans flex flex-col text-[#ffffff]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-[#15161d] border-b border-white/5">
         <div className="flex items-center gap-4">
             <button onClick={() => navigate('/trade')} className="text-gray-400 hover:text-white transition-colors">
                <Icons.ArrowLeft size={24} />
             </button>
             <h1 className="text-lg font-bold">{methodConfig.name || "Crypto Deposit"}</h1>
         </div>
         <div className="flex items-center gap-3">
             <span className="text-sm text-gray-500 font-medium">{currency}</span>
             <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center relative shadow-inner overflow-hidden">
                 <div className="absolute top-0 right-0 bottom-0 left-1 bg-yellow-500 rounded-full"></div>
             </div>
         </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-24 pt-4 flex flex-col gap-4 max-w-[500px] mx-auto w-full">
         
         {/* Timer Block */}
         <div className="bg-[#15161d] border border-white/5 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold mb-2">Complete payment</h2>
            <p className="text-sm text-gray-400">Payment expires in <span className="font-mono text-[#FFE24C]">{formatTime(timeLeft)}</span></p>
         </div>

         {/* QR Code Block */}
         <div className="bg-[#15161d] border border-white/5 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-56 h-56 bg-white border border-gray-100 rounded-xl flex items-center justify-center p-2 mb-4 relative overflow-hidden">
                {methodConfig.qrCode ? (
                    <img src={methodConfig.qrCode} alt="Crypto QR" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-gray-900 font-bold text-sm">Transfer to Address</div>
                )}
                {/* Overlay icon */}
                {methodConfig.logo && (
                    <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm p-1">
                        <img src={methodConfig.logo} className="w-full h-full object-contain" alt="" />
                    </div>
                )}
             </div>
             {
                 methodConfig.address && (
                     <div className="mb-4 w-full text-[13px] font-mono font-medium text-gray-300 bg-black/40 border border-white/5 px-4 py-3 rounded-lg cursor-pointer hover:bg-white/5 active:scale-95 transition-all text-center mx-auto break-all"
                        onClick={() => {
                            navigator.clipboard.writeText(methodConfig.address);
                            toast.success("Wallet Address copied!");
                        }}
                     >
                         {methodConfig.address} <br/>
                         <span className="text-[11px] font-sans font-normal opacity-70 mt-1 block tracking-wider uppercase text-[#FFE24C]">Tap to copy address</span>
                     </div>
                 )
             }
         </div>

         {/* Details Block */}
         <div className="bg-[#15161d] border border-white/5 rounded-2xl p-6 shadow-sm flex flex-col gap-3">
             <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-400">Total amount</span>
                 <span className="font-bold text-base text-[#FFE24C]">${amount} {currency}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-400">Network / Chain</span>
                 <span className="font-medium text-white">{methodConfig.provider || "Default Network"}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-400">Order ID</span>
                 <span className="font-medium text-white">{baseOrderId}</span>
             </div>
         </div>

      </main>

      {/* Button fixed at bottom mostly */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1c1d22]/80 backdrop-blur-md flex flex-col gap-3 justify-center pb-8 border-t border-white/5">
          <button 
             onClick={handleConfirmPayment}
             disabled={isSubmitting}
             className="w-full max-w-[500px] mx-auto h-14 bg-[#FFE24C] hover:bg-[#F0D544] active:scale-[0.98] transition-all text-black font-extrabold text-[16px] rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
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
