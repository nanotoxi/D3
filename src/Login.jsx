// src/Login.jsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { useToast } from './ToastContext';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from './hooks/use-auth';

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
    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-0.5)*0.45, vy: (Math.random()-0.5)*0.45,
      size: Math.random()*1.8+0.5,
    }));
    let rafId;
    const draw = () => {
      ctx.clearRect(0,0,w,h);
      pts.forEach((p,i) => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>w) p.vx*=-1;
        if(p.y<0||p.y>h) p.vy*=-1;
        ctx.fillStyle = isLight ? 'rgba(0,80,150,0.14)' : 'rgba(0,198,255,0.2)';
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
        pts.slice(i+1).forEach(p2 => {
          const dx=p.x-p2.x,dy=p.y-p2.y,dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<110){
            const a=(1-dist/110)*0.45;
            ctx.strokeStyle = isLight ? `rgba(0,80,150,${a*0.3})` : `rgba(0,198,255,${a*0.6})`;
            ctx.lineWidth=0.7;
            ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p2.x,p2.y); ctx.stroke();
          }
        });
      });
      rafId=requestAnimationFrame(draw);
    };
    draw();
    const onResize=()=>{w=window.innerWidth;h=window.innerHeight;canvas.width=w;canvas.height=h;};
    window.addEventListener('resize',onResize);
    return ()=>{cancelAnimationFrame(rafId);window.removeEventListener('resize',onResize);};
  },[theme]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0 canvas-bg" style={{opacity:0.35}} />;
};

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  
  const { showToast } = useToast();
  const { theme } = useTheme();
  const { checkAuth } = useAuth();
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

  // ─── Google Login ──────────────────────────────────────────────────────────
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setOauthLoading('google');
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: tokenResponse.access_token }),
        });
        const data = await res.json();
        if (res.ok) {
          showToast('Logged in successfully!', 'success');
          await checkAuth();
          navigate('/');
        } else {
          showToast(data.error || 'Google login failed.', 'error');
        }
      } catch (err) {
        showToast('Google login failed. Please try again.', 'error');
      } finally {
        setOauthLoading(null);
      }
    },
    onError: () => showToast('Google sign-in failed.', 'error'),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const emailVal = e.target.email.value;
    const passVal = e.target.password.value;
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: emailVal, password: passVal }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Logged in successfully!', 'success');
        await checkAuth();
        navigate('/');
      } else {
        showToast(data.error || 'Login failed.', 'error');
      }
    } catch (err) {
      showToast('Login failed. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Input style using CSS vars for full theme-compat
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

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      <MoleculeCanvas />

      {/* Glow orbs */}
      <div
        className="absolute top-[-15%] left-[-8%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'var(--glow-accent)', filter: 'blur(100px)' }}
      />
      <div
        className="absolute bottom-[-15%] right-[-8%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'var(--glow-blue)', filter: 'blur(100px)' }}
      />

      <motion.div
        initial={{ opacity:0, scale:0.96 }}
        animate={{ opacity:1, scale:1 }}
        transition={{ duration:0.45, ease:[0.16,1,0.3,1] }}
        className="w-full max-w-md px-6 relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center group">
            <img
              src="/nanologo.png"
              alt="NanoToxi AI"
              className="h-10 md:h-12 transition-transform duration-300 group-hover:scale-105 rounded"
              style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'normal' }}
            />
          </Link>
        </div>

        {/* Card — theme-aware via CSS vars */}
        <div
          className="rounded-2xl border p-8 shadow-2xl relative overflow-hidden auth-card"
          style={{
            background: 'var(--surface)',
            backdropFilter: 'blur(24px)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Top shimmer line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.4), transparent)' }}
          />

          <div className="text-center mb-7">
            <h2
              className="text-2xl font-bold mb-1.5"
              style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}
            >
              Welcome Back
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Sign in to access the platform.
            </p>
          </div>

          <AnimatePresence mode="wait">
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {/* OAuth Buttons */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => googleLogin()}
                    disabled={!!oauthLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                    style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    {oauthLoading === 'google'
                      ? <Loader2 size={17} className="animate-spin"/>
                      : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                    }
                    Continue with Google
                  </button>
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
                  </div>
                  <div className="relative flex justify-center">
                    <span
                      className="px-3 text-xs auth-divider-bg"
                      style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
                    >
                      or continue with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider ml-0.5" style={{ color: 'var(--text-muted)' }}>
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email" required placeholder="name@company.com"
                      style={inputBase}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold uppercase tracking-wider ml-0.5" style={{ color: 'var(--text-muted)' }}>Password</label>
                      <Link to="/forgot-password" className="text-xs hover:opacity-80 transition-opacity" style={{ color: 'var(--accent)' }}>
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required placeholder="••••••••"
                        style={{ ...inputBase, paddingRight: 44 }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-100"
                        style={{ color: 'var(--text-muted)', opacity: 0.7 }}
                      >
                        {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ background: 'var(--accent)', color: '#000', boxShadow: '0 0 25px rgba(0,198,255,0.22)' }}
                  >
                    {isLoading
                      ? <Loader2 className="animate-spin" size={19}/>
                      : <><span>Login</span><ArrowRight size={17}/></>
                    }
                  </button>
                </form>
              </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--accent)' }}>
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
