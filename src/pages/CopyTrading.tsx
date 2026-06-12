import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, increment, addDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, TrendingUp, TrendingDown, Clock, Search, Bell, 
  ChevronRight, Target, Shield, Info, ArrowLeft, Star, Heart,
  Zap, Share2, Award, UserCheck, X, CheckCircle2, AlertTriangle, Activity,
  ChevronDown, Minus, Plus, Wallet, History, Trophy, RefreshCw, List, LayoutGrid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import { formatWithCurrency, convertFromBase, convertToBase } from '../lib/currencies';

export default function CopyTrading() {
  const navigate = useNavigate();
  const [masters, setMasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrader, setSelectedTrader] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'traders' | 'my-card'>('traders');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('winRate'); // 'winRate' | 'followers' | 'totalProfit'
  const [userBalance, setUserBalance] = useState(0);
  const [userCurrency, setUserCurrency] = useState(() => {
    try {
      return localStorage.getItem('user_display_currency') || 'BDT';
    } catch (e) {
      return 'BDT';
    }
  });
  const [activeCopies, setActiveCopies] = useState<any[]>([]);
  const [liveCopyProfit, setLiveCopyProfit] = useState<{[key: string]: number}>({});
  const [viewMode, setViewMode] = useState<'leaderboard' | 'grid'>('leaderboard');
  const [liveFeedText, setLiveFeedText] = useState(`User *7392 just allocated ${formatWithCurrency(1500, userCurrency)} to CRISHTTRADER (Auto-sync connected)`);

  // Live activity ticker updates
  useEffect(() => {
    const feeds = [
      `User *1849 just allocated ${formatWithCurrency(1000, userCurrency)} to CRISHTTRADER`,
      "User *9320 completed a CALL deal with 88% payout via ALBERT",
      `User *8391 stopped contract with OBOROTEN (+${formatWithCurrency(12490, userCurrency)} net profit earned)`,
      `User *7050 setup a new Copy-Allocation of ${formatWithCurrency(5000, userCurrency)} with BINANCE WHALE`,
      "TRADEMINATOR weekly gain rate increased to +135.2% in live sessions",
      "ALEX FOREX secured continuous 112 wins in standard VIP pool",
      "User *4401 initialized copy option: limit 100 deals on ELENA_RU",
      `User *3201 earned +${formatWithCurrency(450, userCurrency)} from SANJAY FX news-straddle session`,
      `User *6682 copied VIP contract OBOROTEN (Result: SUCCESS +${formatWithCurrency(92, userCurrency)})`
    ];
    const feedInterval = setInterval(() => {
      const randomFeed = feeds[Math.floor(Math.random() * feeds.length)];
      setLiveFeedText(randomFeed);
    }, 4500);
    return () => clearInterval(feedInterval);
  }, []);

  // Copy Settings State
  const [copyingAmount, setCopyingAmount] = useState(200);
  const [tradesLimit, setTradesLimit] = useState(50);
  const [maxTradeAmount, setMaxTradeAmount] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Setup Auth & Dynamic Balance & Active Portfolio sub collection snapshots
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
        if (user) {
            // Live User Balance and Currency Subscription
            const userSub = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserBalance(data.balance || 0);
                    if (data.currency) {
                        setUserCurrency(data.currency);
                        try {
                            localStorage.setItem('user_display_currency', data.currency);
                        } catch(e) {}
                    }
                }
            });

            // Live Copied Portfolios Subscription
            const copiesRef = collection(db, 'users', user.uid, 'activeCopies');
            const copiesSub = onSnapshot(query(copiesRef, orderBy('startedAt', 'desc')), (snap) => {
                const copies = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setActiveCopies(copies);
            }, (error) => {
                console.error("Error loading active portfolios:", error);
            });

            return () => {
                userSub();
                copiesSub();
            };
        } else {
            setUserBalance(0);
            setActiveCopies([]);
        }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Fetch Master Traders List from Firestore
  useEffect(() => {
    const q = query(collection(db, 'masterTraders'), orderBy('winRate', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
        if (snap.empty) {
            setMasters([]);
        } else {
            setMasters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        
        // Artificial delay to make loading look more realistic/sync-heavy as requested
        setTimeout(() => {
            setLoading(false);
        }, 4000);
    });

    return () => unsub();
  }, []);

  // 3. Complete Seeding for Pro Master Traders individually if they do not exist
  useEffect(() => {
    if (!loading) {
        const seedMasters = async () => {
            const traders = [
                { name: 'CRISHTTRADER', country: '🇻🇪', isVip: false, copiersCount: 6, maxCopiers: 100, gainPerWeek: '≥ 200%', copiedTrades: 234, commission: '10%', profitRate: 73, lossRate: 27, winRate: 88, totalProfit: 45000, strategy: 'Trend Reversal Expert', level: 'Standard', riskIndex: 3 },
                { name: 'OBOROTEN', country: '🇺🇦', isVip: true, copiersCount: 13, maxCopiers: 100, gainPerWeek: '43%', copiedTrades: 379, commission: '10%', profitRate: 71, lossRate: 29, winRate: 81, totalProfit: 86000, strategy: 'Crypto Momentum', level: 'VIP', riskIndex: 2 },
                { name: 'GEOVANNY', country: '🇨🇴', isVip: true, copiersCount: 5, maxCopiers: 100, gainPerWeek: '30%', copiedTrades: 112, commission: '10%', profitRate: 70, lossRate: 30, winRate: 74, totalProfit: 12000, strategy: 'Sniper Entry Scalping', level: 'VIP', riskIndex: 4 },
                { name: 'ALEX FOREX', country: '🇬🇧', isVip: true, copiersCount: 38, maxCopiers: 150, gainPerWeek: '115%', copiedTrades: 546, commission: '8%', profitRate: 84, lossRate: 16, winRate: 92, totalProfit: 125000, strategy: 'Pure Price Action Swing', level: 'VIP', riskIndex: 1 },
                { name: 'YUKI T', country: '🇯🇵', isVip: false, copiersCount: 19, maxCopiers: 80, gainPerWeek: '38%', copiedTrades: 195, commission: '10%', profitRate: 75, lossRate: 25, winRate: 79, totalProfit: 32000, strategy: 'Grid Trading System', level: 'Standard', riskIndex: 3 },
                { name: 'BINANCE WHALE', country: '🇸🇬', isVip: true, copiersCount: 71, maxCopiers: 200, gainPerWeek: '160%', copiedTrades: 890, commission: '12%', profitRate: 79, lossRate: 21, winRate: 85, totalProfit: 240000, strategy: 'Crypto Swing Options', level: 'VIP', riskIndex: 5 },
                { name: 'ALPHA SCALPER', country: '🇺🇸', isVip: false, copiersCount: 22, maxCopiers: 120, gainPerWeek: '47%', copiedTrades: 310, commission: '10%', profitRate: 72, lossRate: 28, winRate: 76, totalProfit: 54000, strategy: 'Scalp Entry Arbitrage', level: 'Standard', riskIndex: 4 },
                { name: '181824019', country: '🇨🇴', isVip: true, copiersCount: 5, maxCopiers: 50, gainPerWeek: '69%', copiedTrades: 84, commission: '5%', profitRate: 71, lossRate: 29, winRate: 78, totalProfit: 5400, strategy: 'Aggressive Small Account Grow', level: 'VIP', riskIndex: 5 },
                { name: 'ELENA_RU', country: '🇷🇺', isVip: true, copiersCount: 29, maxCopiers: 100, gainPerWeek: '84%', copiedTrades: 420, commission: '10%', profitRate: 81, lossRate: 19, winRate: 83, totalProfit: 95000, strategy: 'Gold & Crude Breakouts', level: 'VIP', riskIndex: 3 },
                { name: 'SANJAY FX', country: '🇮🇳', isVip: false, copiersCount: 11, maxCopiers: 100, gainPerWeek: '52%', copiedTrades: 140, commission: '5%', profitRate: 74, lossRate: 26, winRate: 80, totalProfit: 18000, strategy: 'Macro News Straddle Strategy', level: 'Standard', riskIndex: 2 },
                { name: 'TRADEMINATOR', country: '🇧🇩', isVip: true, copiersCount: 42, maxCopiers: 150, gainPerWeek: '135%', copiedTrades: 620, commission: '10%', profitRate: 85, lossRate: 15, winRate: 89, totalProfit: 155000, strategy: 'Bangladesh Confluence Method', level: 'VIP', riskIndex: 2 },
                { name: 'LUC TRADER', country: '🇫🇷', isVip: false, copiersCount: 8, maxCopiers: 80, gainPerWeek: '28%', copiedTrades: 92, commission: '7%', profitRate: 68, lossRate: 32, winRate: 75, totalProfit: 21000, strategy: 'Fib Retracement Swing Trading', level: 'Standard', riskIndex: 3 }
            ];
            for (const t of traders) {
                const alreadyExists = masters.some(m => m.name.toUpperCase() === t.name.toUpperCase());
                if (!alreadyExists) {
                    await addDoc(collection(db, 'masterTraders'), { 
                        ...t, 
                        history: generateHistory(),
                        performanceData: generatePerformance()
                    });
                }
            }
        };
        seedMasters();
    }
  }, [loading, masters]);

  // 4. Simulated Active Portfolio profit fluctuations to make the client space look professional and live
  useEffect(() => {
    if (activeCopies.length === 0) return;

    // Initialize profits
    setLiveCopyProfit(prev => {
        const next = { ...prev };
        activeCopies.forEach(copy => {
            if (next[copy.id] === undefined) {
                // Initialize based on copied amount - can start slightly negative or positive
                const startBias = (Math.random() > 0.4) ? 0.01 : -0.01;
                next[copy.id] = parseFloat((copy.amount * (startBias + (Math.random() - 0.5) * 0.04)).toFixed(2));
            }
        });
        return next;
    });

    const profitInterval = setInterval(() => {
        setLiveCopyProfit(prev => {
            const next = { ...prev };
            activeCopies.forEach(copy => {
                if (next[copy.id] !== undefined) {
                    // Use the master's rates to influence the bias
                    // If profitRate is 75, offset is 0.42 -> avg increase
                    // If profitRate is 50, offset is 0.5 -> neutral
                    const profitRate = copy.profitRate || 75;
                    const bias = 1 - (profitRate / 100) * 0.8; // e.g., 75% -> 0.4, 50% -> 0.6
                    const fluctuation = (Math.random() - bias) * (copy.amount * 0.005); 
                    next[copy.id] = parseFloat((next[copy.id] + fluctuation).toFixed(2));
                }
            });
            return next;
        });
    }, 4500);

    return () => clearInterval(profitInterval);
  }, [activeCopies]);

  const generateHistory = () => {
    const assets = ['Crypto IDX', 'EUR/USD', 'GBP/JPY', 'Gold', 'BTC/USD'];
    return Array.from({ length: 15 }).map((_, i) => ({
      id: `history-${i}`,
      asset: assets[Math.floor(Math.random() * assets.length)],
      type: Math.random() > 0.5 ? 'CALL' : 'PUT',
      amount: (Math.random() * 500 + 100).toFixed(2),
      payout: 82,
      result: Math.random() > 0.3 ? 'won' : 'lost',
      time: '20:23:00',
      profit: (Math.random() * 1000 + 200).toFixed(2)
    }));
  };

  const generatePerformance = () => {
    return Array.from({ length: 8 }).map((_, i) => ({
        name: (i + 1).toString(),
        value: 400 + Math.random() * 1100
    }));
  };

  // 5. Deduct balance from Wallet, add active copy item, increment copiers
  const handleStartCopying = async () => {
    if (!auth.currentUser) {
        toast.error("Please login to start copy trading");
        return;
    }
    if (userBalance < copyingAmount) {
        toast.error("Insufficient balance to copy. Please deposit funds first.");
        return;
    }

    setIsSubmitting(true);
    // Explicitly longer synchronization delay for copy setup
    await new Promise(resolve => setTimeout(resolve, 4500));
    try {
        const batchCopyId = `copy-${Date.now()}`;
        
        // Subtract funds from main wallet balance
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            balance: increment(-copyingAmount)
        });

        // Store copy metadata inside activeCopies nested sub collection
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'activeCopies'), {
            masterId: selectedTrader.id,
            masterName: selectedTrader.name,
            country: selectedTrader.country || '🌍',
            amount: copyingAmount,
            tradesLimit,
            maxTradeAmount,
            status: 'active',
            strategy: selectedTrader.strategy || 'Momentum Strategy',
            profitRate: selectedTrader.profitRate || 75,
            lossRate: selectedTrader.lossRate || 25,
            winRate: selectedTrader.winRate || 75,
            startedAt: serverTimestamp()
        });

        // Increment the global copies counter of the Master Trader
        await updateDoc(doc(db, 'masterTraders', selectedTrader.id), {
            copiersCount: increment(1)
        });

        toast.success(`Active! Successfully copying ${selectedTrader.name}`);
        setSelectedTrader(null);
        setActiveTab('my-card');
    } catch (err) {
        console.error(err);
        toast.error("Failed to start copy trading");
    } finally {
        setIsSubmitting(false);
    }
  };

  // 6. Return balance to Wallet, delete copied reference, decrement copiers
  const handleStopCopying = async (copyId: string, masterId: string, returnAmount: number, name: string) => {
    if (!auth.currentUser) return;
    const confirmStop = window.confirm(`Stop copy contract with ${name}? Your invested budget of ${formatWithCurrency(returnAmount, userCurrency)} will be instantly refunded to your wallet.`);
    if (!confirmStop) return;

    try {
        // Delete the active copy relationship
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'activeCopies', copyId));

        // Refund the entire investment amount to the user's account
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            balance: increment(returnAmount)
        });

        // Decrement copier count of master
        if (masterId) {
            await updateDoc(doc(db, 'masterTraders', masterId), {
                copiersCount: increment(-1)
            });
        }

        toast.success(`Subscription ended. Refunded ${formatWithCurrency(returnAmount, userCurrency)} to your wallet.`);
    } catch (err) {
        console.error(err);
        toast.error("Could not stop copying. Please try again.");
    }
  };

  // Filter and Sort master list
  const filteredMasters = masters
    .filter(m => 
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id?.includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortBy === 'winRate') return (b.winRate || 0) - (a.winRate || 0);
      if (sortBy === 'followers') return (b.copiersCount || 0) - (a.copiersCount || 0);
      if (sortBy === 'totalProfit') return (b.totalProfit || 0) - (a.totalProfit || 0);
      return 0;
    });

  // Calculate stats overview for My Portfolio
  const totalInvestedFunds = activeCopies.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalLiveGain = Object.getOwnPropertyNames(liveCopyProfit).reduce((sum, key) => sum + (liveCopyProfit[key] || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] text-white font-sans">
        {/* Skeleton Header */}
        <div className="h-[60px] bg-[#1e2329] border-b border-white/5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse" />
             <div className="w-32 h-6 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
             <div className="w-24 h-8 rounded bg-white/5 animate-pulse" />
             <div className="w-24 h-8 rounded bg-white/5 animate-pulse" />
          </div>
        </div>

        {/* Skeleton Banner */}
        <div className="max-w-4xl mx-auto px-4 py-8">
           <div className="w-full h-48 rounded-2xl bg-[#1e2329] border border-white/5 animate-pulse mb-8" />
           
           {/* Skeleton Stats */}
           <div className="flex gap-4 mb-8 overflow-hidden">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="min-w-[120px] h-12 rounded bg-[#1e2329] border border-white/5 animate-pulse" />
              ))}
           </div>

           {/* Skeleton Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 rounded-2xl bg-[#1e2329] border border-white/5 animate-pulse" />
              ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div id="copy-trading-container" className="min-h-screen bg-[#0b0e11] text-white font-sans selection:bg-[#fcd535]/30">
        {/* HEADER */}
        <header id="copy-trading-header" className="sticky top-0 z-[100] bg-[#1e2329] border-b border-white/5 px-4 h-[60px] flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button id="back-btn" onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/5 rounded-lg transition-all -ml-1">
                    <ArrowLeft size={20} className="text-[#929aa5]" />
                </button>
                <div className="flex items-center gap-2">
                   <Users size={18} className="text-[#fcd535] hidden sm:block" />
                   <h1 className="text-[16px] sm:text-[18px] font-bold tracking-tight">Copy Trading</h1>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-[9px] sm:text-[10px] text-[#929aa5] font-medium uppercase tracking-wider mb-0.5">Asset Value</span>
                    <span className="text-[14px] sm:text-[15px] font-bold text-[#fcd535] leading-none">{formatWithCurrency(userBalance, userCurrency)}</span>
                </div>
            </div>
        </header>

        {/* TOP STATS BAR (Binance Style) */}
        <div id="binance-stats-bar" className="bg-[#1e2329] px-4 py-3 flex justify-between gap-4 sm:gap-8 border-b border-white/5 overflow-x-auto scrollbar-hide text-left">
            <div className="flex flex-col gap-1 min-w-fit">
                <span className="text-[10px] text-[#929aa5] font-medium uppercase tracking-wider whitespace-nowrap">Total Traders</span>
                <span className="text-[14px] font-bold text-white">4,281</span>
            </div>
            <div className="flex flex-col gap-1 min-w-fit">
                <span className="text-[10px] text-[#929aa5] font-medium uppercase tracking-wider whitespace-nowrap">Active Copiers</span>
                <span className="text-[14px] font-bold text-white">128,490</span>
            </div>
            <div className="flex flex-col gap-1 min-w-fit">
                <span className="text-[10px] text-[#929aa5] font-medium uppercase tracking-wider whitespace-nowrap">Cumulative Profit</span>
                <span className="text-[14px] font-bold text-[#02c076]">+{formatWithCurrency(convertToBase(1492050, 'USD'), userCurrency)}</span>
            </div>
            <div className="flex flex-col gap-1 min-w-fit">
                <span className="text-[10px] text-[#929aa5] font-medium uppercase tracking-wider whitespace-nowrap">Safety Fund</span>
                <span className="text-[14px] font-bold text-white">{formatWithCurrency(convertToBase(500000, 'USD'), userCurrency)}</span>
            </div>
        </div>

        {/* TABS */}
        <div id="navigation-tabs" className="sticky top-[60px] z-[90] bg-[#0b0e11] border-b border-white/5 flex px-2 overflow-x-auto scrollbar-hide">
            {[
                { id: 'traders', label: 'Traders Pool' },
                { id: 'my-card', label: `My Portfolio (${activeCopies.length})` }
            ].map(tab => (
                <button 
                    id={`tab-${tab.id}`}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-6 text-[14px] font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-[#fcd535]' : 'text-[#929aa5] hover:text-white'}`}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#fcd535] rounded-full" />
                    )}
                </button>
            ))}
        </div>

        <main className="max-w-4xl mx-auto px-4 py-8 pb-32 space-y-8">
            <AnimatePresence mode="wait">
                {activeTab === 'traders' ? (
                    <motion.div 
                        key="traders-view"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* LIVE TICKER */}
                        <div id="live-trading-ticker" className="bg-[#12161a] border border-[#fcd535]/15 rounded-xl py-3 px-4 flex items-center justify-between gap-4 overflow-hidden relative shadow-[0_0_15px_rgba(252,213,53,0.03)]">
                            <div className="flex items-center gap-2 px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md text-[10px] font-black tracking-widest shrink-0 uppercase animate-pulse">
                                <Activity size={12} className="inline mr-1" /> LIVE ENGINE
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.p 
                                        key={liveFeedText}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12 }}
                                        transition={{ duration: 0.35 }}
                                        className="text-[12px] md:text-[13px] font-bold text-white/90 truncate font-mono text-left"
                                    >
                                        ⚡️ {liveFeedText}
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                            <span className="text-[11px] font-bold text-[#fcd535] hidden sm:inline-flex items-center gap-1 shrink-0 font-mono">
                                <UserCheck size={12} /> Auto-Sync Active
                            </span>
                        </div>

                        {/* HERO PROMO */}
                        <div id="championship-banner" className="bg-gradient-to-r from-[#2b2f36] to-[#1e2329] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#fcd535]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
                            <div className="flex-1 space-y-4 relative z-10 text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#fcd535]/10 text-[#fcd535] rounded-lg text-[11px] font-bold uppercase tracking-widest">
                                    <Trophy size={14} /> NEW SEASON CONTEST
                                </div>
                                <h2 className="text-[24px] md:text-[28px] font-black leading-tight">Master Trader Championship</h2>
                                <p className="text-[#929aa5] text-[13px] md:text-[14px] max-w-lg leading-relaxed">
                                    Copy elite traders to trade hands-free. Gain continuous yields, automate risk ratios, and share a massive <span className="text-white font-bold">{formatWithCurrency(convertToBase(50000, 'USD'), userCurrency)}</span> bonus pool.
                                </p>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
                                        <Shield size={14} fill="currentColor" className="fill-emerald-500/10" /> Max Security Checked
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-yellow-500 font-bold">
                                        <Zap size={14} className="animate-pulse text-yellow-500" /> Automated Copy Engine
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:flex flex-1 justify-end relative z-10 pr-2">
                                <div className="w-40 h-40 bg-[#1e2126] rounded-full border-4 border-[#fcd535]/20 flex items-center justify-center relative">
                                    <Award size={64} className="text-[#fcd535] drop-shadow-[0_0_10px_rgba(252,213,53,0.3)] animate-pulse" />
                                    <div className="absolute inset-0 border-t-2 border-[#fcd535] rounded-full animate-spin"></div>
                                </div>
                            </div>
                        </div>

                        {/* MASTER PODIUM - GOLD, SILVER, BRONZE */}
                        <div id="master-podium-section" className="space-y-4">
                            <div className="flex items-center justify-between text-left">
                                <div>
                                    <h3 className="text-[16px] font-extrabold uppercase tracking-wider text-[#fcd535] flex items-center gap-2">
                                        <Trophy size={16} /> Top Masters Podium
                                    </h3>
                                    <p className="text-[12px] text-gray-500 font-bold mt-0.5">Highest win-rates monitored over the last 7 calendar days</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                                {masters.length > 0 && [...masters].sort((a,b) => b.winRate - a.winRate).slice(0, 3).map((trader, i) => {
                                    const rank = i + 1;
                                    const rankColors = rank === 1 
                                        ? { border: 'border-[#fcd535]', glow: 'shadow-[#fcd535]/10', medal: '🥇 1st Rank', text: 'text-[#fcd535]' }
                                        : rank === 2 
                                        ? { border: 'border-[#c0c0c0]', glow: 'shadow-[#c0c0c0]/5', medal: '🥈 2nd Rank', text: 'text-[#cbd5e1]' }
                                        : { border: 'border-[#cd7f32]', glow: 'shadow-[#cd7f32]/5', medal: '🥉 3rd Rank', text: 'text-[#b45309]' };

                                    return (
                                        <motion.div 
                                            key={`podium-${rank}`}
                                            whileHover={{ y: -4 }}
                                            onClick={() => setSelectedTrader(trader)}
                                            className={`relative bg-[#1e2329] border-2 ${rankColors.border} ${rankColors.glow} rounded-2xl p-5 cursor-pointer shadow-xl flex flex-col justify-between overflow-hidden text-left`}
                                        >
                                            {/* Top corner ribbon */}
                                            <div className="absolute top-2 right-2 bg-black/40 border border-white/5 font-mono text-[9px] font-black px-2 py-0.5 rounded-lg text-white uppercase tracking-wider">
                                                {rankColors.medal}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-[22px] shadow-inner select-none">
                                                        {trader.country}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-[14px] font-black uppercase tracking-tight text-white group-hover:text-[#fcd535]">{trader.name}</span>
                                                            <span className="bg-red-500/15 text-red-400 border border-red-500/20 text-[8px] font-black uppercase px-1 rounded-sm">MASTER</span>
                                                        </div>
                                                        <p className="text-[11px] text-gray-400 font-medium truncate max-w-[125px]">{trader.strategy}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 bg-black/10 p-2.5 rounded-xl border border-white/5 text-center">
                                                    <div>
                                                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-tight">Weekly ROI</p>
                                                        <p className="text-[13px] font-black text-emerald-400">{trader.winRate}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-tight">Copiers</p>
                                                        <p className="text-[13px] font-black text-white">{trader.copiersCount}/{trader.maxCopiers || 100}</p>
                                                    </div>
                                                </div>

                                                {/* Mini performance line */}
                                                <div className="space-y-1">
                                                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden flex">
                                                        <div style={{ width: `${trader.profitRate || 75}%` }} className="h-full bg-emerald-500" />
                                                        <div style={{ width: `${trader.lossRate || 25}%` }} className="h-full bg-red-500" />
                                                    </div>
                                                    <div className="flex justify-between text-[9px] font-bold text-gray-500">
                                                        <span>{trader.profitRate || 75}% Success</span>
                                                        <span>{trader.lossRate || 25}% Loss</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-[10px] text-gray-400 font-bold">Commission: <span className="text-white">{trader.commission || '10%'}</span></span>
                                                <button className="px-3.5 py-1.5 bg-[#fcd535] hover:bg-[#ffe05d] text-[#1e2329] text-[11px] font-black uppercase rounded-lg shadow-sm transition-colors">
                                                    Copy System
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* FILTERS & SEARCH */}
                        <div id="filter-panel" className="flex flex-col md:flex-row items-center gap-4 bg-[#1e2329]/40 p-4 rounded-2xl border border-white/5">
                            <div className="flex-1 relative w-full">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#929aa5]" />
                                <input 
                                    type="text" 
                                    placeholder="Search by master name, strategy or ID..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 bg-[#1e2329] border border-white/5 rounded-xl pl-12 pr-4 text-[14px] focus:border-[#fcd535]/50 transition-all outline-none text-white placeholder-gray-500"
                                />
                            </div>
                            
                            <div className="flex gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide py-1 items-center justify-between md:justify-end">
                                <div className="flex gap-2">
                                    {[
                                        { id: 'winRate', label: 'Win Rate %' },
                                        { id: 'followers', label: 'Copiers' },
                                        { id: 'totalProfit', label: 'Profit Gained' }
                                    ].map((option) => (
                                        <button 
                                            key={option.id}
                                            onClick={() => setSortBy(option.id)}
                                            className={`h-10 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${sortBy === option.id ? 'bg-[#fcd535] text-black border-[#fcd535]' : 'bg-[#1e2329] text-[#929aa5] border-white/5 hover:text-white'}`}
                                        >
                                            Sort: {option.label}
                                        </button>
                                    ))}
                                </div>

                                {/* View Switcher matching Binomo-styling */}
                                <div className="flex bg-[#12161a] border border-white/10 rounded-xl p-1 shrink-0 ml-1">
                                    <button
                                        onClick={() => setViewMode('leaderboard')}
                                        className={`p-2 rounded-lg transition-all ${viewMode === 'leaderboard' ? 'bg-[#fcd535] text-black' : 'text-gray-400 hover:text-white'}`}
                                        title="List Leaderboard View"
                                    >
                                        <List size={16} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#fcd535] text-black' : 'text-gray-400 hover:text-white'}`}
                                        title="Cards Grid View"
                                    >
                                        <LayoutGrid size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* LIST LEADERBOARD VIEW VS CARDS GRID VIEW */}
                        {viewMode === 'leaderboard' ? (
                            <div id="leaderboard-table-view" className="bg-[#1e2329] border border-white/5 rounded-2xl overflow-hidden shadow-xl text-left">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#12161a] border-b border-white/5 text-[10px] text-[#929aa5] font-black uppercase tracking-wider">
                                                <th className="py-4 px-5 text-center w-14">Rank</th>
                                                <th className="py-4 px-4">Master Trader</th>
                                                <th className="py-4 px-4 text-center">Win Rate</th>
                                                <th className="py-4 px-4 text-center">Trend (7d)</th>
                                                <th className="py-4 px-4 text-right">Total Profit</th>
                                                <th className="py-4 px-4 text-center">Copiers / Roster</th>
                                                <th className="py-4 px-5 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredMasters.map((trader, idx) => {
                                                const globalRank = masters.findIndex(m => m.name === trader.name) + 1;
                                                return (
                                                    <tr 
                                                        key={`row-${trader.id || idx}`} 
                                                        className="hover:bg-[#252a32] transition-colors cursor-pointer group"
                                                        onClick={() => setSelectedTrader(trader)}
                                                    >
                                                        {/* Rank Column */}
                                                        <td className="py-4 px-5 text-center font-mono text-[13px] font-black">
                                                            {globalRank === 1 ? (
                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">🥇</span>
                                                            ) : globalRank === 2 ? (
                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-300/10 text-gray-300 border border-gray-300/20">🥈</span>
                                                            ) : globalRank === 3 ? (
                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/10 text-amber-700 border border-amber-700/20">🥉</span>
                                                            ) : (
                                                                <span className="text-gray-500">#{globalRank}</span>
                                                            )}
                                                        </td>

                                                        {/* Master Info Column */}
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[22px] select-none shrink-0" role="img" aria-label="country">{trader.country}</span>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="text-[14px] font-black uppercase tracking-tight text-white group-hover:text-[#fcd535] transition-colors truncate">{trader.name}</span>
                                                                        {trader.isVip && (
                                                                            <span className="bg-[#fcd535]/15 text-[#fcd535] border border-[#fcd535]/30 text-[8px] font-black uppercase px-1 rounded italic leading-none shrink-0">VIP</span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-400 font-bold truncate max-w-[180px]">{trader.strategy}</p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Win Rate Column */}
                                                        <td className="py-4 px-4 text-center">
                                                            <span className="text-[14px] font-extrabold text-emerald-400 font-mono">+{trader.winRate}%</span>
                                                            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">ROI WK: {trader.gainPerWeek || '≥ 30%'}</div>
                                                        </td>

                                                        {/* Sparkline Column */}
                                                        <td className="py-4 px-4 w-32">
                                                            <div className="h-8 w-full opacity-80 group-hover:opacity-100 transition-opacity">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <LineChart data={trader.performanceData}>
                                                                        <Line 
                                                                            type="monotone" 
                                                                            dataKey="value" 
                                                                            stroke={trader.winRate > 85 ? "#02c076" : "#fcd535"} 
                                                                            strokeWidth={1.5} 
                                                                            dot={false} 
                                                                        />
                                                                    </LineChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        </td>

                                                        {/* Total Profit Column */}
                                                        <td className="py-4 px-4 text-right font-mono text-[13px] font-bold text-white">
                                                            {formatWithCurrency(trader.totalProfit || 100000, userCurrency)}
                                                            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Commission: {trader.commission || '10%'}</div>
                                                        </td>

                                                        {/* Copiers ProgressBar Column */}
                                                        <td className="py-4 px-4 text-center min-w-[120px]">
                                                            <div className="inline-block w-full">
                                                                <div className="flex items-center justify-between text-[11px] font-bold text-white/70 mb-1 leading-none">
                                                                    <span>{trader.copiersCount}/{trader.maxCopiers || 100}</span>
                                                                    <span className="text-gray-500 font-mono text-[10px]">{(trader.copiersCount / (trader.maxCopiers || 100) * 100).toFixed(0)}%</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                                                    <div 
                                                                        style={{ width: `${(trader.copiersCount / (trader.maxCopiers || 100) * 100)}%` }} 
                                                                        className="h-full bg-yellow-500 rounded-full" 
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Action Button */}
                                                        <td className="py-4 px-5 text-center">
                                                            <button className="px-3.5 py-1.5 bg-[#fcd535] text-[#1e2329] hover:bg-[#ffe05d] text-[11px] font-black uppercase rounded-lg shadow-md hover:scale-105 active:scale-95 transition-all">
                                                                Copy
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            /* MASTERS GRID */
                            <div id="master-traders-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                {filteredMasters.map((trader, idx) => (
                                    <motion.div 
                                        id={`trader-card-${trader.id || 'card-' + idx}`}
                                        key={`master-${idx}-${trader.id || 'm-' + idx}`}
                                        onClick={() => setSelectedTrader(trader)}
                                        whileHover={{ y: -4, borderColor: 'rgba(252, 213, 53, 0.25)' }}
                                        className="bg-[#1e2329] border border-white/5 rounded-2xl p-6 transition-all cursor-pointer group shadow-lg relative overflow-hidden flex flex-col justify-between"
                                    >
                                        {/* Trader Header */}
                                        <div>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-[#0b0e11] border border-white/10 flex items-center justify-center text-[22px] shadow-inner select-none transition-transform group-hover:scale-105">
                                                        {trader.country}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-15px font-extrabold uppercase text-white group-hover:text-[#fcd535] transition-colors tracking-tight">
                                                                {trader.name}
                                                            </h3>
                                                            {trader.isVip && (
                                                                <span className="bg-[#fcd535]/10 text-[#fcd535] border border-[#fcd535]/30 text-[9px] font-black uppercase px-1.5 py-0.5 rounded italic">VIP</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[12px] text-gray-400 font-medium truncate max-w-[200px]">{trader.strategy}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-[#929aa5] font-bold uppercase tracking-wider block mb-0.5">Win Rate</span>
                                                    <span className="text-lg font-black text-emerald-400">+{trader.winRate}%</span>
                                                </div>
                                            </div>

                                            <div className="text-[13px] text-[#929aa5] font-bold flex items-center justify-between mb-2">
                                                <span>Copiers:</span>
                                                <span className="text-white">{trader.copiersCount}/{trader.maxCopiers || 100}</span>
                                            </div>

                                            {/* Performance Bar matching the user screenshot! */}
                                            <div className="space-y-1 mb-4">
                                                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden flex">
                                                    <div style={{ width: `${trader.profitRate || 75}%` }} className="h-full bg-[#02c076]" />
                                                    <div style={{ width: `${trader.lossRate || 25}%` }} className="h-full bg-rose-500" />
                                                </div>
                                                <div className="flex justify-between text-[11px] font-bold text-gray-400">
                                                    <span className="text-[#02c076]">{trader.profitRate || 75}% Profit</span>
                                                    <span className="text-rose-400">{trader.lossRate || 25}% Loss</span>
                                                </div>
                                            </div>

                                            {/* Trader Stats Details */}
                                            <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 mb-4 text-center">
                                                <div>
                                                    <p className="text-[9px] text-[#929aa5] font-black uppercase tracking-tighter mb-0.5">Gain / Wk</p>
                                                    <p className="text-[13px] font-black text-emerald-400">{trader.gainPerWeek || '≥ 30%'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-[#929aa5] font-black uppercase tracking-tighter mb-0.5">Copied Trades</p>
                                                    <p className="text-[13px] font-black text-white">{trader.copiedTrades || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-[#929aa5] font-black uppercase tracking-tighter mb-0.5">Commission</p>
                                                    <p className="text-[13px] font-black text-white">{trader.commission || '10%'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Line Chart */}
                                        <div className="h-[36px] w-full mt-1 mb-3 opacity-90">
                                            <ResponsiveContainer width="100%" height={36} minWidth={0} minHeight={0}>
                                                <LineChart data={trader.performanceData}>
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="value" 
                                                        stroke="#02c076" 
                                                        strokeWidth={1.5} 
                                                        dot={false} 
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-500">Risk Limit: <span className="text-yellow-500 font-bold">{(trader.riskIndex || 3)}/10</span></span>
                                            <span className="text-xs font-black text-[#fcd535] hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                                Copy Now <ChevronRight size={14} />
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div 
                        key="my-card-view"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* PORTFOLIO METRICS SUMMARY */}
                        {activeCopies.length > 0 && (
                            <div id="portfolio-summary-card" className="bg-gradient-to-r from-[#1e2329] to-[#12161a] border border-white/10 rounded-2xl p-6 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                <div className="space-y-1">
                                    <span className="text-xs text-[#929aa5] font-medium tracking-tight">Active Accounts</span>
                                    <p className="text-2xl font-black text-white">{activeCopies.length}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-[#929aa5] font-medium tracking-tight">Total Invested</span>
                                    <p className="text-2xl font-black text-white">{formatWithCurrency(totalInvestedFunds, userCurrency)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-[#929aa5] font-medium tracking-tight">Total Copy Returns</span>
                                    <p className={`text-2xl font-black ${totalLiveGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {totalLiveGain >= 0 ? '+' : '-'}{formatWithCurrency(Math.abs(totalLiveGain), userCurrency)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-[#929aa5] font-medium tracking-tight">Average ROI</span>
                                    <p className={`text-2xl font-black ${totalLiveGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {totalLiveGain >= 0 ? '+' : ''}{totalInvestedFunds > 0 ? ((totalLiveGain / totalInvestedFunds) * 100).toFixed(2) : '0.00'}%
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeCopies.length === 0 ? (
                            <div id="empty-portfolio-state" className="flex flex-col items-center justify-center py-24 text-center bg-[#1e2329]/20 rounded-3xl border border-white/5">
                                 <div className="w-20 h-20 bg-[#1e2329] rounded-full flex items-center justify-center text-[#929aa5] mb-6 shadow-xl">
                                    <Activity size={40} />
                                </div>
                                <h3 className="text-xl font-bold mb-4">Portfolio is empty</h3>
                                <p className="text-[#929aa5] text-[14px] max-w-sm mb-8 leading-relaxed">
                                    Start following expert master traders to see their copied trades, live PnL streams, and earnings here.
                                </p>
                                <button 
                                    id="find-masters-empty"
                                    onClick={() => setActiveTab('traders')}
                                    className="bg-[#fcd535] text-[#1e2329] px-12 py-3.5 rounded-xl font-bold hover:bg-[#ffe05d] transition-all shadow-xl shadow-[#fcd535]/10"
                                >
                                    Explore Masters
                                </button>
                            </div>
                        ) : (
                            <div id="active-copies-list" className="space-y-6 text-left">
                                <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <UserCheck size={20} className="text-[#fcd535]" />
                                    Active Master Subscriptions
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {activeCopies.map((copy, idx) => {
                                        const liveProfit = liveCopyProfit[copy.id] || 0.00;
                                        const returnPerc = ((liveProfit / (copy.amount || 1)) * 100).toFixed(2);
                                        return (
                                            <div 
                                                id={`active-copy-${copy.id}`}
                                                key={`active-copy-${idx}-${copy.id || 'copy-' + idx}`} 
                                                className="bg-[#1e2329] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between"
                                            >
                                                <div className="absolute top-4 right-4 flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">LIVE SYNC</span>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2.5 mb-3">
                                                        <span className="text-2xl">{copy.country || '🌍'}</span>
                                                        <div>
                                                            <h4 className="text-[15px] font-black text-white uppercase">{copy.masterName}</h4>
                                                            <p className="text-[11px] text-gray-500 truncate max-w-[200px]">{copy.strategy}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5 my-4">
                                                        <div>
                                                            <span className="text-[10px] text-[#929aa5] font-black uppercase block mb-0.5">Budget Invested</span>
                                                            <span className="text-[15px] font-extrabold text-white">{formatWithCurrency(copy.amount || 0, userCurrency)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-[#929aa5] font-black uppercase block mb-0.5">Live Profit</span>
                                                            <span className={`text-[15px] font-black ${liveProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                {liveProfit >= 0 ? '+' : '-'}{formatWithCurrency(Math.abs(liveProfit), userCurrency)} ({liveProfit >= 0 ? '+' : ''}{returnPerc}%)
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center text-xs text-[#929aa5] font-bold mb-4">
                                                        <span>Remaining Trades Limit:</span>
                                                        <span className="text-white">{copy.tradesLimit || 50}</span>
                                                    </div>
                                                </div>

                                                <button 
                                                    id={`btn-stop-copy-${copy.id}`}
                                                    onClick={() => handleStopCopying(copy.id, copy.masterId, copy.amount, copy.masterName)}
                                                    className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 font-bold text-xs rounded-xl uppercase transition-all"
                                                >
                                                    Stop Copying
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>

        {/* TRADER SELECTION / COPY FLOW OVERLAY */}
        <AnimatePresence>
            {selectedTrader && (
                <motion.div 
                    id="copy-overlay-wrapper"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[200] flex flex-col bg-[#1c1c21]"
                >
                    {/* MODAL HEADER */}
                    <div className="px-4 h-[64px] flex items-center gap-3 border-b border-white/5 bg-[#1c1c21] shrink-0">
                        <button id="close-overlay-back" onClick={() => setSelectedTrader(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                            <ArrowLeft size={24} className="text-gray-400" />
                        </button>
                        <div className="flex items-center gap-2 overflow-hidden">
                             <h1 className="text-[17px] font-bold tracking-tight whitespace-nowrap">Configure Allocation</h1>
                             <ChevronRight size={14} className="text-gray-600 shrink-0" />
                             <span className="text-[17px] font-bold text-[#fcd535] truncate uppercase">{selectedTrader.name}</span>
                        </div>
                        <button id="close-overlay-cross" onClick={() => setSelectedTrader(null)} className="ml-auto p-2 hover:bg-white/5 rounded-xl transition-all">
                            <X size={24} className="text-gray-600" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[#1c1c21]">
                        <div className="max-w-xl mx-auto px-4 py-6 space-y-8 pb-32">
                            {/* TRADER CARD COMPACT */}
                            <div className="bg-[#2a2b30] rounded-[22px] p-6 border border-white/5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[20px]">{selectedTrader.country}</span>
                                        <span className="text-[16px] font-black uppercase tracking-tight">{selectedTrader.name}</span>
                                    </div>
                                    <div className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase italic ${selectedTrader.isVip || selectedTrader.level === 'VIP' ? 'bg-[#309cf4]/10 border-[#309cf4]/30 text-[#309cf4]' : 'bg-gray-500/10 border-gray-500/30 text-gray-400'}`}>
                                        {selectedTrader.isVip || selectedTrader.level === 'VIP' ? 'VIP' : 'Standard'}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Users size={15} className="text-gray-500" />
                                    <div className="flex items-center gap-1.5 text-[13px] font-bold">
                                        <span className="text-gray-500">Copiers:</span>
                                        <span className="text-white">{selectedTrader.copiersCount}/{selectedTrader.maxCopiers || 100}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center bg-black/20 p-4 rounded-xl">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Gain per week</p>
                                        <p className="text-[15px] font-black text-emerald-400">{selectedTrader.gainPerWeek || '≥ 30%'}</p>
                                    </div>
                                    <div className="space-y-1 border-x border-white/5">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Copied trades</p>
                                        <p className="text-[15px] font-black text-white">{selectedTrader.copiedTrades || 0}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Commission</p>
                                        <p className="text-[15px] font-black text-white">{selectedTrader.commission || '10%'}</p>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="h-[5px] w-full bg-black/30 rounded-full overflow-hidden flex shadow-inner">
                                        <div style={{ width: `${selectedTrader.profitRate || 75}%` }} className="h-full bg-[#10c877]" />
                                        <div style={{ width: `${selectedTrader.lossRate || 25}%` }} className="h-full bg-[#ff5252]" />
                                    </div>
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-tighter px-0.5">
                                        <span className="text-[#10c877]">{selectedTrader.profitRate || 75}% Profit</span>
                                        <span className="text-[#ff5252]">{selectedTrader.lossRate || 25}% Loss</span>
                                    </div>
                                </div>
                            </div>

                            {/* SETTINGS FORM */}
                            <div className="space-y-8 bg-[#1c1c21] p-1">
                                <div className="space-y-4 text-left">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[14px] font-bold text-white/90">Investment allocated for copying</label>
                                        <Info size={14} className="text-gray-500" />
                                    </div>
                                    <div className="h-16 flex items-center bg-[#2a2b30] rounded-2xl border border-white/5 overflow-hidden">
                                        <button 
                                            id="minus-investment"
                                            onClick={() => setCopyingAmount(prev => Math.max(50, prev - 50))}
                                            className="w-16 h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                        >
                                            <Minus size={20} />
                                        </button>
                                        <div className="flex-1 text-center font-black">
                                            <span className="text-[20px] text-[#fcd535]">{formatWithCurrency(copyingAmount, userCurrency)}</span>
                                        </div>
                                        <button 
                                            id="plus-investment"
                                            onClick={() => setCopyingAmount(prev => prev + 50)}
                                            className="w-16 h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 font-bold">Your Available Balance: {formatWithCurrency(userBalance, userCurrency)}</p>
                                    {userBalance < copyingAmount && (
                                        <p className="text-[12px] font-bold text-red-500 flex items-center gap-1.5 animate-pulse">
                                            <AlertTriangle size={14} />
                                            Allocated budget is larger than wallet. Please Deposit or lower size.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4 text-left">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[14px] font-bold text-white/90">Maximum Trades Auto limit</label>
                                        <Info size={14} className="text-gray-500" />
                                    </div>
                                    <div className="h-16 flex items-center bg-[#2a2b30] rounded-2xl border border-white/5 overflow-hidden">
                                        <button 
                                            id="minus-trades-limit"
                                            onClick={() => setTradesLimit(prev => Math.max(10, prev - 10))}
                                            className="w-16 h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                        >
                                            <Minus size={20} />
                                        </button>
                                        <div className="flex-1 text-center font-black text-[20px] text-white">
                                            {tradesLimit}
                                        </div>
                                        <button 
                                            id="plus-trades-limit"
                                            onClick={() => setTradesLimit(prev => prev + 10)}
                                            className="w-16 h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 text-left">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[14px] font-bold text-white/90">Maximum each trade size limit</label>
                                        <Info size={14} className="text-gray-500" />
                                    </div>
                                    <div className="h-16 flex items-center bg-[#2a2b30] rounded-2xl border border-white/5 overflow-hidden">
                                        <button 
                                            id="minus-max-trade-amt"
                                            onClick={() => setMaxTradeAmount(prev => Math.max(5, prev - 5))}
                                            className="w-16 h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                        >
                                            <Minus size={20} />
                                        </button>
                                        <div className="flex-1 text-center font-black text-[20px] text-white">
                                            {formatWithCurrency(maxTradeAmount, userCurrency)}
                                        </div>
                                        <button 
                                            id="plus-max-trade-amt"
                                            onClick={() => setMaxTradeAmount(prev => prev + 5)}
                                            className="w-16 h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    {userBalance < copyingAmount ? (
                                        <div 
                                            id="deposit-notice-card"
                                            className="w-full p-6 bg-[#2a2b30] border border-[#fcd535]/20 rounded-2xl flex flex-col items-center text-center gap-3 shadow-2xl"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-[#fcd535]/10 flex items-center justify-center text-[#fcd535]">
                                                <Wallet size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-black text-white uppercase tracking-wider mb-1">Insufficient Funds</p>
                                                <p className="text-[12px] font-medium text-gray-500 leading-relaxed">
                                                    You need {formatWithCurrency((copyingAmount - userBalance), userCurrency)} more to copy this trader.
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => navigate('/trade?action=deposit')}
                                                className="mt-2 px-6 py-3 bg-[#fcd535] hover:bg-[#ffe05d] text-black font-black text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#fcd535]/10"
                                            >
                                                Quick Deposit
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            id="confirm-copy-submit"
                                            onClick={handleStartCopying}
                                            disabled={isSubmitting}
                                            className={`w-full h-[64px] bg-[#fcd535] hover:bg-[#ffe05d] text-black font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#fcd535]/20 active:scale-95 transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-80 pointer-events-none' : ''}`}
                                        >
                                            {isSubmitting ? (
                                              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                              <>
                                                <Users size={18} />
                                                Initiate Copy System
                                              </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* TRADER HISTORY */}
                            <div className="space-y-6 pt-4 text-left">
                                <h3 className="text-[15px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2.5">
                                    <History size={18} className="text-yellow-500" />
                                    Trader's historical deals record
                                </h3>
                                <div className="space-y-4">
                                    {selectedTrader.history?.map((h: any, idx: number) => (
                                        <div key={`trader-history-item-${idx}-${h.id || h.timestamp || idx}`} className="bg-[#2a2b30] border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-sm group hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${h.result === 'won' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {h.type === 'CALL' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[15px] font-black group-hover:text-white transition-colors">{h.asset}</span>
                                                        <span className="text-[13px] font-black text-white/50">{h.payout}%</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600">
                                                        {h.result === 'won' ? <TrendingUp size={14} className="text-emerald-500 shrink-0" /> : <TrendingDown size={14} className="text-red-500 shrink-0" />}
                                                        <span>Live Session - {h.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <span className={`text-[16px] font-black block ${h.result === 'won' ? 'text-emerald-400' : 'text-gray-400'}`}>
                                                    {h.result === 'won' ? `+${formatWithCurrency(h.profit, userCurrency)}` : `-${formatWithCurrency(h.amount, userCurrency)}`}
                                                </span>
                                                <p className="text-[12px] font-black text-white/20">{formatWithCurrency(h.amount, userCurrency)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
