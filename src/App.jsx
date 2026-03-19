// src/App.jsx
import React, {
  useEffect, useRef, useState,
  createContext, useContext, useCallback,
} from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Lenis from 'lenis';
import {
  motion, AnimatePresence,
  useScroll, useTransform,
  useSpring, useMotionValue
} from 'framer-motion';
import {
  Menu, X, ChevronRight, Sun, Moon,
  ArrowRight, CheckCircle2, Zap,
  Shield, BarChart3, Microscope, FlaskConical, Activity,
} from 'lucide-react';
import { ThemeProvider, useTheme } from './ThemeContext';

import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import BenchmarksPage from './Benchmarks';
import PricingSection from './PricingSection';
import BillingPage from './BillingPage';
import { ToastProvider, useToast } from './ToastContext';
import { initCursorTrail } from './useCursorTrail';
import { AuthProvider, useAuth } from './hooks/use-auth';
import {
  AnimCanvas,
  AggregationCanvas,
  ToxicityHexCanvas,
  CytotoxicityCanvas,
  RiskRadarCanvas,
  DataHelixCanvas,
  ReportMatrixCanvas,
  ValidationMeshCanvas,
  NanoInputCanvas,
  ExpertValidationCanvas,
} from './ScrollAnimations';

// ─── TRIAL PROTECTION ──────────────────────────────────────────────────────────
const TrialProtection = ({ children }) => {
  const { user, isExpired, hasAccess, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // Public routes
  const isPublic = ['/', '/login', '/signup', '/forgot-password', '/benchmarks'].includes(location.pathname);
  if (isPublic) return children;

  if (isExpired && !hasAccess && location.pathname !== '/settings/billing') {
    return (
      <div className="relative min-h-screen">
        <div className="opacity-40 pointer-events-none select-none">
          {children}
        </div>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full p-8 rounded-3xl border border-blue-500/30 bg-[#0A0F1D] shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap size={32} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-black mb-3 font-display uppercase tracking-tight">Access Period Ended</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">Your free trial access has expired. Please subscribe to a plan to continue using the Nanotoxi dashboard and tools.</p>
            <Link to="/settings/billing" 
              className="block w-full py-4 rounded-2xl bg-blue-500 text-black font-bold uppercase tracking-widest text-sm hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20"
            >
              View Pricing Plans
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return children;
};

// ─── PREMIUM EASINGS ──────────────────────────────────────────────────────────
const SPRING      = { type: 'spring', stiffness: 90,  damping: 20 };
const SPRING_FAST = { type: 'spring', stiffness: 130, damping: 22 };
const EASE_EXPO   = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE_EXPO } },
};

// ADDED: delayChildren: 1.7 (Waits for the Preloader to finish before animating Hero)
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.11 } }, 
};

// 1. ADD THIS GLOBAL VARIABLE (It resets to false on every hard reload!)
let globalAppLoaded = false;

// ─── CINEMATIC PRELOADER ──────────────────────────────────────────────────────
const Preloader = () => {
  const [count, setCount] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let c = 0;
    const interval = setInterval(() => {
      c += Math.floor(Math.random() * 12) + 2;
      if (c >= 100) {
        c = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsDone(true);
          // 2. Set the memory flag to true once it finishes
          globalAppLoaded = true; 
        }, 400); 
      }
      setCount(c);
    }, 35);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          initial={{ y: 0 }} exit={{ y: '-100%' }} transition={{ duration: 0.9, ease: EASE_EXPO }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
          style={{ background: 'var(--bg)' }}
        >
          <div className="overflow-hidden">
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: EASE_EXPO }}
              className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--accent)' }}>
              Initializing ML Pipeline
            </motion.div>
          </div>
          <div className="font-black" style={{ fontSize: 'clamp(4rem, 10vw, 8rem)', color: 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
            {count}%
          </div>
          <div className="w-48 md:w-64 h-1 rounded-full mt-8 overflow-hidden" style={{ background: 'var(--surface2)' }}>
            <motion.div 
              className="h-full" style={{ background: 'var(--accent)' }}
              initial={{ width: 0 }} animate={{ width: `${count}%` }} transition={{ ease: "linear", duration: 0.1 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── CONDITIONAL PRELOADER ────────────────────────────────────────────────────
const HomePreloader = () => {
  const location = useLocation();
  // 3. If they navigate back here and the memory flag is true, skip the preloader
  if (location.pathname !== '/' || globalAppLoaded) return null;
  return <Preloader />;
};

// ─── CURSOR TRAIL ─────────────────────────────────────────────────────────────
// BUG FIX #3: Placed at the Router level so it renders on EVERY page —
// Landing, Benchmarks, Login, Signup, ForgotPassword.
const CursorTrail = () => {
  useEffect(() => {
    const cleanup = initCursorTrail();
    return cleanup;
  }, []);
  return null;
};

// ─── LENIS SMOOTH SCROLL ──────────────────────────────────────────────────────
const SmoothScroll = () => {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08, // This is the magic number. It makes it snappy and light.
      wheelMultiplier: 1, // Standard scroll distance
      smoothWheel: true,
      touchMultiplier: 2,
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);
  return null;
};

// ─── MAGNETIC BUTTON ──────────────────────────────────────────────────────────
const MagneticButton = ({ children, className, style, href, to, onClick }) => {
  const ref = useRef(null);
  
  // Outer shell coordinates
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Inner text coordinates (moves less for parallax effect)
  const textX = useMotionValue(0);
  const textY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  const springTextX = useSpring(textX, springConfig);
  const springTextY = useSpring(textY, springConfig);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const center = { x: left + width / 2, y: top + height / 2 };
    
    // Pull the button towards the cursor
    x.set((clientX - center.x) * 0.2);
    y.set((clientY - center.y) * 0.2);
    
    // Pull the text slightly further to create 3D depth
    textX.set((clientX - center.x) * 0.1);
    textY.set((clientY - center.y) * 0.1);
  };

  const handleMouseLeave = () => {
    x.set(0); y.set(0);
    textX.set(0); textY.set(0);
  };

  const MotionLink = motion(Link);
  const content = (
    <motion.span style={{ x: springTextX, y: springTextY }} className="flex items-center gap-2 pointer-events-none">
      {children}
    </motion.span>
  );

  const commonProps = {
    ref, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave,
    style: { ...style, x: springX, y: springY },
    className: `group relative overflow-hidden flex items-center justify-center ${className}`,
    whileHover: { scale: 1.04 }, whileTap: { scale: 0.97 }, onClick
  };

  if (to) return <MotionLink to={to} {...commonProps}>{content}</MotionLink>;
  if (href) return <motion.a href={href} {...commonProps}>{content}</motion.a>;
  return <motion.button {...commonProps}>{content}</motion.button>;
};


// ─── MAGNETIC BUTTON ──────────────────────────────────────────────────────────
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
};

// ─── CONTENT DATA ─────────────────────────────────────────────────────────────
const HERO_VIDEO   = "https://cdn.prod.website-files.com/685df7190351aa65bc34fcae%2F68cb2e5dff9507e294ee6af6_scene%201_4-transcode.mp4";
const BENCH_VIDEO  = "https://cdn.prod.website-files.com/685df7190351aa65bc34fcae%2F68c9fed6308b7a7284b1295e_scene%202_2-transcode.mp4";
const FOOTER_VIDEO = "https://cdn.prod.website-files.com/685df7190351aa65bc34fcae%2F68c9ff5cddbc9cccbec808b0_scene%203_2-transcode.mp4";

const STEPS = [
  {
    id:'01', num:'Step 1', title:'Nanoparticle Input', sub:'Define your parameters.',
    desc:'Provide size, zeta potential, surface area, dosage, and exposure conditions for accurate modeling.',
    icon: FlaskConical, cta: { label:'Try Live Demo', href:'#demo' },
    anim: NanoInputCanvas,
  },
  {
    id:'02', num:'Step 2', title:'Aggregation Analysis', sub:'Model environmental behavior.',
    desc:'Predict hydrodynamic diameter and colloidal stability in biological environments.',
    icon: Activity, anim: AggregationCanvas,
  },
  {
    id:'03', num:'Step 3', title:'Toxicity Assessment', sub:'Primary safety screening.',
    desc:'Predict TOXIC/NON-TOXIC classification with confidence scores and uncertainty quantification.',
    icon: Shield, anim: ToxicityHexCanvas,
  },
  {
    id:'04', num:'Step 4', title:'Cytotoxicity Analysis', sub:'Cellular interaction modeling.',
    desc:'Analyze reactive oxygen species, apoptosis pathways, and membrane damage at cellular scale.',
    icon: Microscope, anim: CytotoxicityCanvas,
  },
  {
    id:'05', num:'Step 5', title:'Risk Factor Analysis', sub:'Understand the driving mechanisms.',
    desc:'Identify physicochemical factors driving toxicity for targeted mitigation.',
    icon: BarChart3, anim: RiskRadarCanvas,
  },
  {
    id:'06', num:'Step 6', title:'Comprehensive Report', sub:'Actionable safety insights.',
    desc:'Detailed report with toxicity predictions, confidence intervals, and recommendations.',
    icon: Zap, anim: ReportMatrixCanvas,
  },
  {
    id:'07', num:'Step 7', title:'Expert Validation', sub:'Human-in-the-loop verification.',
    desc:'Domain experts in nanotoxicology review and validate AI safety assessments.',
    icon: CheckCircle2, anim: ExpertValidationCanvas,
  },
];


const AI_CARDS = [
  { title:'3-Stage ML Pipeline', desc:'Aggregation, toxicity, and cytotoxicity models working in concert for full-spectrum assessment of nanoparticle danger.', icon: Zap, anim: ValidationMeshCanvas },
  { title:'95.2% Accuracy', desc:'Ensemble ML models trained on 14,791+ curated nanoparticle samples with rigorous cross-validation.', icon: BarChart3, anim: DataHelixCanvas },
  { title:'Real-Time Predictions', desc:'Full nanoparticle toxicity assessment delivered in under 0.15 seconds per query.', icon: Activity, anim: RiskRadarCanvas },
];

const STATS = [
  { value: '95.2%',   label: 'Prediction Accuracy' },
  { value: '14,791+', label: 'Training Samples' },
  { value: '<0.15s',  label: 'Prediction Speed' },
  { value: '64%',     label: 'Fewer False Positives' },
  { value: '3-Stage', label: 'ML Pipeline' },
  { value: '4 Models',label: 'Specialized Modules' },
];

const FAQS = [
  { q:"Who's building Nanotoxi?", a:"We are a team of researchers, AI engineers, and toxicologists dedicated to accelerating nanoparticle safety assessment through advanced machine learning models." },
  { q:"Can we integrate Nanotoxi?", a:"Yes. You can access our prediction pipeline via our API at https://web-production-6a673.up.railway.app, or reach out to contact@nanotoxi.com for enterprise integrations." },
  { q:"What is your business model?", a:"We provide API access for high-throughput screening and enterprise licensing for labs and institutions that need custom model fine-tuning for specific nanomaterials." },
  { q:"Where does data come from?", a:"Our models are trained on 14,791+ nanoparticle samples aggregated from peer-reviewed literature and experimental databases with rigorous curation." },
  { q:"Who validates predictions?", a:"Complex cases and framework updates are reviewed by domain experts in nanotechnology and computational toxicology." },
  { q:"Do you provide experimental validation?", a:"Our core platform focuses on rapid in-silico predictions. We partner with specialized laboratories when in-vitro or in-vivo validation is required." },
  { q:"What nanoparticles are supported?", a:"Our models handle metallic, metal-oxide, carbon-based, and polymeric nanoparticles across a broad range of sizes, coatings, and exposure conditions." },
];

// ─── BACKGROUND MOLECULE CANVAS ───────────────────────────────────────────────
const MoleculeCanvas = ({ particleCount = 55 }) => {
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    const isLight = theme === 'light';
    const mouse = { x: null, y: null };
    const particles = Array.from({ length: isLight ? particleCount + 20 : particleCount }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * (isLight ? 0.6 : 0.45), vy: (Math.random() - 0.5) * (isLight ? 0.6 : 0.45),
      size: Math.random() * 1.8 + (isLight ? 1.0 : 0.6),
    }));
    let rafId;
    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        if (mouse.x != null) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
          if (d < 180) { const f = (180 - d) / 180; p.x -= (dx / d) * f * 1.5; p.y -= (dy / d) * f * 1.5; }
        }
        ctx.fillStyle = isLight ? 'rgba(0,128,179,0.3)' : 'rgba(0,198,255,0.22)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j], d = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (d < 130) {
            const a = (1 - d / 130) * 0.5;
            ctx.strokeStyle = isLight ? `rgba(0,128,179,${a * 0.5})` : `rgba(0,198,255,${a * 0.44})`;
            ctx.lineWidth = isLight ? 1.0 : 0.7;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          }
        }
      });
      rafId = requestAnimationFrame(animate);
    };
    animate();
    const onResize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    const onMove  = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = () => { mouse.x = null; mouse.y = null; };
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [theme, particleCount]);
  return (
    <canvas ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none z-0 canvas-bg ${theme === 'light' ? 'opacity-80' : 'opacity-40'}`} />
  );
};

// ─── THEME TOGGLE ─────────────────────────────────────────────────────────────
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="theme-pill" aria-label="Toggle theme">
      {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
};

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
const NAV_LINKS = ['Home', 'Benchmarks', 'Subscription', 'FAQ', 'Contact'];

const Navbar = () => {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const href = item => {
    const map = { 'Benchmarks': '/benchmarks', 'Home': '/' };
    return map[item] || `#${item.toLowerCase().replace(/\s/g, '')}`;
  };

  const renderLink = item =>
    item === 'Benchmarks' ? (
      <Link key={item} to="/benchmarks" className="relative nav-link group" style={{ color: 'var(--text-muted)' }}>
        {item}
        <span className="absolute -bottom-0.5 left-0 w-0 h-px transition-all duration-300 group-hover:w-full"
          style={{ background: 'var(--accent)' }} />
      </Link>
    ) : item === 'Home' ? (
      <a key={item} href="/" className="relative nav-link group" style={{ color: 'var(--text-muted)' }}>
        {item}
        <span className="absolute -bottom-0.5 left-0 w-0 h-px transition-all duration-300 group-hover:w-full"
          style={{ background: 'var(--accent)' }} />
      </a>
    ) : (
      <a key={item} href={href(item)} className="relative nav-link group" style={{ color: 'var(--text-muted)' }}>
        {item}
        <span className="absolute -bottom-0.5 left-0 w-0 h-px transition-all duration-300 group-hover:w-full"
          style={{ background: 'var(--accent)' }} />
      </a>
    );

  return (
    <header className="fixed top-0 w-full z-50 transition-all duration-300"
      style={{
        background:    scrolled ? 'var(--surface-nav)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom:  scrolled ? '1px solid var(--border)' : '1px solid transparent',
      }}>
      <div className="container mx-auto px-6 h-[72px] flex justify-between items-center">
        <a href="/" className="flex items-center group">
          <img src="/nanologo.png" alt="NanoToxi AI"
            className="h-8 md:h-10 rounded transition-transform duration-300 group-hover:scale-105"
            style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'normal' }} />
        </a>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {NAV_LINKS.map(renderLink)}
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/settings/billing" className="nav-link text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                Billing
              </Link>
              <button 
                onClick={logout}
                className="px-5 py-2 rounded-full font-semibold text-sm transition-all hover:bg-red-500 hover:text-white border border-red-500/30"
                style={{ background: 'transparent', color: 'var(--text)' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login"
              className="px-5 py-2 rounded-full font-semibold text-sm transition-all hover:scale-105"
              style={{ background: 'var(--accent)', color: '#000', boxShadow: '0 0 20px rgba(0,198,255,0.28)' }}>
              Login →
            </Link>
          )}
        </nav>
        <div className="md:hidden flex items-center gap-3">
          <ThemeToggle />
          <button onClick={() => setOpen(!open)} style={{ color: 'var(--text)' }}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
            className="md:hidden overflow-hidden border-b"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
            <nav className="flex flex-col p-6 gap-4 text-sm">
              {NAV_LINKS.map(item =>
                item === 'Benchmarks' ? (
                  <Link key={item} to="/benchmarks" onClick={() => setOpen(false)}
                    className="nav-link py-1" style={{ color: 'var(--text-muted)' }}>{item}</Link>
                ) : item === 'Home' ? (
                  <a key={item} href="/" onClick={() => setOpen(false)}
                    className="nav-link py-1" style={{ color: 'var(--text-muted)' }}>{item}</a>
                ) : (
                  <a key={item} href={href(item)} onClick={() => setOpen(false)}
                    className="nav-link py-1" style={{ color: 'var(--text-muted)' }}>{item}</a>
                )
              )}
              {user ? (
                <>
                  <Link to="/settings/billing" onClick={() => setOpen(false)}
                    className="nav-link py-1" style={{ color: 'var(--text-muted)' }}>Billing</Link>
                  <button onClick={() => { logout(); setOpen(false); }}
                    className="text-center py-3 rounded-xl font-semibold mt-2 border border-red-500/30 text-red-400">
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)}
                  className="text-center py-3 rounded-xl font-semibold mt-2"
                  style={{ background: 'var(--accent)', color: '#000' }}>Login →</Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

// ─── HERO ─────────────────────────────────────────────────────────────────────
const Hero = () => {
  const { scrollY } = useScroll();
  const videoY = useTransform(scrollY, [0, 600], [0, 140]);
  const orb1Y  = useTransform(scrollY, [0, 600], [0, 60]);
  const orb2Y  = useTransform(scrollY, [0, 600], [0, 90]);

  // SMART DELAY: Check the memory flag. If false (reload), wait 2.4s. If true (internal navigation), animate instantly!
  const heroStagger = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.11, delayChildren: !globalAppLoaded ? 1.5 : 0.1 } },
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center overflow-hidden pt-24 pb-20">
      {/* Parallax video */}
      <motion.div style={{ y: videoY }}
        className="absolute inset-0 z-0 pointer-events-none scale-110">
        <div className="absolute inset-0 video-overlay z-10" />
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-55">
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
      </motion.div>

      {/* Blue grid texture */}
      <div className="absolute inset-0 z-1 pointer-events-none grid-overlay" />

      {/* Glow orbs */}
      <motion.div style={{ y: orb1Y }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none z-1"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}>
        <div className="w-full h-full rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,198,255,0.11) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </motion.div>
      <motion.div style={{ y: orb2Y }}
        className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] rounded-full pointer-events-none z-1">
        <div className="w-full h-full rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </motion.div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 max-w-5xl">
        
        {/* CHANGED: Now using heroStagger instead of stagger */}
        <motion.div variants={heroStagger} initial="hidden" animate="visible">
          
          <motion.div variants={fadeUp} className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase"
              style={{ border: '1px solid rgba(0,198,255,0.3)', color: 'var(--accent)', background: 'rgba(0,198,255,0.07)', backdropFilter: 'blur(12px)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
              AI-Powered Safety Assessment
            </span>
          </motion.div>

          {/* THE NEW WORD REVEAL HEADING */}
          <div className="flex flex-wrap justify-center gap-x-[0.25em] mb-6 max-w-5xl mx-auto" 
               style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', lineHeight: 1.01 }}>
            {['Predict', 'Nanoparticle', 'Toxicity', 'with', 'AI'].map((word, i) => {
              const isAccent = word === 'Toxicity';
              return (
                <div key={i} className="overflow-hidden pb-2 -mb-2">
                  <motion.div
                    variants={{
                      hidden:  { y: '120%', rotateZ: 5, opacity: 0 },
                      visible: { y: 0, rotateZ: 0, opacity: 1, transition: { duration: 0.9, ease: EASE_EXPO } }
                    }}
                    className={`font-bold ${isAccent ? 'gradient-text' : ''}`}
                    style={{ color: isAccent ? 'transparent' : 'var(--text)' }}
                  >
                    {word}
                  </motion.div>
                </div>
              );
            })}
          </div>

          <motion.p variants={fadeUp}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-12"
            style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Predict nanoparticle toxicity, aggregation, and cytotoxicity in{' '}
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>under 0.15 seconds</span>.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            
            <MagneticButton href="#demo"
              className="px-8 py-4 rounded-2xl font-bold text-base"
              style={{ background: 'var(--accent)', color: '#000', boxShadow: '0 0 50px rgba(0,198,255,0.35), 0 0 0 1px rgba(0,198,255,0.4)' }}>
              Try Live Demo
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </MagneticButton>

            <MagneticButton to="/signup"
              className="px-8 py-4 rounded-2xl font-bold text-base"
              style={{ color: 'var(--text)', background: 'rgba(0,198,255,0.05)', backdropFilter: 'blur(12px)', boxShadow: '0 0 0 1px rgba(0,198,255,0.14) inset' }}>
              Sign Up
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-muted)' }} />
            </MagneticButton>

          </motion.div>
        </motion.div>
      </div>


    </section>
  );
};

// ─── STATS TICKER ─────────────────────────────────────────────────────────────
const StatsTicker = () => {
  const tripled = [...STATS, ...STATS, ...STATS];
  return (
    <div className="relative overflow-hidden border-y" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <motion.div className="flex whitespace-nowrap py-5"
        animate={{ x: ['0%', '-33.33%'] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
        style={{ width: 'max-content' }}>
        {tripled.map((stat, i) => (
          <div key={i} className="inline-flex items-center flex-shrink-0 px-10">
            <span className="text-xl font-bold mr-3" style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>{stat.value}</span>
            <span className="text-sm mr-10" style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(0,198,255,0.35)' }} />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// ─── STEPS SECTION ────────────────────────────────────────────────────────────
// BUG FIX #1: `items-start` removed. Right column now uses
//   `h-screen flex flex-col justify-center` so canvas stays vertically
//   centred while the left column scrolls freely past it.
//
// FEATURE: Scroll-driven opacity — inactive steps fade to opacity 0.16
//   and scale down slightly via Framer Motion.

const StepItem = ({ step, visibleId, onVisible }) => {
  const ref  = useRef(null);
  const Icon = step.icon;
  const isActive = step.id === visibleId;

  useEffect(() => {
    if (!ref.current) return;
    
    const obs = new IntersectionObserver(
      entries => { 
        if (entries[0].isIntersecting) onVisible(step.id); 
      },
      { 
        // 1. Require 40% of the text block to be visible before triggering
        threshold: 0.4, 
        // 2. Push the bottom trigger boundary up to the exact middle of the screen
        rootMargin: '-20% 0px -50% 0px' 
      }
    );
    
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [step.id, onVisible]);

  return (
    <motion.div
      ref={ref}
      animate={{
        opacity: isActive ? 1    : 0.16,
        scale:   isActive ? 1    : 0.975,
        y:       isActive ? 0    : 4,
      }}
      transition={{ duration: 0.55, ease: EASE_EXPO }}
      className="relative pl-10 md:pl-16"
    >
      {/* Timeline dot — glows on active */}
      <motion.div
        className="absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full border-2"
        animate={{
          boxShadow: isActive
            ? '0 0 0 4px rgba(0,198,255,0.18), 0 0 22px rgba(0,198,255,0.75)'
            : '0 0 0 0px rgba(0,198,255,0)',
          background: isActive ? 'var(--accent)' : 'rgba(0,198,255,0.3)',
        }}
        transition={{ duration: 0.4, ease: EASE_EXPO }}
        style={{ borderColor: 'var(--bg)' }}
      />

      {/* Icon + label */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{
            background:  isActive ? 'rgba(0,198,255,0.12)' : 'rgba(0,198,255,0.04)',
            boxShadow:   isActive ? '0 0 0 1px rgba(0,198,255,0.22) inset' : 'none',
            transition:  'all 0.4s ease',
          }}>
          {Icon && <Icon size={18} style={{ color: 'var(--accent)' }} />}
        </div>
        <span className="text-xs font-mono tracking-widest" style={{ color: 'var(--accent)' }}>{step.num}</span>
      </div>

      <h3 className="font-bold mb-2"
        style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
        {step.title}
      </h3>
      <h4 className="text-base md:text-lg mb-4 font-medium" style={{ color: 'var(--text-muted)' }}>{step.sub}</h4>
      <p className="leading-relaxed mb-6 max-w-md" style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.75 }}>{step.desc}</p>

      {/* Mobile: canvas inline */}
      {step.anim && (
        <div className="md:hidden mb-6">
          <AnimCanvas><step.anim /></AnimCanvas>
        </div>
      )}

      {step.cta && (
        <motion.a href={step.cta.href}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={SPRING_FAST}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold group"
          style={{ background: 'var(--accent)', color: '#000', boxShadow: '0 0 28px rgba(0,198,255,0.28)' }}>
          {step.cta.label}
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </motion.a>
      )}
    </motion.div>
  );
};

const StepsSection = () => {
  const animSteps = STEPS.filter(s => s.anim);

  const [visibleId, setVisibleId] = useState(STEPS[0].id);
  const [canvasId,  setCanvasId]  = useState(animSteps[0]?.id || '02');

  const handleVisible = useCallback(id => {
    setVisibleId(id);
    const step = STEPS.find(s => s.id === id);
    if (step?.anim) setCanvasId(id);
  }, []);

  const activeStep = STEPS.find(s => s.id === canvasId) || animSteps[0];
  const ActiveAnim = activeStep?.anim;

  return (
    // REMOVED 'overflow-hidden'. Replaced with 'overflow-x-clip' to prevent horizontal scroll issues without breaking sticky.
    <section id="overview" className="py-32 relative overflow-x-clip">
      {/* Background texture */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.18 }}>
        <img src="https://cdn.prod.website-files.com/685df7190351aa65bc34fcae/685eb7af25346a585089c966_hiw%20bg.avif"
          alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, var(--bg) 0%, transparent 18%, transparent 82%, var(--bg) 100%)' }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-24">
          <span className="section-eyebrow block mb-5">Overview</span>
          <h2 className="heading-display mb-5">How Nanotoxi Works</h2>
          <p className="text-lg max-w-xl" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
            A comprehensive 3-stage ML pipeline that predicts nanoparticle toxicity,
            aggregation, and cytotoxicity in seconds.
          </p>
        </motion.div>

        {/* The Grid: Left side scrolls, Right side sticks */}
        <div className="md:grid md:grid-cols-2 md:gap-20">

          {/* LEFT: scrollable step list */}
          {/* Increased bottom padding so you can scroll past the last item smoothly */}
          <div className="relative step-line ml-4 md:ml-8 space-y-32 pb-[50vh]">
            {STEPS.map(step => (
              <StepItem key={step.id} step={step} visibleId={visibleId} onVisible={handleVisible} />
            ))}
          </div>

          {/* RIGHT: sticky canvas panel */}
          <div className="hidden md:block relative">
            {/* The sticky container takes the full height of the screen and centers its content */}
            <div className="sticky top-0 h-screen flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {ActiveAnim && (
                  <motion.div
                    key={canvasId}
                    initial={{ opacity: 0, scale: 0.94, y: 24 }}
                    animate={{ opacity: 1, scale: 1,    y: 0  }}
                    exit={{    opacity: 0, scale: 0.96, y: -16 }}
                    transition={SPRING}
                    className="w-full"
                  >
                    {/* Borderless glassmorphic canvas card for maximum originality */}
                    <div className="relative overflow-hidden rounded-3xl aspect-square lg:aspect-[4/3]"
                      style={{
                        background: 'radial-gradient(circle at center, rgba(8,14,28,0.4) 0%, rgba(4,8,16,0.95) 100%)',
                        boxShadow: '0 60px 120px rgba(0,0,0,0.8), 0 0 80px rgba(0,198,255,0.03)',
                      }}>
                      <div className="absolute inset-0"><ActiveAnim /></div>
                      
                      {/* Minimalist Label overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-8"
                        style={{ background: 'linear-gradient(to top, rgba(4,8,16,0.9) 0%, transparent 100%)' }}>
                        <div>
                          <p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                            {STEPS.find(s => s.id === canvasId)?.num}
                          </p>
                          <p className="text-xl font-medium" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                            {STEPS.find(s => s.id === canvasId)?.title}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Minimalist Progress pills */}
                    <div className="flex items-center justify-center gap-2 mt-8">
                      {animSteps.map(step => (
                        <motion.button
                          key={step.id}
                          onClick={() => { setVisibleId(step.id); setCanvasId(step.id); }}
                          animate={{
                            width:      step.id === canvasId ? 32 : 8,
                            opacity:    step.id === canvasId ? 1 : 0.3,
                            background: 'var(--accent)',
                          }}
                          transition={SPRING_FAST}
                          className="h-1.5 rounded-full"
                          style={{ minWidth: 8 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── BENCHMARKS (landing section) ─────────────────────────────────────────────
// ─── BENCHMARKS (landing section) ─────────────────────────────────────────────
// ─── BENCHMARKS (landing section) ─────────────────────────────────────────────
const Benchmarks = () => (
  <section id="nanotoxibench" className="py-32 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none z-0">
      <div className="absolute inset-0 video-overlay z-10" style={{ opacity: 0.96 }} />
      <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-22">
        <source src={BENCH_VIDEO} type="video/mp4" />
      </video>
    </div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] pointer-events-none"
      style={{ background: 'radial-gradient(ellipse, rgba(0,198,255,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />

    <div className="container mx-auto px-6 relative z-10">
      {/* Replaced 'grid md:grid-cols-2' with a flexible row to give the long text more room */}
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center mb-20">
        
        {/* LEFT SIDE (Text) - Taking up 55% of the space */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="w-full lg:w-[55%] shrink-0">
          <span className="section-eyebrow block mb-5">Benchmark</span>
          
          {/* APPLIED FIX: Swapped to heading-display class and removed conflicting inline font styles */}
          <h2 className="heading-display mb-6">
            <span style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>Explore</span><br />
            {/* whitespace-nowrap completely prevents the word from breaking into two lines */}
            <span className="whitespace-nowrap" style={{ fontSize: 'clamp(2rem, 4.2vw, 4.5rem)' }}>
              NanotoxiBench
            </span>
          </h2>
          
          <p className="text-lg mb-8 max-w-lg" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
            See how our ML pipeline performs against benchmark literature data across all prediction tasks.
          </p>
          
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={SPRING_FAST} style={{ display: 'inline-flex' }}>
            <Link to="/benchmarks"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold group"
              style={{ color: 'var(--accent)', background: 'rgba(0,198,255,0.07)', boxShadow: '0 0 0 1px rgba(0,198,255,0.2) inset' }}>
              View Benchmarks <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* RIGHT SIDE (Glass Card) - Taking up 45% of the space */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="w-full lg:w-[45%]">
          <div className="rounded-3xl p-8 md:p-10 text-center relative overflow-hidden"
            style={{
              background:     'rgba(0,198,255,0.04)',
              boxShadow:      '0 0 0 1px rgba(0,198,255,0.15) inset, 0 40px 100px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(24px)',
            }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.6), transparent)' }} />
            
            <motion.div className="font-black mb-2 relative z-10"
              style={{ fontSize: 'clamp(3.5rem, 6vw, 6rem)', color: 'var(--accent)', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}
              initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ ...SPRING, delay: 0.2 }}>
              95.2%
            </motion.div>
            <p className="text-xl font-semibold mb-1 relative z-10" style={{ color: 'var(--text)' }}>Prediction Accuracy</p>
            <p className="text-sm relative z-10" style={{ color: 'var(--text-muted)' }}>On held-out test set · 14,791+ samples</p>
          </div>
        </motion.div>
      </div>

      {/* Benchmark bars — borderless */}
      <div className="grid md:grid-cols-3 gap-5">
        {[
          { label: 'Toxicity Classification', nanotoxi: 95.2, baseline: 81.4 },
          { label: 'Aggregation Prediction',  nanotoxi: 91.8, baseline: 76.2 },
          { label: 'Cytotoxicity Mechanisms', nanotoxi: 88.6, baseline: 71.3 },
        ].map((bench, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible"
            viewport={{ once: true }} transition={{ delay: i * 0.1, ...SPRING }}
            className="rounded-2xl p-7"
            style={{ background: 'var(--surface)', boxShadow: '0 0 0 1px rgba(0,198,255,0.06) inset, 0 20px 60px rgba(0,0,0,0.4)' }}>
            <h3 className="text-sm font-semibold mb-6" style={{ color: 'var(--text)' }}>{bench.label}</h3>
            <div className="space-y-5">
              {[{ label: 'Nanotoxi', val: bench.nanotoxi, accent: true }, { label: 'Best Baseline', val: bench.baseline, accent: false }].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-2">
                    <span style={{ color: 'var(--text)' }}>{item.label}</span>
                    <span style={{ color: item.accent ? 'var(--accent)' : 'var(--text-muted)' }}>{item.val}%</span>
                  </div>
                  <div className="bench-bar h-1.5">
                    <motion.div className="h-full rounded-full"
                      style={{ background: item.accent ? 'var(--accent)' : 'rgba(0,198,255,0.15)' }}
                      initial={{ width: 0 }} whileInView={{ width: `${item.val}%` }}
                      viewport={{ once: true }} transition={{ duration: 1.4, ease: 'circOut', delay: 0.3 + i * 0.1 }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─── WHY AI — One cinematic hero card + two asymmetric cards ─────────────────
// The grid is deliberately broken: one card spans the entire width at 480px
// height with a live canvas as its background, then two smaller panels sit
// below in a 7/5 column split with a vertical offset to create depth.
const WhyAI = () => (
  <section id="ai" className="py-32 relative overflow-hidden">
    <div className="absolute right-0 top-0 w-2/3 h-full pointer-events-none"
      style={{ background: 'radial-gradient(ellipse at right center, rgba(37,99,235,0.06) 0%, transparent 70%)' }} />
    <div className="absolute top-0 left-0 right-0 h-px"
      style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(0,198,255,0.1) 50%, transparent 90%)' }} />

    <div className="container mx-auto px-6">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-20">
        <span className="section-eyebrow block mb-5">AI Architecture</span>
        <h2 className="heading-display">Why Our AI<br />is Different</h2>
        <p className="mt-5 text-lg max-w-xl" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Built purely for nanomaterials, not generalized data.
        </p>
      </motion.div>

      <div className="space-y-5">

        {/* ── FEATURE CARD: full-width cinematic ── */}
        {(() => {
          const card = AI_CARDS[0];
          const Anim = card.anim;
          return (
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              transition={SPRING}
              className="relative overflow-hidden rounded-3xl group cursor-default"
              style={{ minHeight: 480 }}
              whileHover={{ scale: 1.008, transition: SPRING_FAST }}>

              {/* Full-bleed canvas */}
              <div className="absolute inset-0 opacity-[0.38] group-hover:opacity-[0.52] transition-opacity duration-700">
                {Anim && <Anim />}
              </div>

              {/* Cinematic gradient */}
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(155deg, rgba(4,8,16,0.25) 0%, rgba(4,8,16,0.12) 30%, rgba(4,8,16,0.88) 72%, rgba(4,8,16,0.97) 100%)' }} />

              {/* Glass frame — shadow-only, no colour border */}
              <div className="absolute inset-0 rounded-3xl"
                style={{ boxShadow: '0 0 0 1px rgba(0,198,255,0.14) inset, 0 80px 160px rgba(0,0,0,0.75)' }} />

              {/* Top shimmer */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(0,198,255,0.55) 50%, transparent 95%)' }} />

              {/* Content — anchored bottom-left */}
              <div className="relative z-10 p-10 md:p-14 h-full flex flex-col justify-end" style={{ minHeight: 480 }}>
                <motion.div className="mb-6 self-start"
                  animate={{ y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase"
                    style={{ background: 'rgba(0,198,255,0.12)', boxShadow: '0 0 0 1px rgba(0,198,255,0.28) inset', color: 'var(--accent)' }}>
                    <Zap size={12} />
                    {card.title}
                  </span>
                </motion.div>

                <p className="font-bold mb-10"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2.6rem)', color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-0.025em', lineHeight: 1.2, maxWidth: 580 }}>
                  {card.desc}
                </p>

                <div className="flex gap-10 flex-wrap">
                  {[['14,791+', 'Curated Samples']].map(([val, lbl]) => (
                    <div key={lbl}>
                      <p className="font-black" style={{ fontSize: 'clamp(2.4rem, 4vw, 3.5rem)', color: 'var(--accent)', fontFamily: 'var(--font-display)', lineHeight: 1, textShadow: '0 0 40px rgba(0,198,255,0.5)' }}>{val}</p>
                      <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>{lbl}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* ── TWO SMALLER ASYMMETRIC CARDS ── */}
        <div className="grid grid-cols-12 gap-5 items-start">
          {AI_CARDS.slice(1).map((card, i) => {
            const Icon = card.icon;
            const Anim = card.anim;
            const colSpan = i === 0 ? 'col-span-12 md:col-span-7' : 'col-span-12 md:col-span-5';
            const mtPx = i === 0 ? 0 : 28;
            return (
              <motion.div key={i}
                variants={fadeUp} initial="hidden" whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.12, ...SPRING }}
                style={{ marginTop: mtPx }}
                className={`${colSpan} relative overflow-hidden rounded-3xl group cursor-default`}
                whileHover={{ y: -6, transition: SPRING_FAST }}>

                {/* Glass base */}
                <div className="absolute inset-0 glass-panel" />

                {/* Canvas background */}
                {Anim && (
                  <div className="absolute inset-0 opacity-[0.2] group-hover:opacity-[0.36] transition-opacity duration-700">
                    <Anim />
                  </div>
                )}

                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(8,14,28,0.78) 0%, transparent 60%)' }} />

                <div className="absolute top-0 left-0 right-0 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                  style={{ background: 'linear-gradient(90deg, var(--accent), transparent)' }} />

                <div className="relative z-10 p-8 md:p-10 flex flex-col" style={{ minHeight: 240 }}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: 'rgba(0,198,255,0.1)', boxShadow: '0 0 0 1px rgba(0,198,255,0.2) inset' }}>
                    {Icon && <Icon size={20} style={{ color: 'var(--accent)' }} />}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 mt-auto"
                    style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                    {card.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{card.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ = () => {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <section id="faq" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.18 }}>
        <img src="https://cdn.prod.website-files.com/685df7190351aa65bc34fcae/685eb94a6fdc8149a3c49971_faq%20bg.avif"
          alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, var(--bg) 0%, transparent 25%, transparent 75%, var(--bg) 100%)' }} />
      </div>
      <div className="container mx-auto px-6 max-w-3xl relative z-10">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <span className="section-eyebrow block mb-5">FAQs</span>
          <h2 className="heading-display mb-16">Frequently<br />Asked Questions</h2>
        </motion.div>
        {FAQS.map((faq, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible"
            viewport={{ once: true }} transition={{ delay: i * 0.04 }}
            className="border-b" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex justify-between items-center text-left py-6 gap-4">
              <span className="text-base font-semibold leading-snug"
                style={{ color: openIdx === i ? 'var(--accent)' : 'var(--text)', transition: 'color 0.2s' }}>
                {faq.q}
              </span>
              <motion.div
                animate={{ rotate: openIdx === i ? 90 : 0 }}
                transition={{ duration: 0.25, ease: EASE_EXPO }}>
                <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </motion.div>
            </button>
            <AnimatePresence>
              {openIdx === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE_EXPO }}
                  className="overflow-hidden">
                  <p className="pb-6 leading-relaxed text-sm" style={{ color: 'var(--text-muted)' }}>{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

// ─── CONTACT ──────────────────────────────────────────────────────────────────
const Contact = () => {
  const { showToast } = useToast();
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = e => {
    e.preventDefault(); setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); showToast("Message sent! We'll be in touch shortly."); }, 1400);
  };
  const inputStyle = {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '14px 16px', color: 'var(--text)', fontSize: 14,
    outline: 'none', transition: 'border-color 0.2s',
  };
  return (
    <section id="contact" className="py-32 relative">
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(0,198,255,0.1) 50%, transparent 90%)' }} />
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 max-w-5xl mx-auto items-start">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <span className="section-eyebrow block mb-5">Contact</span>
            <h2 className="heading-display mb-6">Let's Talk</h2>
            <p className="text-lg mb-10" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Reach out for enterprise integration, API access, and collaborative research.
            </p>
            <div className="space-y-3">
              {[
                { label: 'Email', value: 'contact@nanotoxi.com' },
                { label: 'API',   value: 'web-production-6a673.up.railway.app' },
                { label: 'Demo',  value: 'calendly.com/nanotoxi/demo' },
              ].map(item => (
                <div key={item.label}
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: 'var(--surface)', boxShadow: '0 0 0 1px rgba(0,198,255,0.06) inset' }}>
                  <span className="text-xs font-bold uppercase tracking-wider w-12 flex-shrink-0" style={{ color: 'var(--accent)' }}>{item.label}</span>
                  <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {sent ? (
              <div className="flex flex-col items-center justify-center text-center py-16 gap-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING}
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,198,255,0.1)', boxShadow: '0 0 0 1px rgba(0,198,255,0.3) inset' }}>
                  <CheckCircle2 size={36} style={{ color: 'var(--accent)' }} />
                </motion.div>
                <h3 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Thank you!</h3>
                <p style={{ color: 'var(--text-muted)' }}>Your submission has been received.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text"  required placeholder="Name"    style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
                <input type="email" required placeholder="Email"   style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
                <textarea required placeholder="Message" rows={5}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 130 }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={SPRING_FAST}
                  className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center"
                  style={{ background: 'var(--accent)', color: '#000', boxShadow: '0 0 40px rgba(0,198,255,0.25)' }}>
                  {loading
                    ? <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : 'Send Message'}
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ─── LIVE DEMO WIDGET ─────────────────────────────────────────────────────────
const NANOPARTICLES = {
  "Metal Nanoparticles": ["Gold (Au)", "Silver (Ag)", "Platinum (Pt)", "Palladium (Pd)", "Iridium (Ir)", "Copper (Cu)", "Nickel (Ni)", "Molybdenum (Mo)", "Cadmium (Cd)", "Boron (B)", "Cobalt (Co)", "Zinc (Zn)", "Selenium (Se)", "Lead (Pb)", "Antimony (Sb)", "Gadolinium (Gd)"],
  "Metal Oxide Nanoparticles": ["Titanium Dioxide (TiO₂)", "Zinc Oxide (ZnO)", "Iron Oxide (Fe₂O₃ / Fe₃O₄)", "Copper Oxide (CuO / Cu₂O)", "Silica (SiO₂)", "Aluminum Oxide (Al₂O₃)", "Cerium Oxide (CeO₂)", "Lanthanum Oxide", "Nickel Oxide (NiO)", "Vanadium Oxide", "Tin Oxide", "Manganese Oxide", "Calcium Oxide", "Magnesium Oxide", "Indium Oxide", "Tungsten Oxide", "Zirconium Oxide", "Lead Oxide", "Antimony Oxide"],
  "Carbon-Based": ["Carbon Nanotubes (CNT)", "Multi-Walled CNT", "Single-Walled CNT", "Graphene / Graphene Oxide", "Carbon Dots", "Fullerenes (C60)", "Diamond nanoparticles", "Biochar", "Carbon (unspecified)"],
  "Polymeric / Organic": ["Polymeric nanoparticles (PLGA, PEG, etc.)", "Nanocapsules", "Nanospheres", "Dendrimers", "Hydrogels", "Cellulose nanoparticles", "Chitosan nanoparticles", "Organic nanocarriers"],
  "Lipid / Biological": ["Liposomes", "Solid Lipid Nanoparticles (SLN)", "Nanostructured Lipid Carriers (NLC)", "Vesicles / Exosomes", "Protein nanoparticles", "Biomolecule-based nanoparticles"],
  "Ceramic / Mineral": ["Hydroxyapatite", "Silica (SiO₂)", "Clay nanoparticles", "Barium sulfate", "Glass nanoparticles"],
  "Advanced / Emerging": ["MXenes", "Quantum dots", "Composite nanoparticles", "Core–Shell nanoparticles", "Surface-functionalized nanoparticles"],
};

const DEMO_DEFAULTS = { nanoparticleType: 'Gold (Au)', size: 50, zetaPotential: -25.4, surfaceArea: 120.3, dosage: 100, exposureTime: 24, coating: 'PEG' };
const COATINGS      = ['PEG', 'Citrate', 'CTAB', 'PVP', 'Bare', 'Silica', 'Amine', 'Carboxyl'];

const DemoWidget = () => {
  const [form, setForm]       = useState(DEMO_DEFAULTS);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePredict = async () => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch('https://web-production-6a673.up.railway.app/predict', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nanoparticle_type: form.nanoparticleType,
          size: Number(form.size), zeta_potential: Number(form.zetaPotential),
          surface_area: Number(form.surfaceArea), dosage: Number(form.dosage),
          exposure_time: Number(form.exposureTime), coating: form.coating,
        }),
      });
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      const toxic = form.size < 20 || form.zetaPotential > 10 || form.dosage > 200;
      setResult({
        prediction: toxic ? 'TOXIC' : 'NON-TOXIC',
        confidence: toxic ? (0.82 + Math.random() * 0.13).toFixed(3) : (0.87 + Math.random() * 0.11).toFixed(3),
        aggregation_risk: toxic ? 'HIGH' : 'LOW',
        cytotoxicity_score: toxic ? (0.65 + Math.random() * 0.3).toFixed(3) : (0.12 + Math.random() * 0.2).toFixed(3),
        top_risk_factors: toxic
          ? ['Small particle size (<20nm)', 'High positive charge', 'High dosage']
          : ['Stable PEG coating', 'Moderate size', 'Low surface charge'],
        _simulated: true,
      });
    }
    setLoading(false);
  };

  const inputS = {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 14,
    outline: 'none', transition: 'border-color 0.2s',
  };
  const isToxic = result?.prediction === 'TOXIC';

  return (
    <section id="demo" className="py-32 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(0,198,255,0.1) 50%, transparent 90%)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,198,255,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-16 text-center">
          <span className="section-eyebrow block mb-5">Live Demo</span>
          <h2 className="heading-display mb-5">Try It Right Now</h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Enter nanoparticle parameters and get a real toxicity prediction from our AI model in under a second.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-start">
          {/* Input panel */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="rounded-3xl p-8"
            style={{ background: 'var(--surface)', boxShadow: '0 0 0 1px rgba(0,198,255,0.07) inset, 0 30px 80px rgba(0,0,0,0.4)' }}>
            <h3 className="text-base font-bold mb-6" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Nanoparticle Parameters</h3>
            <div className="space-y-5">

              {/* Nanoparticle Type dropdown */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
                  Type of Nanoparticle
                </label>
                <div className="relative">
                  <select
                    value={form.nanoparticleType}
                    onChange={e => set('nanoparticleType', e.target.value)}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    style={{
                      ...inputS,
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      paddingRight: 36,
                      cursor: 'pointer',
                    }}
                  >
                    {Object.entries(NANOPARTICLES).map(([group, types]) => (
                      <optgroup key={group} label={group}>
                        {types.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {/* Custom chevron icon */}
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>

              {[
                { k: 'size',         label: 'Size (nm)',             min: 1,   max: 500, unit: 'nm'     },
                { k: 'zetaPotential',label: 'Zeta Potential (mV)',   min: -80, max: 80,  unit: 'mV'     },
                { k: 'dosage',       label: 'Dosage (μg/mL)',        min: 1,   max: 500, unit: 'μg/mL'  },
                { k: 'exposureTime', label: 'Exposure Time (h)',      min: 1,   max: 96,  unit: 'h'      },
              ].map(({ k, label, min, max, unit }) => (
                <div key={k}>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</label>
                    <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{form[k]} {unit}</span>
                  </div>
                  <input type="range" min={min} max={max} value={form[k]}
                    onChange={e => set(k, e.target.value)}
                    className="w-full" style={{ accentColor: 'var(--accent)' }} />
                </div>
              ))}

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>Surface Coating</label>
                <div className="flex flex-wrap gap-2">
                  {COATINGS.map(c => (
                    <motion.button key={c} onClick={() => set('coating', c)}
                      whileTap={{ scale: 0.93 }} transition={SPRING_FAST}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: form.coating === c ? 'var(--accent)' : 'var(--surface2)',
                        color:      form.coating === c ? '#000' : 'var(--text-muted)',
                        boxShadow:  form.coating === c ? '0 0 12px rgba(0,198,255,0.3)' : '0 0 0 1px rgba(0,198,255,0.08) inset',
                      }}>
                      {c}
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button onClick={handlePredict} disabled={loading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={SPRING_FAST}
                className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mt-2"
                style={{ background: 'var(--accent)', color: '#000', boxShadow: '0 0 40px rgba(0,198,255,0.28)', opacity: loading ? 0.8 : 1 }}>
                {loading ? (
                  <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>Predicting...</>
                ) : <><Zap size={16} />Run Prediction</>}
              </motion.button>
            </div>
          </motion.div>

          {/* Result panel */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <AnimatePresence mode="wait">
              {!result && !loading && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="rounded-3xl flex flex-col items-center justify-center p-12 text-center"
                  style={{
                    minHeight: 400,
                    background: 'var(--surface)',
                    boxShadow: '0 0 0 1px rgba(0,198,255,0.07) inset, 0 30px 80px rgba(0,0,0,0.4)',
                    border: '1px dashed rgba(0,198,255,0.15)',
                  }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(0,198,255,0.07)', boxShadow: '0 0 0 1px rgba(0,198,255,0.15) inset' }}>
                    <FlaskConical size={28} style={{ color: 'var(--accent)' }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Ready to Predict</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Adjust parameters and click <strong style={{ color: 'var(--accent)' }}>Run Prediction</strong>.
                  </p>
                </motion.div>
              )}
              {result && (
                <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={SPRING}
                  className="rounded-3xl overflow-hidden"
                  style={{
                    background: 'var(--surface)',
                    boxShadow: `0 0 0 1px ${isToxic ? 'rgba(239,68,68,0.25)' : 'rgba(0,198,255,0.25)'} inset, 0 30px 80px rgba(0,0,0,0.45)`,
                  }}>
                  <div className="px-8 py-6 flex items-center justify-between"
                    style={{ background: isToxic ? 'rgba(239,68,68,0.07)' : 'rgba(0,198,255,0.07)' }}>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider mb-1"
                        style={{ color: isToxic ? '#f87171' : 'var(--accent)' }}>Prediction Result</div>
                      <div className="text-3xl font-black"
                        style={{ color: isToxic ? '#ef4444' : 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                        {result.prediction}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Confidence</div>
                      <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                        {(Number(result.confidence) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Aggregation Risk',    value: result.aggregation_risk || (isToxic ? 'HIGH' : 'LOW') },
                        { label: 'Cytotoxicity Score',  value: Number(result.cytotoxicity_score || 0).toFixed(2) },
                      ].map(item => (
                        <div key={item.label} className="rounded-2xl p-4"
                          style={{ background: 'var(--surface2)', boxShadow: '0 0 0 1px rgba(0,198,255,0.05) inset' }}>
                          <div className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                          <div className="text-base font-bold" style={{ color: 'var(--text)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {result.top_risk_factors?.length > 0 && (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                          {isToxic ? 'Top Risk Factors' : 'Safety Indicators'}
                        </div>
                        <div className="space-y-2">
                          {result.top_risk_factors.map((f, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                style={{ background: isToxic ? '#ef4444' : 'var(--accent)' }} />
                              {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result._simulated && (
                      <p className="text-xs px-3 py-2 rounded-xl"
                        style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
                        ⚡ API offline — showing simulated prediction based on input heuristics.
                      </p>
                    )}
                    <div className="flex gap-3">
                      <motion.button onClick={() => alert("Generate PDF Report - functionality coming soon")}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={SPRING_FAST}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: 'var(--accent)', color: '#000', boxShadow: '0 0 15px rgba(0,198,255,0.2)' }}>
                        Generate PDF Report
                      </motion.button>
                      <motion.button onClick={() => setResult(null)}
                        whileHover={{ opacity: 0.7 }} whileTap={{ scale: 0.97 }} transition={SPRING_FAST}
                        className="flex-1 py-2.5 rounded-xl text-sm"
                        style={{ boxShadow: '0 0 0 1px var(--border) inset', color: 'var(--text-muted)' }}>
                        Reset
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ─── CTA ──────────────────────────────────────────────────────────────────────
const CTASection = () => (
  <section className="py-36 relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-px"
      style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(0,198,255,0.1) 50%, transparent 90%)' }} />
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 video-overlay z-10" />
      <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-32">
        <source src={FOOTER_VIDEO} type="video/mp4" />
      </video>
    </div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] pointer-events-none"
      style={{ background: 'radial-gradient(ellipse, rgba(0,198,255,0.1) 0%, transparent 70%)', filter: 'blur(30px)' }} />
    <div className="container mx-auto px-6 text-center relative z-10">
      <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <motion.div variants={fadeUp} className="flex justify-center mb-7">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase"
            style={{ border: '1px solid rgba(0,198,255,0.3)', color: 'var(--accent)', background: 'rgba(0,198,255,0.07)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
            Ready to start?
          </span>
        </motion.div>
        <motion.h2 variants={fadeUp}
          className="font-bold mb-7 mx-auto"
          style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)', color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', lineHeight: 1.06, maxWidth: 720 }}>
          Advancing Nanoparticle Safety Through AI
        </motion.h2>
        <motion.p variants={fadeUp} className="text-lg max-w-xl mx-auto mb-12" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Nanotoxi delivers instant, accurate toxicity predictions — empowering researchers and organizations to make safer, faster decisions.
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
          
          <MagneticButton href="https://calendly.com/nanotoxi/demo"
            className="px-10 py-4 rounded-2xl font-bold text-base"
            style={{ background: 'var(--accent)', color: '#000', boxShadow: '0 0 60px rgba(0,198,255,0.4)' }}>
            Schedule Demo <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </MagneticButton>

          <MagneticButton href="https://web-production-6a673.up.railway.app"
            className="px-10 py-4 rounded-2xl font-bold text-base"
            style={{ color: 'var(--text)', background: 'rgba(0,198,255,0.05)', boxShadow: '0 0 0 1px rgba(0,198,255,0.14) inset' }}>
            Try API Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-muted)' }} />
          </MagneticButton>

        </motion.div>
      </motion.div>
    </div>
  </section>
);

// ─── FOOTER ───────────────────────────────────────────────────────────────────
const Footer = () => {
  const { theme } = useTheme();
  return (
    <footer className="py-12 relative">
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(0,198,255,0.08) 50%, transparent 90%)' }} />
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <a href="/" className="flex items-center">
            <img src="/nanologo.png" alt="NanoToxi AI" className="h-8 rounded"
              style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'normal' }} />
          </a>
          <nav className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            {[['Home','/'],['Benchmarks','/benchmarks'],['AI','#ai'],['Subscription','#subscription'],['FAQ','#faq'],['Contact','#contact']].map(([label, to]) =>
              label === 'Benchmarks'
                ? <Link key={label} to={to} className="nav-link hover:opacity-80">{label}</Link>
                : <a key={label} href={to} className="nav-link hover:opacity-80">{label}</a>
            )}
          </nav>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>© 2025 Nanotoxi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
const LandingPage = () => (
  // CursorTrail is NO LONGER here — it lives at Router level in App()
  <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
    <MoleculeCanvas />
    <Navbar />
    <Hero />
    <StatsTicker />
    <StepsSection />
    <WhyAI />
    <PricingSection />
    <FAQ />
    <Contact />
    <DemoWidget />
    <CTASection />
    <Footer />
  </div>
);

// ─── APP ──────────────────────────────────────────────────────────────────────
// CursorTrail is placed INSIDE <Router> but OUTSIDE <Routes> so it mounts
// once for the entire app and persists across every route change.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "PASTE_YOUR_GOOGLE_CLIENT_ID_HERE";

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <HomePreloader />
              <div className="global-noise" /> 
              
              <SmoothScroll />
              <CursorTrail />
              <ScrollToTop />
              <TrialProtection>
                <Routes>
                  <Route path="/"                element={<LandingPage />} />
                  <Route path="/login"           element={<Login />} />
                  <Route path="/signup"          element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/pricing"         element={<Navigate to="/#subscription" replace />} />
                  <Route path="/benchmarks"      element={<BenchmarksPage />} />
                  <Route path="/settings/billing" element={<BillingPage />} />
                </Routes>
              </TrialProtection>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
