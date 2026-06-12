import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Copy, 
  ExternalLink, 
  BarChart3, 
  Wallet, 
  HelpCircle, 
  MessageSquare, 
  Menu,
  ChevronDown,
  Calendar,
  MousePointer2,
  Plus,
  UserPlus,
  ArrowRight,
  ChevronRight,
  Edit3,
  Info,
  Zap,
  History,
  X,
  Activity,
  Award,
  Trophy,
  Check,
  CheckCircle2,
  Clock,
  Calculator,
  Bell,
  Settings,
  Globe,
  Database,
  ArrowUpRight,
  ShieldCheck,
  Star
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, doc, getDoc, updateDoc, increment, addDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';


const StatCard = ({ title, value, subtext, color = "blue", icon: Icon }: { title: string, value: string | number, subtext: string, color?: string, icon?: any }) => {
  const colorMap: Record<string, string> = {
    blue: "border-blue-600/20 text-blue-600 bg-white",
    green: "border-emerald-600/20 text-emerald-600 bg-white",
    purple: "border-indigo-600/20 text-indigo-600 bg-white",
    orange: "border-orange-600/20 text-orange-600 bg-white",
    cyan: "border-cyan-600/20 text-cyan-600 bg-white"
  };

  return (
    <div className={`rounded-[24px] p-8 border ${colorMap[color] || colorMap.blue} shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden`}>
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-gray-400 font-black text-[10px] uppercase tracking-[0.25em] leading-tight">{title}</h3>
        <div className={`p-2.5 rounded-xl bg-gray-50 border border-gray-100 ${colorMap[color].split(' ')[1]}`}>
          {Icon && <Icon size={18} strokeWidth={2.5} />}
        </div>
      </div>
      <div>
        <div className="text-[32px] font-black text-[#1c1d22] leading-none mb-3 tracking-tighter">{value}</div>
        <div className="flex items-center gap-2">
           <div className="w-1 h-1 rounded-full bg-current opacity-40"></div>
           <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{subtext}</span>
        </div>
      </div>
    </div>
  );
};

const FastLink = ({ icon: Icon, title, iconColor, bgColor, onClick }: { icon: any, title: string, iconColor: string, bgColor: string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`${bgColor} hover:bg-gray-50 transition-all rounded-[32px] p-6 md:p-8 flex flex-col items-start gap-4 text-left group h-full shadow-sm hover:shadow-xl border border-gray-100 relative overflow-hidden`}
  >
    <div className="absolute -right-6 -bottom-6 text-gray-100 group-hover:text-gray-200 transition-colors pointer-events-none">
       <Icon size={120} strokeWidth={1} />
    </div>
    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[22px] flex items-center justify-center bg-white shadow-md border border-gray-50 transition-transform group-hover:scale-110 group-active:scale-95 duration-300 mb-2 z-10`}>
      <Icon className={iconColor} size={28} strokeWidth={2} />
    </div>
    <div className="z-10">
      <span className={`text-[18px] md:text-[20px] font-black tracking-tighter ${iconColor} block mb-1`}>{title}</span>
      <div className="flex items-center gap-1.5">
         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Explore Tool</span>
         <ArrowRight size={10} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  </button>
);

const SectionHeading = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="flex flex-col gap-2 mb-10">
     <div className="flex items-center gap-4">
       <div className="w-12 h-12 flex items-center justify-center bg-[#1c1d22] rounded-2xl text-white shadow-xl shadow-black/10">
         <Icon size={24} strokeWidth={2} />
       </div>
       <div>
         <h2 className="text-[28px] font-black tracking-tighter text-[#1c1d22] leading-none mb-1">{title}</h2>
         <p className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-0.5">{desc}</p>
       </div>
     </div>
  </div>
);

const AffiliateAnalytics = ({ referrals, commissions, affiliateBalance }: any) => {
  const currency = '$';
  const data = [
    { name: 'Network Scope', value: referrals.length, label: 'Total Referrals', color: '#6366f1' },
    { name: 'Active Traders', value: referrals.filter((r: any) => (r.tradeVolume || 0) > 0).length, label: 'Live Users', color: '#10b981' },
    { name: 'Locked Revenue', value: Number(affiliateBalance.toFixed(2)), label: `Pending ${currency}`, color: '#f59e0b' }
  ];

  return (
    <div className="bg-white rounded-[48px] p-10 border border-gray-100 shadow-sm relative overflow-hidden h-full">
      <SectionHeading icon={BarChart3} title="Affiliate Analytics" desc="Ecosystem performance & revenue metrics" />
      
      <div className="h-[320px] w-full mt-12">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} 
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
            />
            <Tooltip 
               cursor={{fill: '#f8fafc'}}
               content={({ active, payload }) => {
                 if (active && payload && payload.length) {
                   const item = payload[0].payload;
                   return (
                     <div className="bg-white p-6 rounded-[24px] shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{item.label}</p>
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-6 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <p className="text-[24px] font-black text-[#1c1d22] leading-none tracking-tighter">
                             {item.name === 'Locked Revenue' ? `${currency}${item.value}` : item.value}
                          </p>
                       </div>
                     </div>
                   );
                 }
                 return null;
               }}
            />
            <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={80}>
              {data.map((entry, index) => (
                <Cell key={`cell-analytics-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-10 grid grid-cols-3 gap-6 pt-10 border-t border-gray-50">
         {data.map((item, idx) => (
            <div key={`summary-item-${idx}`} className="space-y-1">
               <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.name}</div>
               <div className="text-[15px] font-black text-[#1c1d22]">{item.name === 'Locked Revenue' ? `${currency}${item.value}` : item.value}</div>
            </div>
         ))}
      </div>
    </div>
  );
};

const EXCHANGE_RATES: Record<string, number> = {
  '৳': 1.0,      // BDT (Base)
  '$': 0.00833,  // 1/120 (USD)
  '€': 0.00769   // 1/130 (EUR)
};

const getConvertedBalance = (val: number, curr: string) => {
  const rate = EXCHANGE_RATES[curr] || 1.0;
  return val * rate;
};

export default function AffiliatePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const userCurrency = '$';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'statistics' | 'links' | 'promo' | 'faq' | 'sub-affiliates' | 'payouts' | 'support' | 'support-detail'>('dashboard');
  const [subAffiliates, setSubAffiliates] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string, name: string, subId: string }[]>([]);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignSubId, setNewCampaignSubId] = useState('');
  const [selectedLandingPage, setSelectedLandingPage] = useState('/');

  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutGateway, setPayoutGateway] = useState('USDT (TRC-20)');
  const [payoutDetails, setPayoutDetails] = useState({
    mobileNumber: '',
    walletAddress: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    accountName: '',
  });
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [customAffShare, setCustomAffShare] = useState<number | null>(null);
  const [affId, setAffId] = useState<string | number>('');
  const [impressions, setImpressions] = useState(0);

  const [campaignTab, setCampaignTab] = useState<'live' | 'archived'>('live');

  const referralCode = affId || (currentUser?.uid?.substring(0, 5).toUpperCase() + Math.floor(Math.random() * 1000 + 1000));
  const referralLink = `${window.location.protocol}//${window.location.host}?ref=${referralCode}`;

  const addCampaign = async () => {
    if (!currentUser) return;
    if (!newCampaignName || !newCampaignSubId) return toast.error('Enter campaign details');
    
    // Check for duplicate subId
    const isDuplicate = campaigns.some(c => c.subId.toLowerCase() === newCampaignSubId.trim().toLowerCase());
    if (isDuplicate) return toast.error('This Sub-ID already exists!');

    try {
      await addDoc(collection(db, 'affiliate_campaigns'), {
        userId: currentUser.uid,
        name: newCampaignName,
        subId: newCampaignSubId.trim(),
        landingPage: selectedLandingPage,
        isArchived: false,
        createdAt: new Date()
      });
      setNewCampaignName('');
      setNewCampaignSubId('');
      toast.success('Campaign successfully created and saved!');
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to save campaign: ' + error.message);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'affiliate_campaigns', id));
      toast.success('Campaign removed');
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to remove campaign');
    }
  };

  const getCampaignLink = (subId: string, landingPage: string = '/') => {
    const base = window.location.origin + (landingPage === '/' ? '' : landingPage);
    const connector = base.includes('?') ? '&' : '?';
    return `${base}${connector}ref=${referralCode}&sub=${subId}`;
  };
  const [balance, setBalance] = useState(0.00);
  const [affiliateBalance, setAffiliateBalance] = useState(0.00);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [appConfig, setAppConfig] = useState<any>({});
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcValues, setCalcValues] = useState({ referrals: 10, volumePerRef: 1000 });

  const [promoMaterials, setPromoMaterials] = useState<any[]>([]);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [ticketReply, setTicketReply] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    // Listen for current user balance
    const userUnsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
       if (snap.exists()) {
          const userData = snap.data();
          setBalance(userData.balance || 0);
          setAffiliateBalance(userData.affiliateBalance || 0);
          // if (userData.currency) setUserCurrency(userData.currency);
          setCustomAffShare(userData.customAffiliateShare || null);
          if (userData.affiliateId) {
             setAffId(userData.affiliateId);
          } else {
             // Retroactively assign numeric ID for old users
             import('../lib/affiliate').then(async ({ getNextAffiliateId }) => {
                 try {
                     const newId = await getNextAffiliateId();
                     await updateDoc(doc(db, 'users', currentUser.uid), { affiliateId: newId });
                     setAffId(newId);
                 } catch (e) {
                     console.error("Failed to retroactively give affiliate ID", e);
                 }
             });
          }
          setImpressions(userData.impressions || 0);
       }
    }, (error) => {
       handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
    });

    // Fetch real referrals stats
    // We try to match by referredBy (numeric code) or referredByUid (UID)
    const q = query(collection(db, 'users'), where('referredByUid', '==', currentUser.uid), limit(50));
    const referUnsub = onSnapshot(q, (snap) => {
       const list = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
       }));
       // Sort client-side by createdAt desc
       list.sort((a: any, b: any) => {
          const tA = (a.createdAt && typeof a.createdAt.toDate === 'function') ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
          const tB = (b.createdAt && typeof b.createdAt.toDate === 'function') ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
          return tB - tA;
       });
       setReferrals(list);
       setLoadingStats(false);
    }, (error) => {
       handleFirestoreError(error, OperationType.GET, 'users');
    });

    const unsubConfig = onSnapshot(doc(db, 'app_config', 'settings'), (docSnap) => {
        if (docSnap.exists()) setAppConfig(docSnap.data());
    }, (error) => {
       handleFirestoreError(error, OperationType.GET, 'app_config/settings');
    });

    const unsubPromo = onSnapshot(collection(db, 'promoMaterials'), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (list.length === 0) {
           setPromoMaterials([
              { id: 'm1', label: 'Global Leader Banner', size: '1080 x 1080', color: 'bg-indigo-600' },
              { id: 'm2', label: 'Pro Trading Hub', size: '1200 x 628', color: 'bg-emerald-600' },
              { id: 'm3', label: 'Trust & Security', size: '728 x 90', color: 'bg-rose-600' }
           ]);
        } else {
           setPromoMaterials(list);
        }
    }, (error) => {
       handleFirestoreError(error, OperationType.GET, 'promoMaterials');
    });

    const unsubCampaigns = onSnapshot(
      query(collection(db, 'affiliate_campaigns'), where('userId', '==', currentUser.uid)),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        if (list.length === 0) {
          setCampaigns([{ id: 'default', name: 'Main Campaign', subId: 'default' }]);
        } else {
          setCampaigns(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'affiliate_campaigns');
      }
    );

    const unsubPayouts = onSnapshot(
      query(collection(db, 'affiliate_payouts'), where('userId', '==', currentUser.uid)),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a: any, b: any) => {
          const tA = (a.createdAt && typeof a.createdAt.toDate === 'function') ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
          const tB = (b.createdAt && typeof b.createdAt.toDate === 'function') ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
          return tB - tA;
        });
        setPayoutRequests(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'affiliate_payouts');
      }
    );

    const unsubTickets = onSnapshot(query(collection(db, 'tickets'), where('userId', '==', currentUser.uid)), (snap) => {
      const tickets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      tickets.sort((a: any, b: any) => {
        const tA = (a.updatedAt && typeof a.updatedAt.toDate === 'function') ? a.updatedAt.toDate().getTime() : (a.updatedAt || 0);
        const tB = (b.updatedAt && typeof b.updatedAt.toDate === 'function') ? b.updatedAt.toDate().getTime() : (b.updatedAt || 0);
        return tB - tA;
      });
      setUserTickets(tickets);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tickets');
    });

    const unsubCommissions = onSnapshot(
      query(collection(db, 'affiliate_commissions'), where('referrerUid', '==', currentUser.uid)),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a: any, b: any) => {
          const tA = (a.createdAt && typeof a.createdAt.toDate === 'function') ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
          const tB = (b.createdAt && typeof b.createdAt.toDate === 'function') ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
          return tB - tA;
        });
        setCommissions(list.slice(0, 50)); // Last 50 commissions
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'affiliate_commissions');
      }
    );

    return () => {
       userUnsub();
       referUnsub();
       unsubConfig();
       unsubPromo();
       unsubCampaigns();
       unsubPayouts();
       unsubTickets();
       unsubCommissions();
    };
  }, [currentUser]);

  useEffect(() => {
    if (selectedTicket) {
      const unsub = onSnapshot(query(collection(db, 'tickets', selectedTicket.id, 'messages'), orderBy('createdAt', 'asc')), (snap) => {
        setTicketMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsub();
    }
  }, [selectedTicket]);

  const getAIReply = async (ticketId: string, message: string) => {
    if (selectedTicket?.aiDisabled) return;
    setIsBotTyping(true);
    try {
      const res = await fetch('/api/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      let aiReply = "I'm sorry, I am having trouble processing your request. Please wait for a human representative.";
      if (res.ok) {
        const data = await res.json();
        if (data.reply) aiReply = data.reply;
      } else {
        return;
      }
      
      const lowerMsg = message.toLowerCase();
      const needsEscalation = lowerMsg.includes('agent') || lowerMsg.includes('এজেন্ট') || lowerMsg.includes('representative');

      await addDoc(collection(db, 'tickets', ticketId, 'messages'), {
        senderId: 'ai-bot',
        senderName: 'Support Bot',
        senderType: 'support',
        text: aiReply,
        createdAt: Date.now()
      });

      await updateDoc(doc(db, 'tickets', ticketId), {
        lastMessage: aiReply,
        updatedAt: Date.now(),
        ...(needsEscalation ? { aiDisabled: true, status: 'pending' } : {})
      });
    } catch (e) {
      console.error("AI reply failed:", e);
    } finally {
      setIsBotTyping(false);
    }
  };

  const createSupportTicket = async (subject: string, message: string) => {
    if (!currentUser) {
      toast.error("Please log in to contact support");
      return;
    }
    try {
      const ticketRef = await addDoc(collection(db, 'tickets'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || "Partner",
        subject: subject,
        status: 'open',
        priority: 'medium',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        category: 'affiliate'
      });

      const ticketId = ticketRef.id;
      await addDoc(collection(db, 'tickets', ticketId, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || "Partner",
        senderType: 'user',
        text: message,
        createdAt: Date.now()
      });

      toast.success("Support ticket created!");
      getAIReply(ticketId, message);
      return ticketId;
    } catch (e) {
      console.error("Error creating ticket:", e);
      toast.error("Failed to create ticket");
    }
  };

  const sendTicketMessage = async () => {
    if (!selectedTicket || !ticketReply.trim() || !currentUser) return;
    const tid = selectedTicket.id;
    try {
      await addDoc(collection(db, 'tickets', tid, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || "Partner",
        senderType: 'user',
        text: ticketReply,
        createdAt: Date.now()
      });
      
      await updateDoc(doc(db, 'tickets', tid), {
        lastMessage: ticketReply,
        updatedAt: Date.now()
      });

      const msg = ticketReply;
      setTicketReply("");
      getAIReply(tid, msg);
    } catch (e) {
      console.error("Error sending message:", e);
      toast.error("Failed to send message");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    toast.success('Affiliate link copied!', {
      style: { border: '1px solid #10b981', padding: '16px', color: '#10b981', background: '#fff' }
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleTransferEarnings = async () => {
    if (!currentUser) return;
    if (getConvertedBalance(affiliateBalance, '$') < 1) {
      toast.error(`Minimum transfer amount is $1.00 (USDT)`);
      return;
    }
    const amountToTransfer = affiliateBalance;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        affiliateBalance: increment(-amountToTransfer),
        balance: increment(amountToTransfer)
      });
      toast.success(`Successfully transferred $${getConvertedBalance(amountToTransfer, '$').toFixed(2)} to Main Live Balance!`);
    } catch (error) {
      console.error(error);
      toast.error('Transfer failed. Please try again or contact support.');
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const amountNum = parseFloat(payoutAmount); // Input in USDT
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid payout amount');
      return;
    }

    const amountInBase = amountNum / EXCHANGE_RATES['$']; // Convert USDT to BDT base

    if (amountInBase > affiliateBalance) {
      toast.error('Insufficient affiliate balance');
      return;
    }

    const minAmountUSDT = 10;
    if (amountNum < minAmountUSDT) {
      toast.error(`Minimum payout withdrawal amount is $${minAmountUSDT.toFixed(2)} (USDT)`);
      return;
    }

    // Strictly enforce USDT TRC-20 for affiliate payouts
    if (payoutGateway !== 'USDT (TRC-20)') {
      toast.error('Only USDT (TRC-20) is supported for partner payouts.');
      return;
    }

    if (!payoutDetails.walletAddress) {
      toast.error('Please enter your USDT TRC-20 Wallet Address');
      return;
    }
    const detailsStr = `USDT TRC-20: ${payoutDetails.walletAddress}`;

    setIsSubmittingPayout(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) throw new Error('User data profile not found');

      const liveAffBalance = userDoc.data().affiliateBalance || 0;
      if (amountNum > liveAffBalance) {
        toast.error('Insufficient affiliate balance (real-time check failed)');
        setIsSubmittingPayout(false);
        return;
      }

      // Add to payouts logs
      await addDoc(collection(db, 'affiliate_payouts'), {
        userId: currentUser.uid,
        email: currentUser.email || 'partner@bivaax.local',
        amount: amountNum,
        currency: '$',
        gateway: payoutGateway,
        details: detailsStr,
        status: 'pending',
        createdAt: new Date(),
        processedAt: null,
        rejectReason: null
      });

      // Deduct immediately to prevent double spend (using base currency)
      await updateDoc(userRef, {
        affiliateBalance: increment(-amountInBase)
      });

      toast.success('Your payout request has been queued! Processing normally takes under 2 hours.', {
        duration: 5000
      });
      setPayoutAmount('');
      setPayoutDetails({
        mobileNumber: '',
        walletAddress: '',
        bankName: '',
        branchName: '',
        accountNumber: '',
        accountName: '',
      });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to dispatch payout request: ' + err.message);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'links', label: 'Campaigns', icon: ExternalLink },
    { id: 'sub-affiliates', label: 'Partner Network', icon: UserPlus },
    { id: 'promo', label: 'Media Pack', icon: Award },
    { id: 'payouts', label: 'Payout Manager', icon: Wallet },
    { id: 'support', label: 'Support Team', icon: MessageSquare },
    { id: 'faq', label: 'Help Center', icon: HelpCircle },
  ];

  const stats = {
     leads: referrals.length,
     conversions: referrals.filter(r => (r.balance || 0) > 0 || (r.demoBalance || 0) > 0).length,
     totalVolume: referrals.reduce((acc, r) => acc + (r.tradeVolume || 0), 0)
  };

  const getTier = () => {
    const count = stats.leads;
    if (count >= 201) return { name: 'Elite Master', share: appConfig.affiliate_share_elite || 80, color: 'text-amber-500', bg: 'bg-amber-500/10', next: null, icon: Trophy };
    if (count >= 51) return { name: 'VIP Partner', share: appConfig.affiliate_share_vip || 70, color: 'text-indigo-500', bg: 'bg-indigo-500/10', next: 201, icon: Star };
    if (count >= 11) return { name: 'Pro Partner', share: appConfig.affiliate_share_pro || 60, color: 'text-emerald-500', bg: 'bg-emerald-500/10', next: 51, icon: Zap };
    return { name: 'Starter', share: appConfig.affiliate_share_starter || 50, color: 'text-rose-500', bg: 'bg-rose-500/10', next: 11, icon: Activity };
  };

  const currentTier = getTier();
  const progressToNext = currentTier.next ? (stats.leads / currentTier.next) * 100 : 100;

  const Milestone = ({ title, requirement, bonus, isReached }: { title: string, requirement: string, bonus: string, isReached: boolean }) => (
    <div className={`p-5 rounded-3xl border transition-all ${isReached ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
       <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isReached ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
             {isReached ? <CheckCircle2 size={20} /> : <Clock size={20} />}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${isReached ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
             {isReached ? 'Unlocked' : 'Locked'}
          </span>
       </div>
       <h4 className="text-[15px] font-black text-white mb-1 tracking-tight">{title}</h4>
       <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">{requirement}</p>
       <div className="flex items-center gap-2 text-[12px] font-black text-emerald-400">
          <Award size={14} />
          {bonus}
       </div>
    </div>
  );

  const dynamicChartData = React.useMemo(() => {
    const last7Days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      
      const dayRegs = referrals.filter(r => {
        const regDate = (r.createdAt && typeof r.createdAt.toDate === 'function') ? r.createdAt.toDate() : new Date(r.createdAt || 0);
        return regDate.toDateString() === d.toDateString();
      }).length;

      last7Days.push({ 
        day: dateStr, 
        registrations: dayRegs,
        clicks: 0, 
        ftds: 0 
      });
    }
    return last7Days;
  }, [referrals]);

  return (
    <div className="min-h-screen bg-[#f3f6fa] font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-[#1c1d22] text-white py-4 px-4 md:px-10 flex items-center justify-between sticky top-0 z-[100] shadow-xl">
        <div className="flex items-center gap-6 md:gap-8">
          <div className="flex items-center gap-2.5 md:gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size={28} withBackground />
            <div>
              <div className="text-[18px] md:text-[20px] font-black tracking-tight leading-none">BIVAAX</div>
              <div className="text-[9px] md:text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] mt-0.5">Partner ID: {referralCode}</div>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-2">
            {menuItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-black transition-all uppercase tracking-widest ${activeTab === item.id ? 'bg-white/10 text-white shadow-inner' : 'text-gray-400 hover:text-white'}`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden md:flex flex-col items-end">
             <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="text-white font-black text-[18px] leading-none">$ {getConvertedBalance(affiliateBalance, '$').toFixed(2)}</div>
             </div>
             <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
               <span>Available USDT</span>
               <span className="opacity-30">/</span>
               <span>Rev: {customAffShare !== null ? customAffShare : currentTier.share}%</span>
               <HelpCircle size={10} className="ml-0.5 cursor-help" />
             </div>
          </div>
          
          <div className="max-md:hidden h-10 px-3 bg-[#2d2e35] rounded-xl flex items-center justify-center font-black text-rose-500 text-[13px] cursor-pointer hover:bg-[#383a42] transition-colors gap-2">
            {currentUser?.email?.substring(0, 2).toUpperCase()}
            <ChevronDown size={14} className="opacity-50" />
          </div>

          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-1.5 text-gray-400 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
        
        {activeTab === 'dashboard' && (
           <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
             {/* Dynamic Status Banner */}
             <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 p-1 py-1 rounded-[24px] shadow-lg overflow-hidden flex items-center justify-center">
                <div className="bg-[#1c1d22] w-full h-full rounded-[20px] px-6 py-3 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400">Mainnet Partner Protocol Active</span>
                   </div>
                   <div className="hidden md:flex items-center gap-6">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Payouts (24h):</span>
                         <span className="text-[11px] font-black text-white">$0</span>
                      </div>
                      <div className="w-[1px] h-4 bg-white/10"></div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Partners:</span>
                         <span className="text-[11px] font-black text-white">{stats.leads}</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Top Hero Section */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Main Revenue Card */}
                <div className="lg:col-span-8 bg-[#1c1d22] rounded-[56px] p-8 md:p-14 text-white shadow-3xl relative overflow-hidden group border border-white/5">
                   <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none group-hover:bg-indigo-600/30 transition-all duration-1000"></div>
                   <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-emerald-600/20 rounded-full blur-[140px] pointer-events-none group-hover:bg-emerald-600/30 transition-all duration-1000"></div>
                   
                   <div className="relative z-10 flex flex-col h-full">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                       <div>
                         <div className="flex items-center gap-3 mb-3">
                            <h2 className="text-[#8e9299] font-black text-[13px] uppercase tracking-[0.3em]">Aggregate Revenue Volume</h2>
                         </div>
                         <div className="flex items-baseline gap-4">
                            <span className="text-[72px] md:text-[96px] font-black leading-none tracking-tighter tabular-nums drop-shadow-2xl">$ {getConvertedBalance(affiliateBalance, '$').toFixed(2)}</span>
                            <span className="text-[24px] font-black text-indigo-500 tracking-widest uppercase">USDT</span>
                         </div>
                       </div>
                       
                       <div className="flex flex-col gap-3">
                          <div className={`px-8 py-3.5 rounded-full text-[12px] font-black uppercase tracking-[0.25em] border flex items-center justify-center gap-3 backdrop-blur-2xl shadow-2xl transition-all hover:scale-105 ${currentTier.bg} ${currentTier.color} border-white/10`}>
                            <currentTier.icon size={18} />
                            {currentTier.name} Status
                          </div>
                          <div className="flex items-center justify-center gap-2 px-6 py-2 bg-white/5 rounded-full border border-white/5">
                             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Share:</span>
                             <span className="text-[12px] font-black text-emerald-400">80% RevShare</span>
                          </div>
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                        <button onClick={handleTransferEarnings} className="group relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all py-7 rounded-[32px] text-white font-black flex items-center justify-center gap-4 text-[18px] uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(79,70,229,0.3)]">
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                           Withdraw to Live
                           <ArrowUpRight size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                        <button onClick={() => setActiveTab('payouts')} className="bg-white/5 hover:bg-white/10 border border-white/10 transition-all py-7 rounded-[32px] text-white font-black flex items-center justify-center gap-4 text-[18px] uppercase tracking-[0.2em] backdrop-blur-md">
                           Global Payouts
                        </button>
                     </div>

                     <div className="mt-auto grid grid-cols-4 gap-8 pt-12 border-t border-white/5">
                        <div className="space-y-2">
                           <div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.25em]">Traffic</div>
                           <div className="text-[28px] font-black tabular-nums text-white">{impressions.toLocaleString()}</div>
                        </div>
                        <div className="space-y-2">
                           <div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.25em]">Directs</div>
                           <div className="text-[28px] font-black tabular-nums text-white">{stats.leads}</div>
                        </div>
                        <div className="space-y-2">
                           <div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.25em]">Conversions</div>
                           <div className="text-[28px] font-black text-indigo-400 tabular-nums">{referrals.filter(r => (r.totalDeposits || 0) > 0).length}</div>
                        </div>
                        <div className="space-y-2">
                           <div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.25em]">CR %</div>
                           <div className="text-[28px] font-black text-emerald-400 tabular-nums">{stats.leads > 0 ? ((referrals.filter(r => (r.totalDeposits || 0) > 0).length / stats.leads) * 100).toFixed(1) : '0.0'}</div>
                        </div>
                     </div>
                   </div>
                </div>

                {/* Growth & Levels Card */}
                <div className="lg:col-span-4 flex flex-col justify-between bg-white rounded-[56px] p-12 shadow-2xl shadow-black/5 border border-gray-100 relative overflow-hidden group">
                   <div className="space-y-10">
                      <div className="flex items-center justify-between">
                         <div>
                            <h3 className="text-[18px] font-black text-[#1c1d22] uppercase tracking-widest leading-none mb-1">Affiliate Tiers</h3>
                            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.1em]">Network Expansion Path</p>
                         </div>
                         <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                            <TrendingUp size={24} />
                         </div>
                      </div>
                      
                      <div className="space-y-4">
                         {[
                            { name: 'Platinum Elite', req: 201, active: stats.leads >= 201, share: '80%', color: 'from-blue-600 to-indigo-600' },
                            { name: 'Diamond VIP', req: 51, active: stats.leads >= 51 && stats.leads < 201, share: '70%', color: 'from-purple-600 to-indigo-600' },
                            { name: 'Gold Partner', req: 11, active: stats.leads >= 11 && stats.leads < 51, share: '60%', color: 'from-amber-500 to-orange-600' },
                            { name: 'Standard', req: 0, active: stats.leads < 11, share: '50%', color: 'from-gray-600 to-gray-800' }
                         ].map((tier, i) => (
                            <div key={`growth-tier-v2-${tier.name}-${i}`} className={`relative p-5 rounded-[24px] border-2 transition-all ${tier.active ? 'bg-white border-indigo-600 shadow-xl scale-[1.02] z-10' : 'bg-gray-50 border-transparent opacity-60'}`}>
                               {tier.active && <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full">Current Rank</div>}
                               <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                     <span className={`text-[13px] font-black uppercase tracking-[0.15em] ${tier.active ? 'text-[#1c1d22]' : 'text-gray-400'}`}>{tier.name}</span>
                                     <span className="text-[10px] font-bold text-gray-500 tracking-widest">{tier.req}+ ACTIVE LEADS</span>
                                  </div>
                                  <div className={`px-4 py-1.5 rounded-xl bg-gradient-to-br ${tier.color} text-white font-black text-[13px]`}>{tier.share}</div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="mt-12 pt-8 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Next Achievement Delta</span>
                         <span className="text-[14px] font-black text-indigo-600 tabular-nums">{Math.round(progressToNext)}%</span>
                      </div>
                      <div className="h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5">
                         <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressToNext}%` }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                         />
                      </div>
                   </div>
                </div>
             </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
               <FastLink icon={Award} title="Media Pack" iconColor="text-orange-600" bgColor="bg-white" onClick={() => setActiveTab('promo')} />
               <FastLink icon={ExternalLink} title="My Campaigns" iconColor="text-indigo-600" bgColor="bg-white" onClick={() => setActiveTab('links')} />
               <FastLink icon={Calculator} title="Earnings Calc" iconColor="text-emerald-600" bgColor="bg-white" onClick={() => setShowCalculator(true)} />
               <FastLink icon={Clock} title="Payout Logs" iconColor="text-rose-600" bgColor="bg-white" onClick={() => setActiveTab('payouts')} />
            </div>

            {/* Secondary Professional Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white rounded-[48px] p-10 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-10">
                     <div>
                        <h3 className="text-[24px] font-black text-[#1c1d22] tracking-tighter">Performance Monitor</h3>
                        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">7-Day detailed traffic scaling</p>
                     </div>
                     <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                         {['VOL', 'REG', 'CTR'].map(m => (
                            <button key={m} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${m === 'REG' ? 'bg-[#1c1d22] text-white shadow-lg' : 'text-gray-400 hover:text-[#1c1d22]'}`}>{m}</button>
                         ))}
                     </div>
                  </div>
                  <div className="h-[320px] w-full">
                     <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={dynamicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <defs>
                              <linearGradient id="dashboardGrad" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                 <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={15} />
                           <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                           <Tooltip 
                              content={({ active, payload, label }) => {
                                 if (active && payload && payload.length) {
                                    return (
                                       <div className="bg-white p-4 rounded-[20px] shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                                          <div className="flex items-center gap-2">
                                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                             <p className="text-[14px] font-black text-indigo-600 leading-none">
                                                {payload[0].value} <span className="text-[10px] text-gray-400 font-bold ml-1 uppercase">Partners</span>
                                             </p>
                                          </div>
                                       </div>
                                    );
                                 }
                                 return null;
                              }}
                              cursor={{ stroke: '#6366f1', strokeWidth: 1.5, strokeDasharray: '5 5' }}
                           />
                           <Area 
                             type="monotone" 
                             name="Traffic Index" 
                             dataKey="registrations" 
                             stroke="#6366f1" 
                             strokeWidth={4} 
                             fillOpacity={1} 
                             fill="url(#dashboardGrad)" 
                             animationDuration={1500}
                             activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                           />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <AffiliateAnalytics 
                  referrals={referrals} 
                  commissions={commissions} 
                  affiliateBalance={getConvertedBalance(affiliateBalance, '$')} 
               />
            </div>

            {/* Smart Link Generator Section */}
            <div className="bg-[#1c1d22] rounded-[48px] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl border border-white/5 group">
                <div className="absolute right-0 top-0 w-full lg:w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none group-hover:from-indigo-500/15 transition-all duration-1000"></div>
                <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-black uppercase tracking-[0.25em] mb-10 shadow-inner">
                            <Activity size={14} className="animate-pulse" /> 
                            Universal Tracking Engine
                        </div>
                        <h2 className="text-[34px] md:text-[52px] font-black leading-[1.1] mb-8 tracking-tighter">Turn your traffic <br/>into active wealth.</h2>
                        <div className="flex flex-col sm:flex-row items-center gap-6 text-[#8e9299] text-[15px] font-medium opacity-80">
                           <div className="flex items-center gap-2">
                              <CheckCircle2 size={18} className="text-emerald-500" />
                              Lifetime Payouts
                           </div>
                           <div className="flex items-center gap-2">
                              <CheckCircle2 size={18} className="text-emerald-500" />
                              Automated Postbacks
                           </div>
                           <div className="flex items-center gap-2">
                              <CheckCircle2 size={18} className="text-emerald-500" />
                              No Monthly Caps
                           </div>
                        </div>
                    </div>

                    <div className="w-full max-w-xl bg-white/5 backdrop-blur-xl rounded-[40px] p-8 md:p-10 border border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.2em]">Universal Link (Master)</p>
                            <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] leading-none">Status: Active</span>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="relative group/link">
                                <div className="absolute inset-x-0 -bottom-1 h-[2px] bg-indigo-500/40 transform scale-x-0 group-focus-within/link:scale-x-100 transition-transform duration-500"></div>
                                <div className="w-full bg-black/40 border border-white/10 rounded-[24px] px-8 py-7 font-mono text-[14px] text-white flex items-center overflow-hidden hover:bg-black/60 transition-all shadow-inner">
                                    <span className="truncate opacity-80 select-all">{referralLink}</span>
                                </div>
                            </div>
                            <button 
                                onClick={copyLink}
                                className="w-full bg-white hover:bg-gray-100 active:scale-[0.98] text-[#1c1d22] font-black px-10 py-6 rounded-[24px] transition-all flex items-center justify-center gap-3 whitespace-nowrap shadow-2xl shadow-indigo-900/20 text-[18px] tracking-tight"
                            >
                                <Copy size={22} className={isCopied ? 'text-emerald-500' : 'text-indigo-600 animate-bounce'} />
                                {isCopied ? 'URL Copied to Clipboard!' : 'Copy Partner Gateway'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
        
        {activeTab === 'statistics' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <SectionHeading 
               icon={BarChart3} 
               title="Business Analytics" 
               desc="Complete performance metrics and network audit" 
             />

             {/* Metric Summary Rows */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Impressions" value={impressions.toLocaleString()} subtext="Unique Click Flow" color="blue" icon={Globe} />
                <StatCard title="Total Leads" value={stats.leads} subtext="Direct Registrations" color="purple" icon={UserPlus} />
                <StatCard title="Active FTD" value={stats.conversions} subtext="Funded Accounts" color="green" icon={CheckCircle2} />
                <StatCard title="Net Revenue" value={`$ ${getConvertedBalance(affiliateBalance, '$').toFixed(2)}`} subtext="Available for payout" color="orange" icon={DollarSign} />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Detailed Table */}
                <div className="lg:col-span-2 bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                      <div>
                         <h3 className="text-[22px] font-black text-[#1c1d22] tracking-tighter">Referral Network Audit</h3>
                         <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">In-depth member transaction logs</p>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                         <button className="px-5 py-2.5 rounded-xl bg-[#1c1d22] text-white text-[11px] font-black uppercase tracking-widest shadow-xl">Live Network</button>
                         <button className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-[#1c1d22] transition-colors text-[11px] font-black uppercase tracking-widest">History</button>
                      </div>
                   </div>
                   
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                               <th className="pb-8 px-4">Partner Identity</th>
                               <th className="pb-8 px-4">Joined</th>
                               <th className="pb-8 px-4">Total Deposits</th>
                               <th className="pb-8 px-4">Sub-Referrals</th>
                               <th className="pb-8 px-4 text-right">Trade Volume</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                            {referrals.length > 0 ? referrals.map((ref, idx) => {
                               const email = ref.email || "";
                               const maskedEmail = email.includes("@") ? `${email.split("@")[0].substring(0, 2)}***@${email.split("@")[1]}` : "Anov*** Partner";
                               return (
                                  <tr key={`stat-row-${ref.id}`} className="group hover:bg-gray-50/50 transition-all">
                                    <td className="py-6 px-4">
                                       <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-2xl bg-[#1c1d22] text-white flex items-center justify-center font-black text-[14px] shadow-lg shadow-black/10 overflow-hidden relative group-hover:scale-110 transition-transform">
                                             <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${maskedEmail}`} alt="av" className="w-full h-full object-cover opacity-80" />
                                          </div>
                                          <div>
                                             <div className="text-[15px] font-black text-[#1c1d22]">{maskedEmail}</div>
                                             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {ref.affiliateId || ref.id.substring(0,8)}</div>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="py-6 px-4 font-bold text-gray-500 text-[13px] uppercase tracking-tighter">
                                       {new Date(ref.createdAt || Date.now()).toLocaleDateString()}
                                    </td>
                                    <td className="py-6 px-4">
                                       <span className="text-[14px] font-black text-emerald-600 tabular-nums">
                                          {userCurrency} {getConvertedBalance(ref.totalDeposits || 0, userCurrency).toLocaleString()}
                                       </span>
                                    </td>
                                    <td className="py-6 px-4">
                                       <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[12px] font-black text-indigo-600">
                                             {ref.referralCount || 0}
                                          </div>
                                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Users</span>
                                       </div>
                                    </td>
                                    <td className="py-6 px-4 text-right font-black text-[#1c1d22] text-[15px] tabular-nums tracking-tighter">
                                       {userCurrency} {getConvertedBalance(ref.tradeVolume || 0, userCurrency).toLocaleString()}
                                    </td>
                                  </tr>
                               );
                            }) : (
                               <tr>
                                  <td colSpan={5} className="py-24 text-center">
                                     <Activity size={48} className="text-gray-100 mx-auto mb-4" />
                                     <div className="text-[12px] font-black text-gray-300 uppercase tracking-widest">Awaiting primary data synchronization</div>
                                  </td>
                               </tr>
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>

                {/* Revenue Share Commissions */}
                <div className="lg:col-span-3 bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm relative overflow-hidden mt-8">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                      <div>
                         <h3 className="text-[22px] font-black text-[#1c1d22] tracking-tighter">Revenue Share History</h3>
                         <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Quotex Style Live Income Triggers</p>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                         <button className="px-5 py-2.5 rounded-xl bg-[#1c1d22] text-white text-[11px] font-black uppercase tracking-widest shadow-xl">Recent</button>
                      </div>
                   </div>
                   
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                               <th className="pb-8 px-4">Date</th>
                               <th className="pb-8 px-4">Client ID</th>
                               <th className="pb-8 px-4">Client Loss Volume</th>
                               <th className="pb-8 px-4">RevShare %</th>
                               <th className="pb-8 px-4 text-right">Added to Balance</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                            {commissions.length > 0 ? commissions.map((comm, idx) => {
                               return (
                                  <tr key={`comm-row-${comm.id}`} className="group hover:bg-gray-50/50 transition-all">
                                    <td className="py-6 px-4 font-bold text-gray-500 text-[13px] uppercase tracking-tighter">
                                       {new Date(comm.createdAt || Date.now()).toLocaleDateString()} {new Date(comm.createdAt || Date.now()).toLocaleTimeString()}
                                    </td>
                                    <td className="py-6 px-4 font-black text-[#1c1d22] text-[15px] tabular-nums tracking-tight">
                                       {comm.referredUid ? comm.referredUid.substring(0, 8).toUpperCase() : 'N/A'}
                                    </td>
                                    <td className="py-6 px-4">
                                       <span className="text-[14px] font-black text-rose-500 tabular-nums">
                                          {userCurrency} {getConvertedBalance(comm.lostAmount || 0, userCurrency).toLocaleString()}
                                       </span>
                                    </td>
                                    <td className="py-6 px-4 font-black text-indigo-500 text-[14px]">
                                       {comm.percent}%
                                    </td>
                                    <td className="py-6 px-4 text-right font-black text-emerald-500 text-[15px] tabular-nums tracking-tighter">
                                       +{userCurrency} {getConvertedBalance(comm.amount || 0, userCurrency).toLocaleString()}
                                    </td>
                                  </tr>
                               );
                            }) : (
                               <tr>
                                  <td colSpan={5} className="py-24 text-center">
                                     <Activity size={48} className="text-gray-100 mx-auto mb-4" />
                                     <div className="text-[12px] font-black text-gray-300 uppercase tracking-widest">Awaiting rev-share data</div>
                                  </td>
                               </tr>
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>

                <div className="space-y-8">
                   {/* Traffic Analysis */}
                   <div className="bg-[#1c1d22] rounded-[40px] p-10 text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px]"></div>
                      <h4 className="text-[14px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-10">Traffic Funnel</h4>
                      <div className="space-y-6">
                         {[
                            { label: 'Direct Entry', val: '65%', color: 'bg-indigo-500' },
                            { label: 'Social Media', val: '22%', color: 'bg-rose-500' },
                            { label: 'Telegram Hub', val: '13%', color: 'bg-emerald-500' }
                         ].map((item, i) => (
                            <div key={`aff-stat-card-${i}`} className="space-y-2.5">
                               <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest">
                                  <span className="text-gray-500">{item.label}</span>
                                  <span className="text-white">{item.val}</span>
                               </div>
                               <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div className={`h-full ${item.color} shadow-[0_0_10px_rgba(255,255,255,0.1)]`} style={{ width: item.val }}></div>
                               </div>
                            </div>
                         ))}
                      </div>
                      <div className="mt-12 pt-10 border-t border-white/5">
                         <button className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all border border-white/5">Generate Audit Report</button>
                      </div>
                   </div>

                   {/* Quick Performance Card */}
                   <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[40px] p-10 text-white shadow-2xl shadow-emerald-900/20 group">
                      <TrendingUp size={40} className="text-white/20 mb-8 group-hover:scale-110 transition-transform" />
                      <h4 className="text-[24px] font-black tracking-tighter leading-tight mb-4 text-white">Scale Your Reach Today.</h4>
                      <p className="text-emerald-50 text-[14px] font-medium leading-relaxed opacity-70 mb-10">Pro partners with high CR get access to exclusive $5 CPA bonuses per funded user.</p>
                      <button className="w-full py-5 rounded-2xl bg-white text-emerald-700 font-black text-[13px] uppercase tracking-widest shadow-xl">Contact Manager</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'promo' && (
           <div className="space-y-10">
              <SectionHeading icon={Award} title="Marketing Assets" desc="Premium banners and assets for your promotions" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {promoMaterials.length > 0 ? promoMaterials.map((item, i) => (
                    <div key={`aff-promo-mat-${i}`} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col group hover:shadow-xl transition-all">
                       <div className={`aspect-video rounded-[20px] ${item.color || 'bg-[#1c1d22]'} mb-6 flex flex-col items-center justify-center p-4 text-center overflow-hidden relative shadow-inner`}>
                          {item.imageUrl ? (
                             <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                          ) : (
                             <>
                                <Logo size={32} withBackground className="mb-3" />
                                <div className="text-white font-black text-[18px] tracking-tighter leading-tight drop-shadow-lg">GLOBAL TRADING <br/>LEADER</div>
                             </>
                          )}
                          <div className="absolute bottom-2 left-2 right-2 bg-white/10 backdrop-blur-md rounded-lg py-1 text-[10px] text-white font-black uppercase tracking-[0.2em]">{item.size}</div>
                       </div>
                       
                       <div className="flex items-center justify-between mt-auto">
                          <div>
                             <h4 className="text-[15px] font-black text-[#1c1d22] tracking-tight">{item.label}</h4>
                             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{item.size}</p>
                          </div>
                          <button 
                            onClick={() => {
                                if (item.imageUrl) {
                                    navigator.clipboard.writeText(item.imageUrl);
                                    toast.success('Image link copied');
                                } else {
                                    toast.error('No image URL associated');
                                }
                            }}
                            className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          >
                             <Copy size={18} />
                          </button>
                       </div>
                       <button className="w-full mt-5 bg-gray-50 hover:bg-gray-100 text-[#1c1d22] font-black py-4 rounded-[20px] text-[13px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                          Get Asset Link
                          <ArrowRight size={16} />
                       </button>
                    </div>
                 )) : (
                    [
                        { size: '1080 x 1080', label: 'Instagram Square', color: 'bg-gradient-to-br from-[#1c1d22] to-[#3a3c42]' },
                        { size: '1200 x 628', label: 'Facebook / Twitter', color: 'bg-gradient-to-br from-indigo-900 to-indigo-600' },
                        { size: '728 x 90', label: 'Web Leaderboard', color: 'bg-gradient-to-br from-rose-900 to-rose-600' }
                    ].map((item, i) => (
                        <div key={`mock-promo-${i}`} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col group hover:shadow-xl transition-all opacity-60">
                           <div className={`aspect-video rounded-[20px] ${item.color} mb-6 flex flex-col items-center justify-center p-4 text-center overflow-hidden relative shadow-inner`}>
                              <Logo size={32} withBackground className="mb-3" />
                              <div className="text-white font-black text-[18px] tracking-tighter leading-tight drop-shadow-lg text-center font-sans">MARKETING<br/>ASSET</div>
                              <div className="absolute bottom-2 left-2 right-2 bg-white/10 backdrop-blur-md rounded-lg py-1 text-[10px] text-white font-black uppercase tracking-[0.2em]">{item.size}</div>
                           </div>
                           <div className="flex items-center justify-between mt-auto">
                              <div>
                                 <h4 className="text-[15px] font-black text-[#1c1d22] tracking-tight">{item.label}</h4>
                                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{item.size}</p>
                              </div>
                           </div>
                        </div>
                    ))
                 )}
              </div>
           </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <SectionHeading 
                  icon={ExternalLink} 
                  title="Campaign Management" 
                  desc="High-performance tracking links and traffic funnels" 
                />
                <div className="flex items-center gap-3 bg-gray-100 p-1.5 rounded-2xl border border-gray-100">
                    <button 
                      onClick={() => setCampaignTab('live')}
                      className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${campaignTab === 'live' ? 'bg-[#1c1d22] text-white shadow-xl' : 'text-gray-400 hover:text-[#1c1d22]'}`}
                    >
                      Live Campaigns
                    </button>
                    <button 
                      onClick={() => setCampaignTab('archived')}
                      className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${campaignTab === 'archived' ? 'bg-[#1c1d22] text-white shadow-xl' : 'text-gray-400 hover:text-[#1c1d22]'}`}
                    >
                      Archived
                    </button>
                </div>
             </div>

             <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">
                            <th className="py-8 px-10">Campaign Detail</th>
                            <th className="py-8 px-6">Tracking URL</th>
                            <th className="py-8 px-6 text-center">Clicks</th>
                            <th className="py-8 px-6 text-center">Regs</th>
                            <th className="py-8 px-6 text-center">FTDs</th>
                            <th className="py-8 px-10 text-right">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                         {campaigns.filter(c => campaignTab === 'archived' ? c.isArchived : !c.isArchived).map((camp, i) => {
                            const campRegs = referrals.filter(r => r.referredSub === camp.subId).length;
                            const campFTDs = referrals.filter(r => r.referredSub === camp.subId && (r.totalDeposits || 0) > 0).length;
                            const campClicks = camp.clicks || 0;

                            return (
                             <tr key={`camp-row-${camp.id || i}`} className="group hover:bg-gray-50/50 transition-all">
                               <td className="py-8 px-10">
                                  <div className="flex flex-col">
                                     <span className="text-[15px] font-black text-[#1c1d22] mb-1">{camp.name}</span>
                                     <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.1em]">SubID: {camp.subId}</span>
                                     </div>
                                  </div>
                               </td>
                               <td className="py-8 px-6">
                                  <div className="flex items-center gap-3 bg-gray-50 group-hover:bg-white rounded-xl px-4 py-3 border border-gray-100 min-w-[240px] transition-all">
                                     <span className="text-[12px] font-mono font-bold text-gray-400 truncate flex-1">{getCampaignLink(camp.subId)}</span>
                                     <button 
                                       onClick={() => {
                                          navigator.clipboard.writeText(getCampaignLink(camp.subId));
                                          toast.success('Campaign link copied');
                                       }}
                                       className="text-gray-400 hover:text-indigo-600 transition-colors"
                                     >
                                        <Copy size={16} />
                                     </button>
                                  </div>
                               </td>
                               <td className="py-8 px-6 text-center font-black text-[#1c1d22] text-[15px] tabular-nums">{campClicks}</td>
                               <td className="py-8 px-6 text-center font-black text-[#1c1d22] text-[15px] tabular-nums">{campRegs}</td>
                               <td className="py-8 px-6 text-center font-black text-emerald-500 text-[15px] tabular-nums">{campFTDs}</td>
                               <td className="py-8 px-10 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                     <button 
                                       onClick={async () => {
                                         if (camp.id === 'default') return toast.error('Standard campaign cannot be modified');
                                         try {
                                            await updateDoc(doc(db, 'affiliate_campaigns', camp.id), {
                                              isArchived: !camp.isArchived
                                            });
                                            toast.success(camp.isArchived ? 'Campaign restored' : 'Campaign archived');
                                         } catch (e) {
                                            toast.error('Failed to update campaign status');
                                         }
                                       }}
                                       className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                       title={camp.isArchived ? "Restore" : "Archive"}
                                     >
                                        {camp.isArchived ? <Activity size={18} /> : <History size={18} />}
                                     </button>
                                     {camp.id !== 'default' && (
                                        <button 
                                          onClick={() => {
                                            if (confirm('Are you sure you want to delete this campaign permanently?')) {
                                              deleteCampaign(camp.id);
                                            }
                                          }}
                                          className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                           <X size={18} />
                                        </button>
                                     )}
                                  </div>
                               </td>
                            </tr>
                            );
                         })}
                      </tbody>
                   </table>
                </div>
             </div>

             {/* New Link Generator */}
             <div className="bg-[#1c1d22] rounded-[48px] p-8 md:p-14 text-white relative overflow-hidden group border border-white/5">
                <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-1000"></div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                   <div>
                      <h3 className="text-[32px] font-black leading-tight tracking-tighter mb-6">Create custom <br/>tracking campaigns.</h3>
                      <p className="text-[#8e9299] text-[15px] font-medium leading-relaxed mb-8 opacity-80">Use unique tracking IDs for different traffic sources (YouTube, Telegram, SEO) to calculate accurate ROI.</p>
                      <div className="flex items-center gap-6">
                         <div className="flex flex-col">
                            <span className="text-[18px] font-black text-white">Lifetime</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tracking Cookie</span>
                         </div>
                         <div className="w-[1px] h-10 bg-white/10"></div>
                         <div className="flex flex-col">
                            <span className="text-[18px] font-black text-white">Unlimited</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tracking IDs</span>
                         </div>
                      </div>
                   </div>

                   <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 md:p-10 border border-white/10 shadow-2xl space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-3">
                            <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Friendly Name</label>
                            <input 
                              type="text" 
                              value={newCampaignName}
                              onChange={e => setNewCampaignName(e.target.value)}
                              placeholder="e.g. YouTube Promo"
                              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-indigo-500 text-white font-bold transition-all"
                            />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Tracking SubID</label>
                            <input 
                              type="text" 
                              value={newCampaignSubId}
                              onChange={e => setNewCampaignSubId(e.target.value.replace(/\s+/g, '_'))}
                              placeholder="e.g. yt_01"
                              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-indigo-500 text-indigo-400 font-mono transition-all"
                            />
                         </div>
                      </div>

                      <div className="space-y-3">
                         <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Traffic Hub (Landing Page)</label>
                         <select 
                            value={selectedLandingPage}
                            onChange={e => setSelectedLandingPage(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-indigo-500 text-white font-bold transition-all appearance-none"
                         >
                            <option value="/" className="bg-[#1c1d22]">Main Homepage (Convert focus)</option>
                            <option value="/trade" className="bg-[#1c1d22]">Trading Interface (Direct focus)</option>
                            <option value="/about-us" className="bg-[#1c1d22]">About Us (Trust focus)</option>
                         </select>
                      </div>
                      <button 
                        onClick={addCampaign}
                        className="w-full bg-white hover:bg-gray-100 active:scale-[0.98] text-[#1c1d22] font-black py-6 rounded-2xl text-[15px] uppercase tracking-widest shadow-2xl shadow-indigo-900/20 transition-all flex items-center justify-center gap-3"
                      >
                         <Plus size={20} className="text-indigo-600" />
                         Generate Tracking Campaign
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'sub-affiliates' && (
           <div className="space-y-10">
              <SectionHeading icon={UserPlus} title="Sub-Affiliate Network" desc="Earn 5% flat revenue from traffic referred by your partners" />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
                    <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                       <h3 className="text-[18px] font-black text-[#1c1d22]">Multi-level Partners</h3>
                       <span className="text-[11px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest">2nd Tier Level</span>
                    </div>
                    
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50/30">
                                <th className="px-8 py-5">Partner Email</th>
                                <th className="px-8 py-5">Joined</th>
                                <th className="px-8 py-5">Active Refs</th>
                                <th className="px-8 py-5 text-right">Your Earnings</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                             {subAffiliates.length > 0 ? subAffiliates.map((sub, i) => (
                                 <tr key={`sub-aff-row-${i}`} className="hover:bg-gray-50 transition-colors">
                                   <td className="px-8 py-5">
                                      <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-slate-100 border border-indigo-100 flex items-center justify-center font-black text-[10px] text-indigo-600">
                                            {sub.email?.substring(0, 2).toUpperCase()}
                                         </div>
                                         <span className="font-bold text-[#1c1d22] text-[14px]">{sub.email?.split('@')[0]}***@{sub.email?.split('@')[1]}</span>
                                      </div>
                                   </td>
                                   <td className="px-8 py-5 text-gray-500 font-bold text-[13px]">May {10+i}, 2026</td>
                                   <td className="px-8 py-5 text-[#1c1d22] font-black text-[13px]">{Math.floor(Math.random() * 20)}</td>
                                   <td className="px-8 py-5 text-right font-black text-indigo-600 text-[15px]">$ {(Math.random() * 45).toFixed(2)} [USDT]</td>
                                </tr>
                             )) : (
                                <tr>
                                   <td colSpan={4} className="px-8 py-20 text-center opacity-50">
                                      <div className="flex flex-col items-center gap-4">
                                         <Users size={32} />
                                         <p className="text-[14px] font-black uppercase tracking-widest leading-none">No active sub-partners</p>
                                         <p className="text-[12px] font-medium text-gray-400 max-w-[200px] leading-tight">Partners who sign up through your link appear here.</p>
                                      </div>
                                   </td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-[#1c1d22] rounded-[32px] p-8 text-white relative overflow-hidden border border-white/5">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px]"></div>
                        <h3 className="text-[18px] font-black mb-4 tracking-tight">Refer Other Partners</h3>
                        <p className="text-gray-400 text-[13px] leading-relaxed mb-8">Share this unique invitation with potential affiliates. You'll receive 5% from all revenue generated by their clients.</p>
                        
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between mb-4">
                           <span className="text-[12px] font-mono text-gray-500 font-bold truncate pr-3">{window.location.protocol}//{window.location.host}?ref={referralCode}</span>
                           <button onClick={() => { navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}?ref=${referralCode}`); toast.success('Invite link copied'); }} className="text-indigo-400">
                             <Copy size={16} />
                           </button>
                        </div>
                        
                        <div className="pt-6 border-t border-white/5">
                           <div className="flex justify-between items-center mb-2">
                              <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Network Commission</span>
                              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Fixed 5%</span>
                           </div>
                        </div>
                    </div>

                    <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-500/20">
                        <h4 className="font-black text-[17px] mb-4">Partner Strategy</h4>
                        <p className="text-indigo-100 text-[13px] leading-relaxed opacity-90">"Recruiting top-tier sub-affiliates is the fastest way to build passive income. Focus on bloggers and channel owners."</p>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'payouts' && (
            <div className="space-y-10">
               <SectionHeading icon={Wallet} title="Payout Manager" desc="Request tax-free withdrawals or track your partner earning dispersals" />

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Balance Card */}
                  <div className="bg-[#1c1d22] text-white rounded-[32px] p-8 relative overflow-hidden shadow-xl shadow-indigo-950/20">
                     <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
                     <p className="text-[11px] font-black uppercase tracking-widest text-indigo-300 mb-2">Available Balance</p>
                     <h3 className="text-[36px] font-black tracking-tight mb-6">$ {getConvertedBalance(affiliateBalance, '$').toFixed(2)}</h3>
                     <div className="flex gap-3">
                        <button 
                          onClick={handleTransferEarnings}
                          disabled={affiliateBalance <= 0}
                          className="flex-1 bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-white/10 text-white font-black py-3 rounded-2xl text-[12px] uppercase tracking-wider transition-all"
                        >
                           Instant Transfer
                        </button>
                     </div>
                  </div>

                  {/* Completed Payouts */}
                  <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                     <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Completed Cashouts</p>
                        <h3 className="text-[36px] font-black text-[#1c1d22] tracking-tight">
                          $ {
                             getConvertedBalance(
                               payoutRequests
                                 .filter(p => p.status === 'completed')
                                 .reduce((acc, curr) => acc + (curr.amount || 0), 0),
                               '$'
                             ).toFixed(2)
                          }
                        </h3>
                     </div>
                     <p className="text-[12px] text-gray-400 font-bold mt-4">Processed through verified secure checkout gateways</p>
                  </div>

                  {/* Pending Payouts */}
                  <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                     <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Pending Dispersals</p>
                        <h3 className="text-[36px] font-black text-amber-500 tracking-tight">
                          $ {
                             getConvertedBalance(
                               payoutRequests
                                 .filter(p => p.status === 'pending')
                                 .reduce((acc, curr) => acc + (curr.amount || 0), 0),
                               '$'
                             ).toFixed(2)
                          }
                        </h3>
                     </div>
                     <p className="text-[12px] text-gray-400 font-bold mt-4">Audited and processed by security within 2 hours</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Form Block */}
                  <div className="lg:col-span-1 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                     <h3 className="text-[18px] font-black text-[#1c1d22] mb-6 flex items-center gap-2">
                        <ArrowUpRight className="text-indigo-600" size={20} />
                        Withdraw Earnings
                     </h3>

                     <form onSubmit={handleRequestPayout} className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Payout Gateway</label>
                           <select 
                             value={payoutGateway}
                             onChange={(e) => setPayoutGateway(e.target.value)}
                             className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500 font-bold text-[#1c1d22] transition-colors"
                          >
                             
                             
                             
                             <option value="USDT (TRC-20)">USDT Crypto (TRC-20)</option>
                             
                           </select>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Cashout Amount (USDT)</label>
                           <input 
                             type="number" 
                             step="any"
                             value={payoutAmount}
                             onChange={(e) => setPayoutAmount(e.target.value)}
                             placeholder={`Min $10`}
                             className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500 font-black text-[#1c1d22] transition-all"
                           />
                           <p className="text-[10px] text-gray-400 font-bold ml-1">
                              Your Balance: ${getConvertedBalance(affiliateBalance, '$').toFixed(2)}
                           </p>
                        </div>

                        {/* Conditional details input */}
                        {false && (
                           <div className="space-y-2">
                              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{payoutGateway} Wallet Number</label>
                              <input 
                                type="text" 
                                value={payoutDetails.mobileNumber}
                                onChange={(e) => setPayoutDetails({...payoutDetails, mobileNumber: e.target.value})}
                                placeholder="e.g. 01XXXXXXXXX"
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500 font-mono text-[#1c1d22] transition-all"
                              />
                           </div>
                        )}

                        {payoutGateway === 'USDT (TRC-20)' && (
                           <div className="space-y-2">
                              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">USDT TRC-20 Destination Address</label>
                              <input 
                                type="text" 
                                value={payoutDetails.walletAddress}
                                onChange={(e) => setPayoutDetails({...payoutDetails, walletAddress: e.target.value})}
                                placeholder="e.g. Txxxxxxxxxxxxxxxxxxxxxxxxx"
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500 font-mono text-[12px] text-[#1c1d22] transition-all"
                              />
                           </div>
                        )}

                        {false && (
                           <div className="space-y-4 pt-1 font-sans">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank Name</label>
                                 <input 
                                   type="text" 
                                   value={payoutDetails.bankName}
                                   onChange={(e) => setPayoutDetails({...payoutDetails, bankName: e.target.value})}
                                   placeholder="e.g. Dutch Bangla Bank"
                                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-indigo-500 text-[13px] font-bold text-[#1c1d22]"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank Branch Name</label>
                                 <input 
                                   type="text" 
                                   value={payoutDetails.branchName}
                                   onChange={(e) => setPayoutDetails({...payoutDetails, branchName: e.target.value})}
                                   placeholder="e.g. Banani Branch"
                                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-indigo-500 text-[13px] font-bold text-[#1c1d22]"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Number</label>
                                 <input 
                                   type="text" 
                                   value={payoutDetails.accountNumber}
                                   onChange={(e) => setPayoutDetails({...payoutDetails, accountNumber: e.target.value})}
                                   placeholder="e.g. 123.456.7890"
                                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-indigo-500 font-mono text-[13px] text-[#1c1d22]"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Name</label>
                                 <input 
                                   type="text" 
                                   value={payoutDetails.accountName}
                                   onChange={(e) => setPayoutDetails({...payoutDetails, accountName: e.target.value})}
                                   placeholder="e.g. Tanvir Rahman"
                                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-indigo-500 text-[13px] font-bold text-[#1c1d22]"
                                 />
                              </div>
                           </div>
                        )}

                        <button 
                          type="submit" 
                          disabled={isSubmittingPayout || affiliateBalance <= 0}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-[13px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/10 flex items-center justify-center gap-2"
                        >
                           {isSubmittingPayout ? 'Processing...' : 'Submit Cashout Request'}
                        </button>
                     </form>
                  </div>

                  {/* History Table block */}
                  <div className="lg:col-span-2 bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
                     <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="text-[18px] font-black text-[#1c1d22]">Withdrawal Audits</h3>
                        <span className="text-[11px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest font-mono">Global Ledger</span>
                     </div>

                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50/30 font-mono">
                                 <th className="px-8 py-5">Initiated</th>
                                 <th className="px-8 py-5 text-right">Amount</th>
                                 <th className="px-8 py-5">Mechanism</th>
                                 <th className="px-8 py-5">Details</th>
                                 <th className="px-8 py-5">Verification</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                              {payoutRequests.length > 0 ? (
                                 payoutRequests.map((req, i) => {
                                    const dateStr = (req.createdAt && typeof req.createdAt.toDate === 'function') 
                                         ? req.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                                         : 'Pending';
                                    return (
                                        <tr key={`payout-req-row-${i}`} className="hover:bg-gray-50/50 transition-colors">
                                          <td className="px-8 py-5 text-[13px] text-gray-500 font-bold">{dateStr}</td>
                                          <td className="px-8 py-5 text-right font-black text-[#1c1d22] text-[14px]">
                                             $ {getConvertedBalance(req.amount || 0, '$').toFixed(2)}
                                          </td>
                                          <td className="px-8 py-5">
                                             <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-gray-100 text-gray-600 font-mono">
                                                {req.gateway}
                                             </span>
                                          </td>
                                          <td className="px-8 py-5 text-[12px] font-semibold text-gray-500 max-w-[180px] truncate" title={req.details}>
                                             {req.details}
                                          </td>
                                          <td className="px-8 py-5">
                                             {req.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-50 text-amber-600 uppercase tracking-widest">
                                                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                                   Auditing
                                                </span>
                                             )}
                                             {req.status === 'completed' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-600 uppercase tracking-widest">
                                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                   Disbursed
                                                </span>
                                             )}
                                             {req.status === 'rejected' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-50 text-rose-600 uppercase tracking-widest" title={req.rejectReason || 'Security audit failed'}>
                                                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                   Rejected
                                                </span>
                                             )}
                                          </td>
                                       </tr>
                                    );
                                 })
                              ) : (
                                 <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold">
                                       No withdrawal dispersals found
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'support' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SectionHeading 
                icon={MessageSquare} 
                title="Partner Support Hub" 
                desc="Direct connection to our affiliate relations team" 
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                       <h3 className="text-[18px] font-black text-[#1c1d22] mb-6 flex items-center gap-2">
                          <Zap className="text-amber-500" size={20} />
                          New Discovery
                       </h3>
                       <div className="space-y-4">
                          <div className="space-y-2">
                             <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                             <input 
                                type="text"
                                value={ticketSubject}
                                onChange={(e) => setTicketSubject(e.target.value)}
                                placeholder="e.g. Traffic scaling advice"
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500 font-bold text-[#1c1d22]"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Message</label>
                             <textarea 
                                value={ticketMessage}
                                onChange={(e) => setTicketMessage(e.target.value)}
                                rows={4}
                                placeholder="How can we help you grow today?"
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500 font-medium text-[#1c1d22] resize-none"
                             />
                          </div>
                          <button 
                             onClick={() => {
                                if (!ticketSubject.trim() || !ticketMessage.trim()) return toast.error("Please fill all fields");
                                createSupportTicket(ticketSubject, ticketMessage);
                                setTicketSubject("");
                                setTicketMessage("");
                             }}
                             className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl text-[13px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/10 flex items-center justify-center gap-2"
                          >
                             Open Partner Ticket
                          </button>
                       </div>
                    </div>

                    <div className="bg-[#1c1d22] rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5 group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-[40px]"></div>
                        <h4 className="text-[16px] font-black uppercase tracking-widest mb-4">Elite Concierge</h4>
                        <p className="text-gray-400 text-[13px] leading-relaxed mb-6">Platinum partners with over 200 leads get access to a 24/7 dedicated account manager via Telegram.</p>
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                           <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                              <Star size={18} fill="white" />
                           </div>
                           <div>
                              <div className="text-[12px] font-black">Telegram VIP</div>
                              <div className="text-[10px] text-gray-500 font-bold uppercase">Locked for Starter</div>
                           </div>
                        </div>
                    </div>
                 </div>

                 <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
                       <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                          <h3 className="text-[18px] font-black text-[#1c1d22]">My Support Logs</h3>
                          <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-3 py-1 rounded-full uppercase tracking-widest">{userTickets.length} Tickets</span>
                       </div>
                       
                       <div className="divide-y divide-gray-50">
                          {userTickets.length > 0 ? (
                             userTickets.map((ticket, i) => (
                                <div 
                                   key={`ticket-row-${i}`}
                                   onClick={() => {
                                      setSelectedTicket(ticket);
                                      setActiveTab('support-detail');
                                   }}
                                   className="p-6 hover:bg-gray-50 transition-all cursor-pointer group"
                                >
                                   <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-3">
                                         <div className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                         <h4 className="text-[15px] font-black text-[#1c1d22] group-hover:text-indigo-600 transition-colors">{ticket.subject}</h4>
                                      </div>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                         {new Date(ticket.updatedAt).toLocaleDateString()}
                                      </span>
                                   </div>
                                   <p className="text-[13px] text-gray-500 font-medium truncate opacity-70 mb-3">{ticket.lastMessage || 'Open discussion...'}</p>
                                   <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${ticket.status === 'open' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                         {ticket.status}
                                      </span>
                                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">•</span>
                                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ref: {ticket.id.substring(0,6)}</span>
                                   </div>
                                </div>
                             ))
                          ) : (
                             <div className="p-20 text-center space-y-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                   <MessageSquare size={32} />
                                </div>
                                <div className="text-gray-400 font-bold uppercase text-[12px] tracking-widest">No active support data</div>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'support-detail' && selectedTicket && (
           <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 flex flex-col h-[700px]">
                 {/* Detail Header */}
                 <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                       <button 
                          onClick={() => { setActiveTab('support'); setSelectedTicket(null); }}
                          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                       >
                          <ChevronDown className="rotate-90" size={20} />
                       </button>
                       <div>
                          <h3 className="text-[18px] font-black text-[#1c1d22] leading-none mb-1">{selectedTicket.subject}</h3>
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Agent Active</span>
                          </div>
                       </div>
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                       ID: {selectedTicket.id.substring(0,8)}
                    </div>
                 </div>

                 {/* Message Scroller */}
                 <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-gray-50/30">
                    {ticketMessages.map((msg, i) => {
                       const isStaff = msg.senderType === 'support';
                       return (
                          <div key={`msg-${i}`} className={`flex ${isStaff ? 'justify-start' : 'justify-end'}`}>
                             <div className={`max-w-[80%] ${isStaff ? 'bg-white border border-gray-100 shadow-sm' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/10'} p-5 rounded-[24px] rounded-tl-none`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${isStaff ? 'text-indigo-400' : 'text-indigo-200'}`}>
                                   {isStaff ? 'Bivaax Support' : 'You'}
                                </div>
                                <p className="text-[14px] font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                <div className={`text-[9px] font-bold mt-2 text-right ${isStaff ? 'text-gray-300' : 'text-indigo-300'}`}>
                                   {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                             </div>
                          </div>
                       );
                    })}
                    {isBotTyping && (
                       <div className="flex justify-start">
                          <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-[20px] rounded-tl-none flex gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-gray-200 animate-bounce"></div>
                             <div className="w-1.5 h-1.5 rounded-full bg-gray-200 animate-bounce [animation-delay:0.2s]"></div>
                             <div className="w-1.5 h-1.5 rounded-full bg-gray-200 animate-bounce [animation-delay:0.4s]"></div>
                          </div>
                       </div>
                    )}
                 </div>

                 {/* Reply Box */}
                 <div className="p-8 border-t border-gray-100 bg-white">
                    <div className="relative">
                       <textarea 
                          value={ticketReply}
                          onChange={(e) => setTicketReply(e.target.value)}
                          onKeyDown={(e) => {
                             if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendTicketMessage();
                             }
                          }}
                          placeholder="Type your response..."
                          className="w-full bg-gray-50 border border-gray-100 rounded-[28px] px-8 py-5 pr-16 focus:outline-none focus:border-indigo-500 font-medium text-[#1c1d22] resize-none h-[80px]"
                       />
                       <button 
                          onClick={sendTicketMessage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
                       >
                          <ArrowRight size={20} />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'faq' && (
           <div className="max-w-3xl mx-auto space-y-12">
              <div className="text-center">
                 <h2 className="text-[32px] font-black tracking-tighter text-[#1c1d22] mb-3">Partner FAQ</h2>
                 <p className="text-[15px] text-gray-500 font-medium">Everything you need to know about the Bivaax Affiliate Program</p>
              </div>

              <div className="space-y-4">
                 {[
                    { q: "How much commission can I earn?", a: "We offer a flat 50% revenue share for our elite partners. This means you earn half of the platform revenue from every trade executed by your referred clients, forever." },
                    { q: "When are the payouts processed?", a: "Payouts are processed instantly. Once your affiliate balance reaches $10, you can request a secure withdrawal to your verified USDT (TRC-20) wallet address. Processing typically takes less than 2 hours." },
                    { q: "Where can I find my referral link?", a: "Your personal affiliate link is available on your dashboard. You can copy it with one click and share it anywhere. Your unique referral ID is embedded in the link to ensure every registration is tracked to you." },
                    { q: "Is there a limit to how many people I can refer?", a: "Absolutely not. You can refer an unlimited number of users. The more people join your network, the higher your potential lifetime earnings." },
                    { q: "How do I get marketing materials?", a: "Head over to the 'Promo' tab to download a variety of high-quality banners, videos, and our official brand kit. We update these assets weekly to help you improve your conversion rates." }
                 ].map((item, i) => (
                    <div key={`aff-pdf-guide-${i}`} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:border-indigo-100 transition-all group">
                       <h4 className="text-[17px] font-black text-[#1c1d22] mb-3 tracking-tight flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform"></div>
                          {item.q}
                       </h4>
                       <p className="text-[15px] text-gray-500 leading-relaxed font-medium pl-5">{item.a}</p>
                    </div>
                 ))}
              </div>

              <div className="bg-[#1c1d22] rounded-[32px] p-8 md:p-10 text-white text-center shadow-xl border border-white/5">
                 <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400">
                    <MessageSquare size={32} />
                 </div>
                 <h3 className="text-[22px] font-black tracking-tight mb-3">Still have questions?</h3>
                 <p className="text-gray-400 text-[15px] max-w-sm mx-auto mb-8">Our dedicated Affiliate Managers are available 24/7 to help you optimize your campaigns.</p>
                 <button className="bg-white text-[#1c1d22] font-black px-10 py-5 rounded-[22px] text-[15px] uppercase tracking-widest hover:bg-gray-100 transition-all transform active:scale-95 shadow-xl shadow-black/20">
                    Contact Support
                 </button>
              </div>
           </div>
        )}

      </main>

      {/* Profile Sidebar Drawer (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsSidebarOpen(false)}
               className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div 
               initial={{ x: "100%" }}
               animate={{ x: 0 }}
               exit={{ x: "100%" }}
               transition={{ type: "spring", damping: 30, stiffness: 300 }}
               className="fixed top-0 right-0 w-[280px] h-full bg-[#1c1d22] z-[210] p-6 text-white shadow-2xl"
            >
               <div className="flex items-center justify-between mb-10">
                 <Logo size={28} withBackground />
                 <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-white/5 rounded-full text-gray-400">
                    <X size={20} />
                 </button>
               </div>

               <div className="space-y-2">
                 {menuItems.map(item => (
                   <button 
                     key={item.id} 
                     onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                     className={`w-full text-left py-4 px-5 rounded-2xl flex items-center gap-3 text-[14px] font-black transition-all uppercase tracking-widest ${activeTab === item.id ? 'bg-white/10 text-emerald-400 shadow-inner' : 'text-gray-400 hover:text-white'}`}
                   >
                     <item.icon size={18} />
                     {item.label}
                   </button>
                 ))}
                 
                 <div className="pt-10 border-t border-white/5 space-y-4 mt-4">
                    <div className="p-5 bg-white/5 rounded-[24px] border border-white/5">
                       <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1">Affiliate Balance</p>
                       <p className="text-[26px] font-black">$ {affiliateBalance.toFixed(2)}</p>
                    </div>
                    <button onClick={handleTransferEarnings} className="w-full bg-[#00dc74] text-[#0c0d12] font-black py-5 rounded-[22px] uppercase tracking-widest text-[14px] shadow-lg shadow-[#00dc74]/10">
                       Transfer to Main
                    </button>
                 </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Nav Mobile */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-gray-100 lg:hidden flex items-center justify-around z-[50] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe px-4">
         {[
           { id: 'dashboard', icon: Zap, label: 'Dash' },
           { id: 'statistics', icon: BarChart3, label: 'Stats' },
           { id: 'promo', icon: Award, label: 'Media' },
           { id: 'support', icon: MessageSquare, label: 'Support' },
           { id: 'faq', icon: HelpCircle, label: 'Help' }
         ].map((item) => (
           <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id as any)}
            className={`relative flex flex-col items-center gap-1 font-black uppercase text-[10px] tracking-[0.1em] transition-all duration-300 py-1 flex-1 ${activeTab === item.id ? 'text-indigo-600' : 'text-gray-400 opacity-70'}`}
           >
              {activeTab === item.id && (
                 <motion.div 
                    layoutId="activeBottomTab"
                    className="absolute -top-1 w-8 h-1 bg-indigo-600 rounded-full"
                 />
              )}
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className={activeTab === item.id ? 'scale-110 mb-0.5' : ''} />
              <span className={activeTab === item.id ? 'font-black' : 'font-bold'}>{item.label}</span>
           </button>
         ))}
      </div>
      
      {/* Earnings Calculator Modal */}
      <AnimatePresence>
        {showCalculator && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCalculator(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="bg-[#1c1d22] p-8 md:p-10 text-white relative overflow-hidden">
                 <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[60px]"></div>
                 <button 
                  onClick={() => setShowCalculator(false)}
                  className="absolute right-6 top-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/5 hover:bg-white/10"
                 >
                   <X size={20} />
                 </button>
                 <h2 className="text-[28px] font-black tracking-tight mb-2">Earnings Calculator</h2>
                 <p className="text-gray-400 font-medium text-[15px]">Estimate your potential revenue share earnings</p>
              </div>

              <div className="p-8 md:p-10 space-y-8">
                 <div className="space-y-6">
                    <div>
                       <div className="flex items-center justify-between mb-4">
                          <label className="text-[13px] font-black text-[#1c1d22] uppercase tracking-[0.15em]">Referrals Count</label>
                          <span className="text-indigo-600 font-black text-[18px]">{calcValues.referrals}</span>
                       </div>
                       <input 
                          type="range" 
                          min="1" 
                          max="500" 
                          value={calcValues.referrals}
                          onChange={(e) => setCalcValues({ ...calcValues, referrals: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                       />
                    </div>

                    <div>
                       <div className="flex items-center justify-between mb-4">
                          <label className="text-[13px] font-black text-[#1c1d22] uppercase tracking-[0.15em]">Month Volume / Ref</label>
                          <span className="text-indigo-600 font-black text-[18px]">$ {calcValues.volumePerRef}</span>
                       </div>
                       <input 
                          type="range" 
                          min="100" 
                          max="10000" 
                          step="100"
                          value={calcValues.volumePerRef}
                          onChange={(e) => setCalcValues({ ...calcValues, volumePerRef: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100">
                       <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Network Volume</p>
                       <p className="text-[22px] font-black text-[#1c1d22]">$ {(calcValues.referrals * calcValues.volumePerRef).toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-[24px] border border-emerald-100">
                       <p className="text-[11px] font-black text-emerald-600/70 uppercase tracking-widest mb-1">Your Monthly Share</p>
                       <p className="text-[22px] font-black text-emerald-600">$ {((calcValues.referrals * calcValues.volumePerRef) * (getTier().share / 100)).toLocaleString()}</p>
                    </div>
                 </div>

                 <button 
                  onClick={() => { setShowCalculator(false); setActiveTab('links'); }}
                  className="w-full bg-[#1c1d22] text-white font-black py-5 rounded-[22px] text-[15px] uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98] shadow-2xl shadow-indigo-500/10"
                 >
                   Start Earning Today
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Desktop */}
      <footer className="hidden md:block border-t border-gray-200 mt-28 py-14 bg-white">
        <div className="max-w-7xl mx-auto px-10 flex flex-col gap-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Logo size={24} />
               <span className="font-black tracking-tighter text-[20px] text-[#1c1d22]">BIVAAX</span>
            </div>
            <div className="flex items-center gap-10">
               {['About Network', 'Partner Terms', 'Support', 'Asset Center'].map(item => (
                 <button key={item} className="text-[12px] font-black text-gray-400 hover:text-[#1c1d22] transition-colors tracking-widest uppercase">{item}</button>
               ))}
            </div>
            <p className="text-[12px] font-black text-gray-400 tracking-widest uppercase">© 2026 BIVAAX • GLOBAL PARTNER NETWORK</p>
          </div>
          <div className="text-[11px] text-gray-400 leading-relaxed font-medium pt-8 border-t border-gray-50 border-dashed">
            The Bivaax Partner Program is subject to the Affiliate Terms of Service. Commissions are calculated based on net revenue generated by referred clients. Elite status is granted based on volume performance.
          </div>
        </div>
      </footer>
    </div>
  );
}
