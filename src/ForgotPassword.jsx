// src/ForgotPassword.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { useToast } from './ToastContext';

const MoleculeCanvas = () => {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = window.innerWidth, h = window.innerHeight;
    canvas.width = w; canvas.height = h;
    const isLight = theme === 'light';

    const pts = Array.from({ length: 38 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.5,
    }));

    let rafId;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      pts.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.fillStyle = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        pts.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x, dy = p.y - p2.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            const a = (1 - d / 100) * 0.4;
            ctx.strokeStyle = isLight ? `rgba(0,0,0,${a * 0.25})` : `rgba(130,130,130,${a})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          }
        });
      });
      rafId = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { w = window.innerWidth; h = window.innerHeight; canvas.width = w; canvas.height = h; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize); };
  }, [theme]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0 canvas-bg" style={{ opacity: 0.3 }} />;
};

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [email, setEmail] = useState('');
  const { showToast } = useToast();
  const { theme } = useTheme(); // <-- ADDED THEME HERE

  const inputBase = {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '13px 16px',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsSent(true);
        showToast(data.message || `Reset link sent to ${email}`, 'success');
      } else {
        showToast(data.error || 'Failed to request reset link.', 'error');
      }
    } catch (err) {
      showToast('Connection to auth server failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg)' }}>
      <MoleculeCanvas />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'var(--glow-accent)', filter: 'blur(100px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'var(--glow-blue)', filter: 'blur(100px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="rounded-2xl border p-8 shadow-2xl relative overflow-hidden auth-card"
          style={{ background: 'var(--surface)', backdropFilter: 'blur(24px)', borderColor: 'var(--border)' }}>

          <Link to="/login"
            className="inline-flex items-center gap-2 text-sm mb-7 group transition-all hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>

          <AnimatePresence mode="wait">
            {!isSent ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 border"
                    style={{ background: 'rgba(0,255,157,0.08)', borderColor: 'rgba(0,255,157,0.2)', color: 'var(--accent)' }}>
                    <Mail size={22} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                    Forgot Password?
                  </h2>
                  <p className="text-sm px-4" style={{ color: 'var(--text-muted)' }}>
                    No worries, we'll send you reset instructions.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider ml-0.5" style={{ color: 'var(--text-muted)' }}>
                      Email
                    </label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="name@company.com" style={inputBase}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  </div>

                  <button type="submit" disabled={isLoading}
                    className="w-full py-3.5 rounded-lg font-bold text-sm transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ background: 'var(--text)', color: 'var(--bg)' }}>
                    {isLoading ? <Loader2 className="animate-spin" size={19} /> : 'Send Reset Link'}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="sent"
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 border"
                    style={{ background: 'rgba(0,255,157,0.12)', borderColor: 'rgba(0,255,157,0.3)', color: 'var(--accent)' }}>
                    <CheckCircle2 size={22} />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                    Check your email
                  </h2>
                  <p className="text-sm px-4" style={{ color: 'var(--text-muted)' }}>
                    We sent a password reset link to <span style={{ color: 'var(--text)' }}>{email}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => window.open('https://mail.google.com', '_blank')}
                    className="w-full py-3.5 rounded-lg font-bold text-sm transition-all hover:scale-[1.02] hover:shadow-xl flex items-center justify-center"
                    style={{ background: 'var(--text)', color: 'var(--bg)' }}>
                    Open Email App
                  </button>
                  <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    Didn't receive it?{' '}
                    <button onClick={() => setIsSent(false)} className="font-medium hover:opacity-80 transition-opacity" style={{ color: 'var(--accent)' }}>
                      Click to resend
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logo */}
                <div className="flex justify-center mb-8 relative z-10">
                  <Link to="/" className="flex items-center group">
                    <img 
                      src="/nanologo.png" 
                      alt="NanoToxi AI" 
                      className="h-10 md:h-12 transition-transform duration-300 group-hover:scale-105 rounded"
                      style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'normal' }} 
                    />
                  </Link>
                </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;