import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import axios from 'axios';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { Resend } from 'resend';
import { GoogleGenAI } from '@google/genai';
import { markets, Market } from './src/markets';

// ESM/CJS compatibility
let _dirname = '';
try {
  _dirname = path.dirname(fileURLToPath(import.meta.url));
} catch (e) {
  _dirname = process.cwd();
}

// Initialize Firebase Admin
let db: any;
function initFirebase() {
  try {
    const config = JSON.parse(readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
    
    if (admin.apps.length === 0) {
      const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccountVar) {
        try {
          const serviceAccount = JSON.parse(serviceAccountVar);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: config.projectId,
          });
          console.log('Firebase Admin initialized with service account from environment');
        } catch (e) {
          console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT, falling back to default initialization:', e);
          admin.initializeApp({
            projectId: config.projectId,
          });
        }
      } else {
        admin.initializeApp({
          projectId: config.projectId,
        });
        console.log('Firebase Admin initialized with default credentials');
      }
    }
    
    db = getFirestore(config.firestoreDatabaseId || '(default)');
    db.settings({ preferRest: true });
    console.log('Firebase Admin initialized successfully with preferRest');
  } catch (error) {
    console.error('Critical failure in Firebase Admin initialization:', error);
  }
}

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function startServer() {
  console.log('Starting server process...');
  initFirebase();
  const app = express();
  console.log('Express app initialized');
  app.use(express.json());
  
  // Professional Email Endpoints
  app.post('/api/email/welcome', async (req, res) => {
    const { email, name } = req.body;
    if (!resend) return res.status(503).json({ error: 'Email service not configured' });
    try {
        await resend.emails.send({
            from: 'Bivaax Support <welcome@bivaax.trade>',
            to: email,
            subject: 'Welcome to Bivaax Trading!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #1a1a1a; padding: 25px; text-align: center;">
                  <h1 style="color: #FFD700; margin: 0; font-size: 28px;">Bivaax</h1>
                </div>
                <div style="padding: 30px;">
                  <h2 style="color: #1a1a1a;">Welcome ${name}!</h2>
                  <p>You have successfully registered on our platform.</p>
                </div>
                <div style="font-size: 12px; color: #777; text-align: center; padding: 20px; background-color: #f9f9f9; border-top: 1px solid #eee;">
                  <p>Support: support@bivaax.trade | Virtual Assistant | Support 24/7</p>
                  <p>Dolphin Corp LLC, Euro House, Richmond Hill Road, Kingstown, St. Vincent and the Grenadines.</p>
                </div>
              </div>`
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to send welcome email' });
    }
  });

  app.post('/api/auth/request-withdrawal-otp', async (req, res) => {
      const { email, uid } = req.body;
      if (!resend) return res.status(503).json({ error: 'Email service not configured' });
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
      
      await db.collection('users').doc(uid).update({ withdrawalOtp: otp, withdrawalOtpExpiresAt: expiresAt });
      
      try {
        await resend.emails.send({
            from: 'Bivaax Security <security@bivaax.trade>',
            to: email,
            subject: 'Withdrawal Request OTP',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #1a1a1a; padding: 25px; text-align: center;">
                  <h1 style="color: #FFD700; margin: 0; font-size: 28px;">Bivaax</h1>
                </div>
                <div style="padding: 30px;">
                  <h2 style="color: #1a1a1a;">Withdrawal Request Verification</h2>
                  <p>Your withdrawal OTP is: <b style="font-size: 18px; color: #d6b400;">${otp}</b>.</p>
                  <p>This code is valid for 5 minutes.</p>
                </div>
                <div style="font-size: 12px; color: #777; text-align: center; padding: 20px; background-color: #f9f9f9; border-top: 1px solid #eee;">
                  <p>Support: support@bivaax.trade | Virtual Assistant | Support 24/7</p>
                  <p>Dolphin Corp LLC, Euro House, Richmond Hill Road, Kingstown, St. Vincent and the Grenadines.</p>
                </div>
              </div>`
        });
        res.json({ success: true });
      } catch(e) {
         res.status(500).json({ error: 'Failed to send OTP' });
      }
  });

  app.post('/api/auth/verify-withdrawal-otp', async (req, res) => {
      const { uid, otp } = req.body;
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
      
      const data = userDoc.data();
      if (data.withdrawalOtp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
      if (data.withdrawalOtpExpiresAt < Date.now()) return res.status(400).json({ error: 'OTP expired' });
      
      await db.collection('users').doc(uid).update({ withdrawalOtp: null, withdrawalOtpExpiresAt: null });
      res.json({ success: true });
  });

  app.post('/api/support/reply', async (req, res) => {
      const { message } = req.body;
      if (!process.env.GEMINI_API_KEY) {
          console.warn("GEMINI_API_KEY is not set.");
          return res.status(503).json({ error: 'API key not configured' });
      }
      
      try {
          const ai = new GoogleGenAI({ 
              apiKey: process.env.GEMINI_API_KEY,
              httpOptions: {
                  headers: { 'User-Agent': 'aistudio-build' }
              }
          });
          
          const response = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: [{ parts: [{ text: message }] }],
              config: {
                  systemInstruction: `You are a professional support agent for Bivaax, a high-frequency trading platform. 
          Help the user in a professional, polite, and helpful manner. 
          Respond ONLY in the language the user used to message you. If they message in English, reply ONLY in English. If they message in Bengali, reply ONLY in Bengali. Do not use both languages in the same response.
          Keep answers concise.
          If the user explicitly asks for an agent, representative, or "এজেন্ট", inform them that you are transferring the conversation to a human support agent.`
              }
          });
          
          const aiReply = response.text || "I'm sorry, I am having trouble processing your request. Please wait for a human representative.";
          res.json({ reply: aiReply });
      } catch (error: any) {
          console.error("Gemini API error:", error?.message || error);
          res.json({ reply: "Our AI support agents are currently busy. An English/Bengali speaking human representative will be right with you. / আমাদের এআই সাপোর্ট এজেন্টরা বর্তমানে ব্যস্ত আছেন। একজন ইংরেজি/বাংলাভাষী মানব প্রতিনিধি শিগগিরই যুক্ত হবেন।" });
      }
  });

  app.get('/api/news', async (req, res) => {
    try {
      const options: RequestInit = {};
      if (process.env.CRYPTOCOMPARE_API_KEY) {
        options.headers = {
          'Authorization': `Apikey ${process.env.CRYPTOCOMPARE_API_KEY}`
        };
      }
      
      const response = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN', options);
      
      if (response.status === 401 || response.status === 403) {
          console.warn("News API unauthorized, skipping news updates.");
          return res.json({ Data: [] });
      }

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.warn("News proxy error (skipping):", err.message);
      // Return empty news array to frontend to avoid error handling
      res.json({ Data: [] });
    }
  });

  const PORT = 3000;
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: '*' },
    maxHttpBufferSize: 1e8, // 100 MB
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true
  });

  // ========== MARKET STATE ==========
  
  // Base markets configuration from src/markets
  const markets_real: Record<string, Market> = JSON.parse(JSON.stringify(markets));
  const markets_demo: Record<string, Market> = JSON.parse(JSON.stringify(markets));

  const history_real: Record<string, any[]> = {};
  const history_demo: Record<string, any[]> = {};

  const currentCandles_real: Record<string, any> = {};
  const currentCandles_demo: Record<string, any> = {};

  const momentums_real: Record<string, number> = {};
  const momentums_demo: Record<string, number> = {};

  // Cache for market prices
  const priceCache: Record<string, {price: number, lastFetched: number, invalid: boolean}> = {};

  // Track active/viewed pairs dynamically to minimize Firestore quota writes
  const activeViewedPairs = new Set<string>();

  // Server-side cache for static collection data to save read quota
  const appCache: Record<string, { data: any, timestamp: number }> = {};
  const CACHE_TTL = 600000; // 10 minutes for truly static content
  const DYNAMIC_CACHE_TTL = 10000; // 10 seconds for more dynamic content (methods, news etc)

  async function getCachedStaticData(collectionName: string, id?: string, queryOptions?: { limit?: number, orderBy?: string, orderDir?: 'asc' | 'desc' }) {
    const cacheKey = `${collectionName}${id ? '_' + id : ''}${queryOptions ? '_' + JSON.stringify(queryOptions) : ''}`;
    const now = Date.now();

    // Use shorter TTL for things the admin might update frequently and expect immediate results
    const dynamicCollections = ['depositMethods', 'news', 'promotions', 'education', 'tournaments', 'pages'];
    const currentTTL = dynamicCollections.includes(collectionName) ? DYNAMIC_CACHE_TTL : CACHE_TTL;

    if (appCache[cacheKey] && (now - appCache[cacheKey].timestamp < currentTTL)) {
      return appCache[cacheKey].data;
    }

    if (!db || dbReadAccessDenied || dbQuotaExceeded) {
        console.warn(`[Cache] Database access restricted for ${collectionName}. Returning stale or empty.`);
        return appCache[cacheKey]?.data || (id ? null : []);
    }

    try {
      let data;
      console.log(`[Cache] Fetching fresh ${collectionName} from Firestore...`);
      if (id) {
        const doc = await db.collection(collectionName).doc(id).get();
        data = doc.exists ? { id: doc.id, ...doc.data() } : null;
      } else {
        let q: any = db.collection(collectionName);
        if (queryOptions?.orderBy) {
            q = q.orderBy(queryOptions.orderBy, queryOptions.orderDir || 'desc');
        }
        if (queryOptions?.limit) {
            q = q.limit(queryOptions.limit);
        }
        const snap = await q.get();
        data = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      }

      appCache[cacheKey] = { data, timestamp: now };
      return data;
    } catch (e: any) {
      if (e?.code === 8 || e?.message?.includes('RESOURCE_EXHAUSTED')) {
          dbQuotaExceeded = true;
          lastQuotaExceedTime = Date.now();
          console.warn(`Firestore quota exceeded while caching ${collectionName}. Using stale if available.`);
      }
      console.error(`Error fetching ${cacheKey} for cache:`, e.message);
      return appCache[cacheKey]?.data || (id ? null : []);
    }
  }

  // Aggregate endpoint to load initial app state in ONE request
  app.get('/api/app/boot', async (req, res) => {
    try {
        console.log(`[Boot] Requested by user. dbStatus: ${!!db}, quota: ${dbQuotaExceeded}, accessDenied: ${dbReadAccessDenied}`);
        const [config, aboutUs, regulations, clientAgreement, news, education, promotions, tournaments, depositMethods] = await Promise.all([
            getCachedStaticData('app_config', 'settings'),
            getCachedStaticData('pages', 'about_us'),
            getCachedStaticData('pages', 'regulations'),
            getCachedStaticData('pages', 'client_agreement'),
            getCachedStaticData('news', undefined, { limit: 20, orderBy: 'date' }),
            getCachedStaticData('education', undefined, { limit: 20 }),
            getCachedStaticData('promotions', undefined, { limit: 10 }),
            getCachedStaticData('tournaments', undefined, { limit: 10 }),
            getCachedStaticData('depositMethods', undefined, { limit: 50 })
        ]);

        console.log(`[Boot] Collection counts - news: ${news?.length || 0}, depMethods: ${depositMethods?.length || 0}`);
        if (depositMethods && depositMethods.length > 0) {
            depositMethods.forEach((m: any) => {
                console.log(` - Method: ${m.name} | Category: ${m.category} | Active: ${m.isActive}`);
            });
        }

        res.json({
            config,
            pages: { aboutUs, regulations, clientAgreement },
            news,
            education,
            promotions,
            tournaments,
            depositMethods,
            diagnostics: {
                dbInit: !!db,
                quotaExceeded: dbQuotaExceeded,
                accessDenied: dbReadAccessDenied,
                methodCount: depositMethods?.length || 0
            },
            timestamp: Date.now()
        });
    } catch (e) {
        console.error("Boot API failure:", e);
        res.status(500).json({ error: 'Failed to boot app data' });
    }
  });

  const profileCache: Record<string, { data: any, timestamp: number }> = {};
  app.get('/api/user/check-2fa', async (req, res) => {
      const uid = req.query.uid as string;
      if (!uid) return res.status(400).json({ error: 'Missing UID' });

      // Check cache first (30s cache for profile/2fa status)
      if (profileCache[uid] && (Date.now() - profileCache[uid].timestamp < 30000)) {
          return res.json({
              tfaEnabled: profileCache[uid].data.tfaEnabled,
              tfaMode: profileCache[uid].data.tfaMode,
              tfaSecret: profileCache[uid].data.tfaSecret
          });
      }

      if (dbQuotaExceeded) {
          return res.json({ tfaEnabled: false }); // Fail open gracefully if quota is out, or use stale cache
      }

      try {
          const userDoc = await db.collection('users').doc(uid).get();
          if (userDoc.exists) {
              const data = userDoc.data();
              profileCache[uid] = { data, timestamp: Date.now() };
              res.json({
                  tfaEnabled: data.tfaEnabled || false,
                  tfaMode: data.tfaMode || 'app',
                  tfaSecret: data.tfaSecret || null
              });
          } else {
              res.status(404).json({ error: 'User not found' });
          }
      } catch (e: any) {
          if (e?.code === 8 || e?.message?.includes('RESOURCE_EXHAUSTED')) {
              dbQuotaExceeded = true;
              lastQuotaExceedTime = Date.now();
          }
          res.json({ tfaEnabled: false });
      }
  });

  // Sanitization and symbol mapping for FMP
  function getFMPSymbol(pair: string): string {
      const symbolMap: Record<string, string> = {
          'BTC/USD': 'BTCUSD',
          'ETH/USD': 'ETHUSD',
          'SOL/USD': 'SOLUSD',
          'ADA/USD': 'ADAUSD',
          'DOT/USD': 'DOTUSD',
          'AVAX/USD': 'AVAXUSD',
          'LINK/USD': 'LINKUSD',
          'UNI/USD': 'UNIUSD',
          'AAVE/USD': 'AAVEUSD',
          'BCH/USD': 'BCHUSD',
          'TON/USD': 'TONUSD',
          'Gold (OTC)': 'XAUUSD',
          'Oil (OTC)': 'WTIUSD',
          'Crypto IDX': 'BTCUSD',
          'Apple (OTC)': 'AAPL',
          'Tesla (OTC)': 'TSLA',
          'Yum Brands': 'YUM',
          'Kusama': 'KSMUSD',
          'BAR/USD': 'BARUSD'
      };

      if (symbolMap[pair]) return symbolMap[pair];
      
      // Default sanitization for Forex and others
      return pair.replace('/', '').replace(/\s*\(.*?\)/g, '').replace(/\s+/g, '');
  }

  // Twelve Data API integration
  async function getTwelveDataPrice(pair: string): Promise<number | null> {
      const apiKey = process.env.TWELVEDATA_API_KEY;
      if (!apiKey) return null;
      
      const symbol = getFMPSymbol(pair);
      try {
          // TwelveData uses different symbol mapping for some assets.
          // For simplicity, attempt with the pair symbol provided.
          const response = await axios.get(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`);
          
          if (response.data && response.data.price) {
              return parseFloat(response.data.price);
          }
      } catch (e: any) {
          console.warn(`TwelveData fetch failed for ${pair}:`, e.message);
      }
      return null;
  }

  // Real-time market data integration
  async function getRealMarketPrice(pair: string): Promise<number | null> {
      const apiKeyRaw = process.env.FMP_API_KEY;
      const apiKey = apiKeyRaw?.replace('apikey=', '');
      
      // Check cache first
      if (priceCache[pair] && (Date.now() - priceCache[pair].lastFetched < 30000)) {
          return priceCache[pair].price;
      }
      
      // Try TwelveData first as preferred provider
      const tdPrice = await getTwelveDataPrice(pair);
      if (tdPrice) {
          priceCache[pair] = { price: tdPrice, lastFetched: Date.now(), invalid: false };
          return tdPrice;
      }
      
      if (priceCache[pair]?.invalid) {
          if (pair.includes('/USD') || pair === 'Crypto IDX') {
              try {
                  const binanceSymbol = pair === 'Crypto IDX' ? 'BTCUSDT' : getFMPSymbol(pair).replace('USD', 'USDT');
                  const binanceRes = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
                  if (binanceRes.data && binanceRes.data.price) {
                      const price = parseFloat(binanceRes.data.price);
                      priceCache[pair] = { price, lastFetched: Date.now(), invalid: false };
                      return price;
                  }
              } catch (binanceErr) {
                  // Binance failed and FMP is marked invalid, so return null
              }
          }
          return null;
      }

      // Try Binance fallback for crypto if no FMP key or FMP fails
      if (pair.includes('/USD') || pair === 'Crypto IDX') {
          try {
              const binanceSymbol = pair === 'Crypto IDX' ? 'BTCUSDT' : getFMPSymbol(pair).replace('USD', 'USDT');
              const binanceRes = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
              if (binanceRes.data && binanceRes.data.price) {
                  const price = parseFloat(binanceRes.data.price);
                  priceCache[pair] = { price, lastFetched: Date.now(), invalid: false };
                  return price;
              }
          } catch (binanceErr) {
              // Fallback to FMP
          }
      }

      if (!apiKey) return null;

      try {
          const symbol = getFMPSymbol(pair);
          
          // Try standard quote first
          let response = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`);
          
          if (Array.isArray(response.data) && response.data.length > 0) {
              const price = response.data[0].price;
              priceCache[pair] = { price, lastFetched: Date.now(), invalid: false };
              return price;
          }

          // If standard fails or empty, and it looks like Forex, try the dedicated FX endpoint
          if (pair.includes('/') || pair.includes('OTC')) {
              try {
                  const fxRes = await axios.get(`https://financialmodelingprep.com/api/v3/fx/${symbol}?apikey=${apiKey}`);
                  if (Array.isArray(fxRes.data) && fxRes.data.length > 0) {
                     const price = fxRes.data[0].bid; // FX endpoint uses bid/ask
                     priceCache[pair] = { price, lastFetched: Date.now(), invalid: false };
                     return price;
                  }
              } catch (fxErr) {
                  // Ignore FX specific error
              }
          }
          
          return null;
      } catch (e: any) {
          if (e.response?.status === 403 || e.response?.status === 404) {
              console.warn(`Pair ${pair} forbidden/not found. Blacklisting.`);
              priceCache[pair] = { price: 0, lastFetched: Date.now(), invalid: true };
          }
          return null;
      }
  }

  async function fetchAllRealPrices(): Promise<void> {
      try {
          const apiKeyRaw = process.env.FMP_API_KEY;
          const apiKey = apiKeyRaw?.replace('apikey=', '');
          
          const now = Date.now();
          const binanceFetchedPairs = new Set<string>();

          // Always try to fetch crypto from Binance first (no API key needed) Check check regardless of FMP blacklisting
          const cryptoPairs = Object.keys(markets).filter(p => p.includes('/USD') || p === 'Crypto IDX');
          
          // Shift history to avoid giant candles
          const safeApplyRealPrice = (pair: string, realP: number) => {
              // Apply to both streams
              [
                { m: markets_real, h: history_real, c: currentCandles_real, type: 'real' },
                { m: markets_demo, h: history_demo, c: currentCandles_demo, type: 'demo' }
              ].forEach(({ m, h, c, type }) => {
                  const data = m[pair];
                  if (!data) return;
                  
                  const gap = realP - data.price;
                  // If the price differs by more than 20x volatility, snap instantly and shift history
                  if (Math.abs(gap) > data.volatility * 20) {
                      data.price = realP;
                      data.targetPrice = null;
                      
                      // Shift current candle
                      if (c[pair]) {
                          c[pair].open += gap;
                          c[pair].high += gap;
                          c[pair].low += gap;
                          c[pair].close += gap;
                      }
                      
                      // Shift history
                      if (h[pair]) {
                          for (const cand of h[pair]) {
                              cand.open += gap;
                              cand.high += gap;
                              cand.low += gap;
                              cand.close += gap;
                          }
                      }
                      
                      // Force client to redraw with shifted history
                      io.to(type).emit('force_history_update', { pair, data: h[pair] });
                  } else {
                      data.targetPrice = realP;
                  }
              });
          };

          for (const p of cryptoPairs) {
              try {
                  const binanceSymbol = p === 'Crypto IDX' ? 'BTCUSDT' : getFMPSymbol(p).replace('USD', 'USDT');
                  const binanceRes = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
                  
                  if (binanceRes.data && binanceRes.data.price) {
                      const realP = parseFloat(binanceRes.data.price);
                      priceCache[p] = { price: realP, lastFetched: now, invalid: false };
                      safeApplyRealPrice(p, realP);
                      binanceFetchedPairs.add(p);
                  }
              } catch (err) {
                  // Ignore and let FMP try if available
              }
          }

          if (!apiKey) return;

          // Filter pairs for FMP: must NOT be successfully fetched via Binance, and must NOT be blacklisted/marked invalid
          const fmpPairs = Object.keys(markets).filter(p => !binanceFetchedPairs.has(p) && !priceCache[p]?.invalid);

          // Separate symbols into categories for better FMP API compatibility
          const stocks: string[] = [];
          const others: string[] = []; // Forex, Crypto, etc.
          
          for (const p of fmpPairs) {
              const sym = getFMPSymbol(p);
              if (p.includes('/') || p.includes('OTC') || p.includes('IDX')) {
                  others.push(sym);
              } else {
                  stocks.push(sym);
              }
          }

          const fetchBatch = async (symbols: string[], isStocks: boolean) => {
              if (symbols.length === 0) return;
              try {
                  const endpoint = isStocks ? 'quote' : 'quote';
                  const response = await axios.get(`https://financialmodelingprep.com/api/v3/${endpoint}/${symbols.join(',')}?apikey=${apiKey}`, { timeout: 5000 });
                  
                  if (Array.isArray(response.data)) {
                      const priceMap = new Map();
                      for (const item of response.data) {
                          const p = item.price || item.bid || item.ask;
                          if (p) priceMap.set(item.symbol, p);
                      }
                      
                      for (const pair of fmpPairs) {
                          const sym = getFMPSymbol(pair);
                          if (priceMap.has(sym)) {
                              const realP = priceMap.get(sym);
                              priceCache[pair] = { price: realP, lastFetched: now, invalid: false };
                              if (realP && markets[pair]) {
                                  safeApplyRealPrice(pair, realP);
                              }
                          }
                      }
                  }
              } catch (e: any) {
                  if (e.response?.status === 403 || e.response?.status === 401) {
                      console.warn(`Batch 403/401 for ${isStocks ? 'Stocks' : 'Others'}. Marking symbols as invalid for this session.`);
                      // Instead of retrying individually and blocking, mark them so we don't spam the API
                      symbols.forEach(sym => {
                         // Find all pairs that map to this symbol
                         for (const pair of Object.keys(markets)) {
                             if (getFMPSymbol(pair) === sym) {
                                 priceCache[pair] = { price: 0, lastFetched: now, invalid: true };
                             }
                         }
                      });
                  } else {
                      console.error(`Error fetching batch for ${isStocks ? 'Stocks' : 'Others'}:`, e.message);
                  }
              }
          };

          const markSymbolInvalid = (sym: string) => {
              for (const pair of Object.keys(markets)) {
                  if (getFMPSymbol(pair) === sym) {
                      priceCache[pair] = { ...priceCache[pair], lastFetched: now, invalid: true };
                  }
              }
          };

          // Process batches in parallel but with a small delay for stocks/others
          await Promise.all([
              fetchBatch(stocks, true),
              (async () => {
                  for (let i = 0; i < others.length; i += 10) {
                      await fetchBatch(others.slice(i, i + 10), false);
                      // Avoid hitting rate limits if multiple chunks
                      if (others.length > 10) await new Promise(r => setTimeout(r, 200));
                  }
              })()
          ]);
      } catch (globalErr) {
          console.error("Unhandled exception in fetchAllRealPrices implementation:", globalErr);
      }
  }

  // Cache for historical data
  const historyCache: Record<string, boolean> = {};

  // Fetch historical data from FMP for 1 minute intervals
  async function getHistoricalData(pair: string): Promise<any[]> {
      if (blacklistedPairs.has(pair)) return [];
      const apiKeyRaw = process.env.FMP_API_KEY;
      const apiKey = apiKeyRaw?.replace('apikey=', '');
      if (!apiKey || historyCache[pair]) return [];
      try {
          const symbol = getFMPSymbol(pair);
          // Get 1-minute historical data for the last 500 periods
          const response = await axios.get(`https://financialmodelingprep.com/api/v3/historical-chart/1min/${symbol}?apikey=${apiKey}`);
          
          historyCache[pair] = true;
          
          if (Array.isArray(response.data)) {
              return response.data.slice(0, HISTORY_SIZE).reverse().map((d: any) => ({
                  time: Math.floor(new Date(d.date).getTime() / 1000),
                  open: d.open,
                  high: d.high,
                  low: d.low,
                  close: d.close
              }));
          }
      } catch (e: any) {
          if (e.response?.status === 404 || e.response?.status === 403) {
              console.warn(`Pair ${pair} forbidden/not found or forbidden on FMP (${e.response?.status}). Blacklisting.`);
              blacklistedPairs.add(pair);
              historyCache[pair] = true;
          } else if (e.response?.status === 429) {
              console.warn(`Rate limited while fetching history for ${pair}.`);
          } else {
              console.error(`Error fetching history for ${pair}:`, e.message);
          }
      }
      return [];
  }
  
  let systemActive = true;
  let globalManipulationMode: 'neutral' | 'always_loss' | 'always_win' = 'neutral';
  
  const history: Record<string, any[]> = {};
  const currentCandles: Record<string, any> = {};
  const momentums: Record<string, number> = {}; // Track price momentum for smoothing
  const HISTORY_SIZE = 150000; // Limit history to prevent OOM crashes (extremely large to allow unlimited candles like Binomo)

  // Set to keep track of blacklisted pairs
  const blacklistedPairs = new Set<string>();

  // Helper to sanitize pair names for doc IDs (replace / with _)
  const sanitize = (name: string) => name.replace(/\//g, '_').replace(/\s+/g, '');

  let dbWriteAccessDenied = false;
  let dbWriteQuotaExceeded = false;
  let lastQuotaExceedTime = 0;
  
  const PRIMARY_ASSETS = [
    'Crypto IDX', 'EUR/USD', 'BTC/USD', 'GBP/USD (OTC)', 'EUR/USD (OTC)', 
    'USD/JPY (OTC)', 'Gold (OTC)', 'Apple (OTC)', 'Tesla (OTC)', 'Oil (OTC)'
  ];
  const dirtyPairs = new Set<string>();

  async function dbRetry<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            const isTransient = error?.code === 4 || // gRPC DEADLINE_EXCEEDED
                                error?.code === 14 || // gRPC UNAVAILABLE
                                error?.message?.includes('DEADLINE_EXCEEDED') ||
                                error?.message?.includes('unavailable') ||
                                error?.message?.includes('Waiting for LB pick');
            if (isTransient && i < retries - 1) {
                const backoff = delay * Math.pow(2, i);
                console.warn(`[Firestore Transient Error] Retrying DB operation in ${backoff}ms due to: ${error.message || error}`);
                await new Promise(res => setTimeout(res, backoff));
            } else {
                throw error;
            }
        }
    }
    throw new Error("Firestore retry limit exceeded");
  }

  async function saveHistoricalCandlesToDB(pair: string, candles: any[], chunkFilterCandles: any[] | boolean = false) {
    if (!db || dbWriteAccessDenied) return;
    if (dbWriteQuotaExceeded && Date.now() - lastQuotaExceedTime < 120000) return;
    if (dbWriteQuotaExceeded) dbWriteQuotaExceeded = false;

    try {
      const pairId = sanitize(pair);
      
      const CHUNK_SECONDS = 10000; 
      const nowSecs = Math.floor(Date.now() / 1000);
      
      let referenceCandles: any[];
      if (Array.isArray(chunkFilterCandles)) {
          referenceCandles = chunkFilterCandles;
      } else if (chunkFilterCandles === true) {
          referenceCandles = candles;
      } else {
          referenceCandles = candles.filter(c => c.time >= nowSecs - 120);
      }
      
      let chunkIds = new Set(referenceCandles.map(c => Math.floor(c.time / CHUNK_SECONDS)));
      
      if (chunkIds.size === 0 && candles.length > 0) {
          chunkIds.add(Math.floor(candles[candles.length - 1].time / CHUNK_SECONDS));
      }

      for (const chunkId of chunkIds) {
          const chunkCandles = candles.filter(c => Math.floor(c.time / CHUNK_SECONDS) === chunkId);
          await dbRetry(async () => {
              await db.collection('markets').doc(pairId).collection('history').doc(`chunk_${chunkId}`).set({
                  chunkId,
                  candles: chunkCandles,
                  updatedAt: Date.now()
              });
          });
      }
    } catch (error: any) {
      if (error?.code === 8 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
          dbWriteQuotaExceeded = true;
          lastQuotaExceedTime = Date.now();
          console.warn(`Firebase write quota exceeded while saving historical candles for ${pair}. Throttling DB writes.`);
      } else if (error?.code === 7 || error?.message?.includes('PERMISSION_DENIED') || error?.message?.includes('Could not load the default credentials')) {
          dbWriteAccessDenied = true;
          console.warn('Firebase Admin write access denied. Disabling historical candle saving.');
      } else {
          console.error(`Error saving historical candles for ${pair}:`, error);
      }
    }
  }

  async function saveCandleToDB(pair: string, candle: any) {
    // Keep signatures intact, we mark the asset as modified (dirty)
    dirtyPairs.add(pair);
  }

  let dbReadAccessDenied = false;
  let dbQuotaExceeded = false;

async function processRevenueShare(userId: string, lostAmount: number, currency: string) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return;
    
    const userData = userDoc.data();
    if (!userData || !userData.referredByUid) return;

    const referrerUid = userData.referredByUid;
    const referrerDoc = await db.collection('users').doc(referrerUid).get();
    
    if (!referrerDoc.exists) return;
    const referrerData = referrerDoc.data();
    if (!referrerData) return;

    // Determine share percentage (default 80% as requested in the app text, or from tier)
    let sharePercent = 80;
    if (referrerData.customAffiliateShare) {
        sharePercent = referrerData.customAffiliateShare;
    } else {
        // Basic tier logic
        const refCount = referrerData.referralCount || 0;
        if (refCount >= 201) sharePercent = 80;
        else if (refCount >= 51) sharePercent = 70;
        else if (refCount >= 11) sharePercent = 60;
        else sharePercent = 50; // default for low volume partners
    }

    const shareAmount = lostAmount * (sharePercent / 100);

    // Update referrer balance
    await db.collection('users').doc(referrerUid).update({
      affiliateBalance: admin.firestore.FieldValue.increment(shareAmount),
      totalAffiliateEarnings: admin.firestore.FieldValue.increment(shareAmount)
    });

    // Log the commission
    await db.collection('affiliate_commissions').add({
        referrerUid,
        referredUid: userId,
        amount: shareAmount,
        lostAmount: lostAmount,
        currency: currency,
        percent: sharePercent,
        createdAt: admin.firestore.Timestamp.now(),
        type: 'revenue_share'
    });

    console.log(`[Affiliate] Processed ${sharePercent}% share for ${referrerUid} from loss by ${userId}: $${shareAmount.toFixed(2)}`);

  } catch (err) {
    console.error("Error processing revenue share:", err);
  }
}

  async function loadCandleHistoryFromDB(pair: string): Promise<any[]> {
    if (!db || dbReadAccessDenied || dbQuotaExceeded) return [];
    if (dbQuotaExceeded && Date.now() - lastQuotaExceedTime < 120000) return [];
    if (dbQuotaExceeded) dbQuotaExceeded = false;

    try {
      const pairId = sanitize(pair);
      
      // 1. Try to load new chunked history with dbRetry
      const chunkSnapshot = await dbRetry(async () => {
          return await db.collection('markets').doc(pairId).collection('history')
            .orderBy('chunkId', 'desc')
            .limit(50) // Load last 50 chunks (~500,000 candles max)
            .get();
      });

      if (!chunkSnapshot.empty && chunkSnapshot.docs.length > 0) {
          let allCandles: any[] = [];
          const docs = chunkSnapshot.docs.reverse(); // put oldest first
          for (const doc of docs) {
              allCandles = allCandles.concat(doc.data().candles || []);
          }
          if (allCandles.length > 0) {
              console.log(`Successfully loaded ${allCandles.length} candles from ${docs.length} chunks for ${pair}`);
              return allCandles;
          }
      }
      
      // 2. Fallback choice: load old single document format with dbRetry
      const docSnap = await dbRetry(async () => {
          return await db.collection('markets').doc(pairId).collection('history').doc('candles').get();
      });
      if (docSnap.exists) {
          const data = docSnap.data();
          if (data && Array.isArray(data.candles)) {
              console.log(`Successfully loaded ${data.candles.length} historical candles from legacy document for ${pair}`);
              return data.candles;
          }
      }
      
      // 3. Fallback choice: load older, individual candle subcollections with dbRetry
      const snapshot = await dbRetry(async () => {
          return await db.collection('markets').doc(pairId).collection('candles')
            .orderBy('time', 'desc')
            .limit(1000)
            .get();
      });
      
      if (!snapshot.empty) {
          const legacyCandles = snapshot.docs.map(doc => doc.data()).reverse();
          console.log(`Successfully loaded ${legacyCandles.length} legacy candles from subcollection for ${pair}`);
          return legacyCandles;
      }
      
      return [];
    } catch (error: any) {
      if (error?.code === 8 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
          dbQuotaExceeded = true;
          lastQuotaExceedTime = Date.now();
          console.warn(`Firestore quota exceeded while loading history for ${pair}. Throttling DB reads.`);
      } else if (error?.code === 7 || error?.message?.includes('PERMISSION_DENIED') || error?.message?.includes('Could not load the default credentials')) {
          dbReadAccessDenied = true;
          console.warn(`Firebase Admin read access denied. Disabling DB loading for all assets.`);
      } else {
          console.error(`Error loading history for ${pair}:`, error);
      }
      return [];
    }
  }
  
  // Activities Banners Data
  let activities = [
    { id: '1', title: 'Copy trading', imageUrl: '', bgGradient: 'from-amber-600 to-yellow-900', icon: 'Copy' },
    { id: '2', title: 'Copy trading\neducation', imageUrl: '', bgGradient: 'from-[#1a1a1a] to-[#000]', icon: 'GraduationCap' },
    { id: '3', title: 'Heikin Ashi', imageUrl: '', bgGradient: 'from-blue-900 to-[#1a1a1a]', icon: 'BarChart' },
  ];
  
  // Initialization logic is now consolidated in the background process below after server start

  // API routes
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  let marketInitializationComplete = false;

  async function ensureMarketInitialized() {
      if (marketInitializationComplete) return;
      while (!marketInitializationComplete) {
          await new Promise(resolve => setTimeout(resolve, 100));
      }
  }

  // ========== MARKET DATA INITIALIZATION ==========
  // Pre-populated instantly with high-fidelity mock data to avoid blocking initial connections or causing endless spins
  (async () => {
    try {
      console.log('Synchronously pre-populating market mock data for instant boot...');
      const startNow = Math.floor(Date.now() / 1000);
      const BASE_TICK_SECONDS = 5;
      const candleStart = startNow - (startNow % BASE_TICK_SECONDS);
      const TARGET_DEPTH = 3000;

      const pairKeys = Object.keys(markets);
      
      for (const pair of pairKeys) {
         history_real[pair] = [];
         history_demo[pair] = [];

         let tempPrice = markets[pair].price;
         let time = candleStart - (TARGET_DEPTH * BASE_TICK_SECONDS);
         
         for(let i = 0; i < TARGET_DEPTH; i++) {
             let open = tempPrice;
             if (Math.random() < 0.15) {
               open += (Math.random() - 0.5) * (markets[pair].volatility * 0.3);
             }
             const change = (Math.random() - 0.5) * (markets[pair].volatility * 1.0);
             const close = open + change;
             const high = Math.max(open, close) + (Math.random() * markets[pair].volatility * 0.4);
             const low = Math.min(open, close) - (Math.random() * markets[pair].volatility * 0.4);
             const candle = {
                 time: time,
                 open: open,
                 high: high,
                 low: low,
                 close: close,
                 volume: Math.random() * 200
             };
             history_real[pair].push(candle);
             history_demo[pair].push({ ...candle });
             tempPrice = close;
             time += BASE_TICK_SECONDS;
         }
         markets_real[pair].price = tempPrice;
         markets_demo[pair].price = tempPrice;

         const cndl = { 
             time: candleStart, 
             open: tempPrice, 
             high: tempPrice, 
             low: tempPrice, 
             close: tempPrice,
             volume: 0
         };
         currentCandles_real[pair] = { ...cndl };
         currentCandles_demo[pair] = { ...cndl };
         
         if (!markets_real[pair].manipulation) {
             markets_real[pair].manipulation = { targetTrend: 'random', profitPercentage: 0, enabled: false };
         }
         if (!markets_demo[pair].manipulation) {
             markets_demo[pair].manipulation = { targetTrend: 'random', profitPercentage: 0, enabled: false };
         }
      }

      // Mark initialized INSTANTLY so clients don't see any loading screen!
      marketInitializationComplete = true;
      console.log('Instant market mock pre-population complete. Live platform is online.');

      // Now, lazily and slowly fetch actual candles from Firestore in the background
      // This preserves historical data across restarts without blocking the server boot or clients' loading
      (async () => {
         console.log('Starting lazy background load of historical candles from Firestore...');
         for (const pair of pairKeys) {
             try {
                const dbHistory = await loadCandleHistoryFromDB(pair);
                if (dbHistory && dbHistory.length > 0) {
                     const firstCandle = dbHistory[0];
                     const lastCandle = dbHistory[dbHistory.length - 1];
                     
                     // 1. Fill potential timeline gaps between DB and the current boot time (e.g. server downtime of 1 hour/day)
                     const gapSeconds = candleStart - lastCandle.time;
                     const gapCandlesCount = Math.floor(gapSeconds / BASE_TICK_SECONDS);
                     const gapHistory: any[] = [];
                     
                     if (gapCandlesCount > 0 && gapCandlesCount < 100000) {
                         console.log(`[Candle Gap Filler] Gap found for ${pair}: filling ${gapCandlesCount} missing candles (dormancy time: ${(gapSeconds / 3600).toFixed(2)} hours)...`);
                         let tempPrice = lastCandle.close;
                         let time = lastCandle.time + BASE_TICK_SECONDS;
                         
                         for (let i = 0; i < gapCandlesCount; i++) {
                             let open = tempPrice;
                             if (Math.random() < 0.15) {
                                 open += (Math.random() - 0.5) * (markets[pair].volatility * 0.3);
                             }
                             const change = (Math.random() - 0.5) * (markets[pair].volatility * 1.0);
                             const close = open + change;
                             const high = Math.max(open, close) + (Math.random() * markets[pair].volatility * 0.4);
                             const low = Math.min(open, close) - (Math.random() * markets[pair].volatility * 0.4);
                             
                             gapHistory.push({
                                 time: time,
                                 open: open,
                                 high: high,
                                 low: low,
                                 close: close,
                                 volume: Math.random() * 200
                             });
                             tempPrice = close;
                             time += BASE_TICK_SECONDS;
                         }
                     }
                     
                     // 2. Prepend generation if overall depth is still below target depth (e.g., initial bootstrap)
                     const prependedHistory = [];
                     const countToGenerate = Math.max(0, TARGET_DEPTH - (dbHistory.length + gapHistory.length));
                     if (countToGenerate > 0) {
                         let tempPrice = firstCandle.open;
                         let time = firstCandle.time - (countToGenerate * BASE_TICK_SECONDS);
                         
                         for (let i = 0; i < countToGenerate; i++) {
                             let open = tempPrice;
                             if (Math.random() < 0.15) {
                                 open += (Math.random() - 0.5) * (markets[pair].volatility * 0.3);
                             }
                             const change = (Math.random() - 0.5) * (markets[pair].volatility * 1.0);
                             const close = open + change;
                             const high = Math.max(open, close) + (Math.random() * markets[pair].volatility * 0.4);
                             const low = Math.min(open, close) - (Math.random() * markets[pair].volatility * 0.4);
                             
                             prependedHistory.push({
                                 time: time,
                                 open: open,
                                 high: high,
                                 low: low,
                                 close: close,
                                 volume: Math.random() * 200
                             });
                             tempPrice = close;
                             time += BASE_TICK_SECONDS;
                         }
                     }
                     
                     const fullHistory = [...prependedHistory, ...dbHistory, ...gapHistory];
                     history_real[pair] = JSON.parse(JSON.stringify(fullHistory));
                     history_demo[pair] = JSON.parse(JSON.stringify(fullHistory));

                     const finalLatestCandle = fullHistory[fullHistory.length - 1];
                     markets_real[pair].price = finalLatestCandle.close;
                     markets_demo[pair].price = finalLatestCandle.close;

                     const cndl = { 
                         time: candleStart, 
                         open: finalLatestCandle.close, 
                         high: finalLatestCandle.close, 
                         low: finalLatestCandle.close, 
                         close: finalLatestCandle.close,
                         volume: 0
                     };
                     currentCandles_real[pair] = { ...cndl };
                     currentCandles_demo[pair] = { ...cndl };

                     // Broadcast update to anyone connected so the charts transition smoothly to actual real history
                     io.to('real').emit('force_history_update', { pair, data: history_real[pair] });
                     io.to('demo').emit('force_history_update', { pair, data: history_demo[pair] });
                     
                     console.log(`Successfully restored actual database history for ${pair} in background (${dbHistory.length} database candles, ${gapHistory.length} gap filled).`);
                     
                     // 3. Immediately save newly filled gaps back to Firestore to secure continuous timeline data database-side!
                     if (gapHistory.length > 0) {
                         console.log(`[Candle Gap Filler] Persisting filled gap chunks for ${pair} to DB...`);
                         await saveHistoricalCandlesToDB(pair, fullHistory, gapHistory);
                     }
                } else {
                     // Empty DB fallback: Generate a deep default history of 6000 continuous candles (~8.3 hours)
                     // and IMMEDIATELY save it all to Firestore. This creates a solid baseline of historical data!
                     console.log(`No historical data found in DB for ${pair}. Generating 6000 initial default candles (~8.3 hours)...`);
                     const initialHistory: any[] = [];
                     let tempPrice = markets[pair].price;
                     const countToGenerate = 6000;
                     let time = candleStart - (countToGenerate * BASE_TICK_SECONDS);
                     
                     for (let i = 0; i < countToGenerate; i++) {
                         let open = tempPrice;
                         if (Math.random() < 0.15) {
                             open += (Math.random() - 0.5) * (markets[pair].volatility * 0.3);
                         }
                         const change = (Math.random() - 0.5) * (markets[pair].volatility * 1.0);
                         const close = open + change;
                         const high = Math.max(open, close) + (Math.random() * markets[pair].volatility * 0.4);
                         const low = Math.min(open, close) - (Math.random() * markets[pair].volatility * 0.4);
                         
                         initialHistory.push({
                             time: time,
                             open: open,
                             high: high,
                             low: low,
                             close: close,
                             volume: Math.random() * 200
                         });
                         tempPrice = close;
                         time += BASE_TICK_SECONDS;
                     }
                     
                     history_real[pair] = JSON.parse(JSON.stringify(initialHistory));
                     history_demo[pair] = JSON.parse(JSON.stringify(initialHistory));

                     markets_real[pair].price = tempPrice;
                     markets_demo[pair].price = tempPrice;

                     const cndl = { 
                         time: candleStart, 
                         open: tempPrice, 
                         high: tempPrice, 
                         low: tempPrice, 
                         close: tempPrice,
                         volume: 0
                     };
                     currentCandles_real[pair] = { ...cndl };
                     currentCandles_demo[pair] = { ...cndl };

                     // Broadcast update to anyone connected so they can render immediately
                     io.to('real').emit('force_history_update', { pair, data: history_real[pair] });
                     io.to('demo').emit('force_history_update', { pair, data: history_demo[pair] });

                     console.log(`[Candle Initializer] Writing initial 6000 baseline candles across chunks to database for ${pair}...`);
                     await saveHistoricalCandlesToDB(pair, initialHistory, initialHistory);
                }
             } catch (err: any) {
                 console.warn(`Error lazy-loading background DB history for ${pair}:`, err.message);
             }
             // 400ms delay between assets to avoid CPU saturation and Firestore quota bursts
             await new Promise(r => setTimeout(r, 400));
         }
         console.log('Lazy background Firestore candle load process complete.');
      })();

    } catch (globalErr) {
      console.error('Unhandled exception in market initialization module:', globalErr);
      // Fallback in case of critical global error
      marketInitializationComplete = true;
    } finally {
      marketInitializationComplete = true;
      console.log('Market initialization background process complete.');

      // Start the background periodic staggered saver for candlestick history once initialization completes
      // This spreads the database writes evenly to prevent DEADLINE_EXCEEDED, connection saturation, and Firestore quota exhaustion.
      const dirtyPairsQueue: string[] = [];
      
      // Periodically collect dirty pairs into a queue
      setInterval(() => {
        if (dirtyPairs.size === 0) return;
        for (const pair of dirtyPairs) {
          // Only save if it is a major (primary) asset OR is actively being viewed/traded by users
          const isPrimary = PRIMARY_ASSETS.includes(pair);
          const isViewed = activeViewedPairs.has(pair);
          if (isPrimary || isViewed) {
            if (!dirtyPairsQueue.includes(pair)) {
              dirtyPairsQueue.push(pair);
            }
          }
        }
        dirtyPairs.clear();
      }, 30000); // Collect dirty pairs every 30 seconds

      // Save one pair from the queue every 6 seconds (up to 10 writes per minute max)
      // This spreads out writes extremely evenly, keeping database overhead completely negligible.
      setInterval(async () => {
        if (!db || dbWriteAccessDenied || dirtyPairsQueue.length === 0) return;
        
        // Prioritize PRIMARY_ASSETS if they are in the queue, otherwise take the first
        let indexToSave = dirtyPairsQueue.findIndex(p => PRIMARY_ASSETS.includes(p));
        if (indexToSave === -1) {
            indexToSave = 0;
        }
        
        const pair = dirtyPairsQueue.splice(indexToSave, 1)[0];
        try {
          const historyPool = history_real[pair] || [];
          if (historyPool.length > 0) {
            console.log(`[Candle DB Sync Sentry] Staggered saving ${pair} to Database... Remaining in save queue: ${dirtyPairsQueue.length}`);
            await saveHistoricalCandlesToDB(pair, historyPool);
          }
        } catch(err: any) {
          console.error(`Error in staggered candle saving for ${pair}:`, err.message);
        }
      }, 6000); // Extremely safe 6-second interval (safeguards against quotas and DEADLINE_EXCEEDED errors)
    }
  })();
  app.get('/api/activities', (req, res) => {
    res.json(activities);
  });

  app.get('/api/admin/config/fmp-key', (req, res) => {
      // Very basic security: could check admin roles if you persist auth, 
      // but without auth middleware, we'll just return it.
      const apiKeyRaw = process.env.FMP_API_KEY || '';
      res.json({ fmpApiKey: apiKeyRaw });
  });

  app.post('/api/admin/config/fmp-key', async (req, res) => {
      const { fmpApiKey } = req.body;
      const envPath = path.join(process.cwd(), '.env');
      try {
          let envContent = '';
          try {
              envContent = readFileSync(envPath, 'utf-8');
          } catch (e) {
              // File might not exist
          }

          if (envContent.includes('FMP_API_KEY=')) {
              envContent = envContent.replace(/FMP_API_KEY=.*/g, `FMP_API_KEY=${fmpApiKey}`);
          } else {
              envContent += `\nFMP_API_KEY=${fmpApiKey}\n`;
          }

          writeFileSync(envPath, envContent.trim() + '\n');
          process.env.FMP_API_KEY = fmpApiKey;
          res.json({ success: true });
      } catch (err) {
          console.error(err);
          res.status(500).json({ error: 'Failed to save FMP API Key' });
      }
  });

  app.post('/api/admin/activities', (req, res) => {
    const { action, payload } = req.body;
    if (action === 'update') {
       activities = payload;
       io.emit('activities_updated', activities);
       res.json({ success: true, activities });
    } else {
       res.status(400).json({ error: 'Invalid action' });
    }
  });

  app.get('/api/market/state', (req, res) => {
      res.json({ systemActive, markets: markets_real, globalManipulationMode });
  });

  app.post('/api/admin/market/global-manipulation', (req, res) => {
      const { mode } = req.body;
      globalManipulationMode = mode;
      io.emit('global_manipulation_status', globalManipulationMode);
      res.json({ success: true, mode: globalManipulationMode });
  });

  app.post('/api/admin/system/clear-cache', (req, res) => {
      // Clear the static data cache
      Object.keys(appCache).forEach(key => delete appCache[key]);
      console.log('App static cache cleared by admin action');
      res.json({ success: true, message: 'Cache cleared' });
  });

  app.post('/api/admin/market/system', (req, res) => {
      systemActive = req.body.active;
      io.emit('system_status', systemActive);
      res.json({ success: true, systemActive });
  });

  app.post('/api/admin/market/force-refresh', async (req, res) => {
      console.log('Force refreshing all market data from FMP...');
      for (const pair of Object.keys(markets)) {
          const realPrice = await getRealMarketPrice(pair);
          if (realPrice) {
              markets_real[pair].price = realPrice;
              markets_demo[pair].price = realPrice;
          }
           await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between requests to avoid rate limits
      }
      io.to('real').emit('market_settings_updated', markets_real);
      io.to('demo').emit('market_settings_updated', markets_demo);
      res.json({ success: true });
  });

  app.post('/api/admin/market/manipulation', (req, res) => {
      const { pair, targetTrend, profitPercentage, enabled, mode, accountType } = req.body;
      const types = accountType ? [accountType] : ['real', 'demo'];
      
      types.forEach(type => {
          const pool = type === 'real' ? markets_real : markets_demo;
          if (pool[pair]) {
              pool[pair].manipulation = { 
                  targetTrend, 
                  profitPercentage: parseFloat(profitPercentage) || 0, 
                  enabled: !!enabled,
                  mode: mode || 'percentage'
              };
              io.to(type).emit('market_settings_updated', pool);
          }
      });
      res.json({ success: true });
  });

  // ========== ATOMIC SETTLEMENT HELPER ==========
  async function settleTradeAtomically(tradeId: string, currentMarketPrice?: number) {
    if (!db || dbWriteAccessDenied) throw new Error('Database write access denied');
    
    return await db.runTransaction(async (transaction) => {
      const tradeDocRef = db.collection('trades').doc(tradeId);
      const tradeDoc = await transaction.get(tradeDocRef);
      
      if (!tradeDoc.exists) return { error: 'Trade not found' };
      const trade = tradeDoc.data();
      if (!trade) return { error: 'Trade data empty' };
      
      // CRITICAL: Check if already settled within the transaction
      if (trade.status !== 'open') {
        return { success: true, alreadySettled: true, trade };
      }

      const markets_pool = trade.accountType === 'real' ? markets_real : markets_demo;
      const m = markets_pool[trade.asset];
      const exitPrice = currentMarketPrice !== undefined ? currentMarketPrice : (m ? m.price : trade.entryPrice);

      // Decrement market pressure
      const dir = trade.type || trade.direction || 'up';
      if (m) {
        if (dir === 'up') {
          m.totalUp = Math.max(0, (m.totalUp || 0) - trade.amount);
        } else if (dir === 'down') {
          m.totalDown = Math.max(0, (m.totalDown || 0) - trade.amount);
        }
      }

      // Epsilon for floating point comparisons
      const diff = exitPrice - trade.entryPrice;
      const epsilon = 0.0000000001;
      let isWin = false;
      let isDraw = Math.abs(diff) < epsilon;

      if (!isDraw) {
        if (dir === 'up') {
          isWin = exitPrice > trade.entryPrice;
        } else {
          isWin = exitPrice < trade.entryPrice;
        }
      }

      let newStatus = 'lost';
      let payoutAmount = 0;

      if (isWin) {
        newStatus = 'won';
        const payoutPercent = Number(trade.payout || 80);
        payoutAmount = Number(trade.amount) + (Number(trade.amount) * (payoutPercent / 100));
      } else if (isDraw) {
        newStatus = 'draw';
        payoutAmount = Number(trade.amount);
      }

      // Sanity check for numbers to prevent Firestore corruption with NaN
      if (isNaN(payoutAmount)) payoutAmount = 0;

      const updateData = {
        status: newStatus,
        exitPrice: Number(exitPrice || 0),
        payoutAmount: Number(payoutAmount),
        updatedAt: admin.firestore.Timestamp.now()
      };

      // Perform updates
      transaction.update(tradeDocRef, updateData);

      if (payoutAmount > 0) {
        if (trade.accountType === 'tournament' && trade.tournamentId) {
          const pRef = db.collection('tournaments').doc(trade.tournamentId).collection('participants').doc(trade.userId);
          transaction.update(pRef, { score: admin.firestore.FieldValue.increment(payoutAmount) });
        } else {
          const userRef = db.collection('users').doc(trade.userId);
          const balanceField = (trade.accountType === 'demo' || trade.accountType === 'demo_account') ? 'demoBalance' : 'balance';
          transaction.update(userRef, { [balanceField]: admin.firestore.FieldValue.increment(payoutAmount) });
          console.log(`[Settlement] Incremented ${balanceField} by ${payoutAmount} for user ${trade.userId}`);
        }
      } else if (newStatus === 'lost' && (trade.accountType === 'real' || !trade.accountType)) {
        // Kick off rev share
        processRevenueShare(trade.userId, Number(trade.amount), trade.currency || 'USD');
      }

      return { 
        success: true, 
        trade: { ...trade, ...updateData, id: tradeId },
        userId: trade.userId
      };
    });
  }

  // ========== TRADE SETTLER ==========
  let tradeSettlerAccessDenied = false;
  let tradeSettlerQuotaExceeded = false;

  setInterval(async () => {
    if (!systemActive || !db || tradeSettlerAccessDenied || dbReadAccessDenied) return;
    if (tradeSettlerQuotaExceeded && Date.now() - lastQuotaExceedTime < 120000) return;
    if (tradeSettlerQuotaExceeded) tradeSettlerQuotaExceeded = false;
    
    try {
      const now = Date.now();
      const openTrades = await db.collection('trades')
        .where('status', '==', 'open')
        .where('expirationTime', '<', now - 500)
        .limit(15) 
        .get();
      
      if (openTrades.empty) return;
      
      for (const tradeDoc of openTrades.docs) {
        try {
          const result = await settleTradeAtomically(tradeDoc.id);
          if (result.success && !result.alreadySettled && result.trade) {
            console.log(`[Batch Settler] Settled trade ${tradeDoc.id} for ${result.userId}`);
            
            io.to(`user_${result.userId}`).emit('trade_settled', result.trade);
            
            const userRef = db.collection('users').doc(result.userId);
            const freshDoc = await userRef.get();
            const freshData = freshDoc.data();
            if (freshData) {
              io.to(`user_${result.userId}`).emit('user_profile_update', {
                balance: freshData.balance,
                demoBalance: freshData.demoBalance,
                totalLiveVolume: freshData.totalLiveVolume
              });
            }
          }
        } catch (e) {
          console.error(`[Batch Settler] Failed trade ${tradeDoc.id}:`, e);
        }
      }
    } catch (error: any) {
      if (error?.code === 8 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        tradeSettlerQuotaExceeded = true;
        lastQuotaExceedTime = Date.now();
      }
    }
  }, 4000);

  app.post('/api/admin/market/reset-pressure', (req, res) => {
      const { pair, accountType } = req.body;
      const types = accountType ? [accountType] : ['real', 'demo'];
      
      types.forEach(type => {
          const pool = type === 'real' ? markets_real : markets_demo;
          if (pool[pair]) {
              pool[pair].totalUp = 0;
              pool[pair].totalDown = 0;
              io.to(type).emit('market_settings_updated', pool);
          }
      });
      res.json({ success: true });
  });

  app.post('/api/admin/market/update', (req, res) => {
      const { pair, active, payout, trend, volatility, targetPrice, isFrozen, freezeReason, pump, dump, setPrice, houseEdge, maxTradeAmount, accountType, hidden } = req.body;
      const types = accountType ? [accountType] : ['real', 'demo'];

      types.forEach(type => {
          const pool = type === 'real' ? markets_real : markets_demo;
          if (pool[pair]) {
              const m = pool[pair];
              if (active !== undefined) m.active = active;
              if (payout !== undefined) m.payout = payout;
              if (trend !== undefined) m.trend = trend;
              if (volatility !== undefined) m.volatility = volatility;
              if (targetPrice !== undefined) m.targetPrice = targetPrice === '' ? null : parseFloat(targetPrice);
              if (isFrozen !== undefined) m.isFrozen = isFrozen;
              if (freezeReason !== undefined) m.freezeReason = freezeReason;
              if (houseEdge !== undefined) m.houseEdge = parseFloat(houseEdge);
              if (maxTradeAmount !== undefined) m.maxTradeAmount = parseFloat(maxTradeAmount);
              if (hidden !== undefined) m.hidden = hidden;
              
              if (pump) {
                  m.price += (m.volatility * (parseFloat(pump) || 1));
                  m.targetPrice = null;
              }
              if (dump) {
                  m.price -= (m.volatility * (parseFloat(dump) || 1));
                  m.targetPrice = null;
              }
              if (setPrice) {
                  m.price = parseFloat(setPrice);
                  m.targetPrice = null;
              }

              io.to(type).emit('market_settings_updated', pool);
          }
      });
      res.json({ success: true });
  });



  app.post('/api/trade', async (req, res) => {
      const { pair, amount, direction, accountType, userId } = req.body;
      const markets_pool = accountType === 'real' ? markets_real : markets_demo;

      if (markets_pool[pair]) {
          const m = markets_pool[pair];
          if (m.maxTradeAmount && amount > m.maxTradeAmount) {
              return res.status(400).json({ error: `Trade amount exceeds limit of ${m.maxTradeAmount}` });
          }

          // Authoritative balance deduction on server in a transaction to prevent race conditions
          if (userId && db && !dbWriteAccessDenied) {
              try {
                  await db.runTransaction(async (transaction) => {
                      const userRef = db.collection('users').doc(userId);
                      const userDoc = await transaction.get(userRef);
                      if (!userDoc.exists) throw new Error('User not found');
                      
                      const balanceField = accountType === 'real' ? 'balance' : 'demoBalance';
                      const currentBalance = userDoc.data()?.[balanceField] || 0;
                      
                      if (currentBalance < amount) {
                          throw new Error('Insufficient balance on server check');
                      }

                      transaction.update(userRef, {
                          [balanceField]: admin.firestore.FieldValue.increment(-amount),
                          ...(accountType === 'real' ? { totalLiveVolume: admin.firestore.FieldValue.increment(amount) } : {})
                      });
                  });

                  // Push updated balance to client immediately
                  const freshDoc = await db.collection('users').doc(userId).get();
                  const freshData = freshDoc.data();
                  if (freshData) {
                      io.to(`user_${userId}`).emit('user_profile_update', {
                          balance: freshData.balance,
                          demoBalance: freshData.demoBalance,
                          totalLiveVolume: freshData.totalLiveVolume
                      });
                  }
              } catch (error: any) {
                  console.error("Server-side balance deduction failed:", error.message);
                  return res.status(400).json({ error: error.message || 'Balance deduction failed' });
              }
          }

          // Now affect the corresponding pool volume
          if (direction === 'up') m.totalUp = (m.totalUp || 0) + amount;
          else m.totalDown = (m.totalDown || 0) + amount;

          res.json({ success: true });
      } else {
          res.status(404).json({ error: 'Pair not found' });
      }
  });

  app.post('/api/trade/settle-secure', async (req, res) => {
    const { tradeId } = req.body;
    if (!tradeId) return res.status(400).json({ error: 'Missing tradeId' });
    if (!db || dbWriteAccessDenied) return res.status(500).json({ error: 'Database access denied' });

    try {
      const result = await settleTradeAtomically(tradeId);
      if (result.error) return res.status(404).json({ error: result.error });

      // Emit sync events if it was actually settled by this request
      if (result.success && !result.alreadySettled && result.trade) {
        const uId = result.userId;
        io.to(`user_${uId}`).emit('trade_settled', result.trade);

        const userRef = db.collection('users').doc(uId);
        const freshDoc = await userRef.get();
        const freshData = freshDoc.data();
        if (freshData) {
          io.to(`user_${uId}`).emit('user_profile_update', {
            balance: freshData.balance,
            demoBalance: freshData.demoBalance,
            totalLiveVolume: freshData.totalLiveVolume
          });
        }
      }

      return res.json({ 
        success: true, 
        settled: true, 
        trade: result.trade,
        wasAlreadySettled: result.alreadySettled 
      });
    } catch (err: any) {
      console.error("Atomic settlement API failure:", err.message);
      res.status(500).json({ error: 'Internal settlement error' });
    }
  });

  app.get('/api/ip-info', async (req, res) => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch IP info' });
    }
  });

  // ========== WEBSOCKETS ==========
  io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('admin_broadcast', (data: { message: string }) => {
          console.log('Admin broadcasting message:', data.message);
          io.emit('system_notification', { 
              type: 'broadcast',
              message: data.message,
              timestamp: Date.now()
          });
      });

      socket.on('request_initial_data', async (params: { asset?: string, accountType?: 'real' | 'demo', userId?: string, isSwitch?: boolean } = {}) => {
        try {
            await ensureMarketInitialized();
            const requestedAsset = params?.asset;
            const accountType = params?.accountType || 'real';
            const userId = params?.userId;
            
            console.log(`Client ${socket.id} requesting ${accountType} initial data. Asset: ${requestedAsset} User: ${userId}`);
            
            if (requestedAsset) {
                activeViewedPairs.add(requestedAsset);
            }
            
            // Join the appropriate rooms
            socket.leave('real');
            socket.leave('demo');
            socket.join(accountType);
            if (userId) {
                socket.join(`user_${userId}`);
            }

            const markets_pool = accountType === 'real' ? markets_real : markets_demo;
            const history_pool = accountType === 'real' ? history_real : history_demo;
            const currentCandles_pool = accountType === 'real' ? currentCandles_real : currentCandles_demo;

            const limitedHistory: Record<string, any[]> = {};
            
            // Build sparkline data (50 candles instead of 300 to save bandwidth) for ALL assets
            if (!params.isSwitch) {
                for (const pair in history_pool) {
                    limitedHistory[pair] = history_pool[pair] ? history_pool[pair].slice(-50) : [];
                }
            }
            
            // Override with full history for the requested asset
            if (requestedAsset && history_pool[requestedAsset]) {
                limitedHistory[requestedAsset] = history_pool[requestedAsset].slice(-150000);
            }
            
            let openTrades: any[] = [];
            if (userId && db && !dbReadAccessDenied && !dbQuotaExceeded) {
                try {
                    const snap = await db.collection('trades')
                        .where('userId', '==', userId)
                        .where('status', '==', 'open')
                        .get();
                    openTrades = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
                } catch (e) {
                    console.warn(`Failed to fetch open trades for client ${socket.id}`);
                }
            }

            const payload = {
                history: limitedHistory,
                markets: markets_pool,
                systemActive,
                activities,
                currentCandles: currentCandles_pool,
                openTrades
            };
            
            socket.emit('initial_market_data', payload);
        } catch (error) {
            console.error('Error emitting initial market data:', error);
        }
      });
  });

  app.get('/api/market/history/:pair', async (req, res) => {
      await ensureMarketInitialized();
      const pair = req.params.pair;
      const accountType = (req.query.accountType as string) === 'demo' ? 'demo' : 'real';
      const history_pool = accountType === 'real' ? history_real : history_demo;
      const currentCandles_pool = accountType === 'real' ? currentCandles_real : currentCandles_demo;

      if (history_pool[pair]) {
          res.json({ success: true, history: history_pool[pair], currentCandle: currentCandles_pool[pair] });
      } else {
          res.status(404).json({ error: 'Pair not found' });
      }
  });

  // ========== LOOP ==========
  // Market loop
  const lastFetch: Record<string, number> = {};

  setInterval(async () => {
     try {
         if (!systemActive) return;
         await fetchAllRealPrices();
     } catch (err) {
         console.error("Error in real prices fetch interval:", err);
     }
  }, 5000); // Fetch all prices every 5 seconds

  setInterval(async () => {
    try {
        if (!systemActive) return;
        const now = Math.floor(Date.now() / 1000);
        const BASE_TICK_SECONDS = 5; 
        const candleStart = now - (now % BASE_TICK_SECONDS);

        const processTickForStream = (type: 'real' | 'demo', markets_pool: Record<string, Market>, history_pool: Record<string, any[]>, currentCandles_pool: Record<string, any>, momentums_pool: Record<string, number>) => {
            const ticks: Record<string, {price: number, time: number, candle: any}> = {};
            
            for (const [pair, data] of Object.entries(markets_pool)) {
                if (!data.active) continue;
                if (!currentCandles_pool[pair] || currentCandles_pool[pair].time === undefined) continue;

                if (momentums_pool[pair] === undefined) momentums_pool[pair] = 0;

                if (candleStart > currentCandles_pool[pair].time) {
                    const completedCandle = { ...currentCandles_pool[pair] };
                    // Complete previous candle with exact current price just in case
                    completedCandle.close = data.price;
                    completedCandle.high = Math.max(completedCandle.high, data.price);
                    completedCandle.low = Math.min(completedCandle.low, data.price);

                    history_pool[pair].push(completedCandle);
                    if (history_pool[pair].length > HISTORY_SIZE) history_pool[pair].shift();
                    
                    io.to(type).emit('candle_complete', { pair, candle: completedCandle });

                    // Mark pair as modified (dirty) to trigger background collection persistence
                    if (type === 'real') {
                        dirtyPairs.add(pair);
                    }

                    // Ensure smooth transition between candles without artificial gaps
                    let newOpen = completedCandle.close;

                    currentCandles_pool[pair] = {
                        time: candleStart,
                        open: newOpen,
                        high: newOpen,
                        low: newOpen,
                        close: newOpen,
                        volume: Math.random() * 200
                    };
                }
                
                if (data.isFrozen) {
                    ticks[pair] = { price: data.price, time: now, candle: currentCandles_pool[pair] };
                    momentums_pool[pair] = 0;
                    continue;
                }

                // Core Organic Random Walk (Geometric Brownian Motion style)
                // Inject randomness mostly into momentum to create smooth curving trends, but importantly, KEEP immediate noise high enough to create realistic WICKS!
                let noise = (Math.random() - 0.5) * (data.volatility * 0.06); 
                let momentumNoise = (Math.random() - 0.5) * (data.volatility * 0.02);
                
                // Occasional sudden volatility spikes (wicks/jumps)
                if (Math.random() < 0.08) {
                    noise += (Math.random() - 0.5) * (data.volatility * 0.12);
                }
                if (Math.random() < 0.05) {
                    momentumNoise += (Math.random() - 0.5) * (data.volatility * 0.05);
                }

                let bias = 0;
                
                let diff = 0;
                if (data.targetPrice !== null) {
                    const gap = data.targetPrice - data.price;
                    diff = gap * 0.012; // Far smoother integration to prevent huge spikes toward real external price
                    data.price += diff;
                    momentums_pool[pair] *= 0.6;
                    if (Math.abs(gap) < (data.volatility * 0.15)) data.targetPrice = null;
                } else {
                    if (data.trend === 'up') bias += data.volatility * 0.0006;
                    if (data.trend === 'down') bias -= data.volatility * 0.0006;

                    // Decay public pressure over time gently so states never get permanently stuck
                    if (data.totalUp > 0) data.totalUp = Math.max(0, data.totalUp * 0.992);
                    if (data.totalDown > 0) data.totalDown = Math.max(0, data.totalDown * 0.992);

                    const effectiveMode = globalManipulationMode !== 'neutral' ? globalManipulationMode : (data.manipulation?.mode || 'percentage');
                    if (data.manipulation?.enabled || globalManipulationMode !== 'neutral') {
                        const totalUp = data.totalUp || 0;
                        const totalDown = data.totalDown || 0;
                        
                        if (effectiveMode === 'always_loss') {
                            if (totalUp > totalDown) bias -= data.volatility * 0.0015;
                            else if (totalDown > totalUp) bias += data.volatility * 0.0015;
                        } else if (effectiveMode === 'always_win') {
                            if (totalUp > totalDown) bias += data.volatility * 0.0015;
                            else if (totalDown > totalUp) bias -= data.volatility * 0.0015;
                        } else if (effectiveMode === 'smart_house') {
                            const houseEdge = (data.houseEdge || 10) / 100;
                            const totalVolume = totalUp + totalDown;
                            if (totalVolume > 0) {
                                if (totalUp > totalDown) bias -= data.volatility * 0.001;
                                else if (totalDown > totalUp) bias += data.volatility * 0.001;
                            }
                        } else if (data.manipulation?.enabled) {
                            const sens = (data.manipulation.profitPercentage / 100) * data.volatility * 0.0012;
                            if (data.manipulation.targetTrend === 'up') bias += sens;
                            else if (data.manipulation.targetTrend === 'down') bias -= sens;
                        }
                    }

                    // Calculate final movement: A blend of momentum, trend bias, and dominant random noise
                    // Persistence 0.93 (slow decay for more trending glide)
                    momentums_pool[pair] = (momentums_pool[pair] * 0.93) + bias + momentumNoise;
                    diff = momentums_pool[pair] + noise;
                    data.price += diff;
                }

                data.lastChange = diff;
                currentCandles_pool[pair].close = data.price;
                currentCandles_pool[pair].high = Math.max(currentCandles_pool[pair].high, data.price);
                currentCandles_pool[pair].low = Math.min(currentCandles_pool[pair].low, data.price);
                currentCandles_pool[pair].volume = (currentCandles_pool[pair].volume || 0) + (Math.random() * 100);

                ticks[pair] = { price: data.price, time: now, candle: currentCandles_pool[pair] };
            }
            
            if (Object.keys(ticks).length > 0) {
                io.to(type).emit('market_ticks', ticks);
            }
        };

        processTickForStream('real', markets_real, history_real, currentCandles_real, momentums_real);
        processTickForStream('demo', markets_demo, history_demo, currentCandles_demo, momentums_demo);

    } catch (err) {
        console.error("Error in market ticks/candles loop:", err);
    }
  }, 250); // Faster ticks for smoother chart movement

  // ========== VITE MIDDLEWARE ==========
  try {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: { server: httpServer } },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      if (existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
    }
    
    // START LISTENING
    console.log(`Searching for port ${PORT}...`);
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Dedicated Trading Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Critical error starting server:", error);
    process.exit(1);
  }
}

startServer().catch(err => {
  console.error("Unhandled error in startServer:", err);
});
