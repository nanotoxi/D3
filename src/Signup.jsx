// src/Signup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { useToast } from './ToastContext';

const getStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#00ff9d'];

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
    const pts = Array.from({ length: 50 }, () => ({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4,
      r: Math.random()*1.6+0.5,
    }));
    let rafId;
    const draw = () => {
      ctx.clearRect(0,0,w,h);
      pts.forEach((p,i) => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>w) p.vx*=-1;
        if(p.y<0||p.y>h) p.vy*=-1;
        ctx.fillStyle=isLight?'rgba(0,0,0,0.14)':'rgba(255,255,255,0.18)';
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        pts.slice(i+1).forEach(p2=>{
          const dx=p.x-p2.x,dy=p.y-p2.y,d=Math.sqrt(dx*dx+dy*dy);
          if(d<120){
            const a=(1-d/120)*0.4;
            ctx.strokeStyle=isLight?`rgba(0,0,0,${a*0.3})`:`rgba(130,130,130,${a})`;
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
  
  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0 canvas-bg" style={{opacity:0.32}} />;
};

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [agreed, setAgreed]             = useState(false);
  const [password, setPassword]         = useState('');
  const { showToast } = useToast();
  const { theme } = useTheme(); // <-- ADDED THEME HERE
  const navigate = useNavigate();

  const strength = getStrength(password);

  const handleMockSignup = (type) => {
    setOauthLoading(type);
    setTimeout(() => {
      setOauthLoading(null);
      showToast('Backend not connected yet. Simulated account creation successful!');
      navigate('/');
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) { showToast('Please agree to the Terms & Conditions.', 'error'); return; }
    
    setIsLoading(true);
    const nameVal = e.target.elements[0].value;
    const emailVal = e.target.elements[1].value;
    const passVal = password;

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: nameVal, email: emailVal, password: passVal }),
      });
      const data = await res.json();
      
      if (res.ok) {
        showToast('Account created! Logging you in...', 'success');
        const loginRes = await fetch(\/api/v1/auth/login\, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailVal, password: passVal }),
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          localStorage.setItem('nanotoxi_token', loginData.access_token);
          localStorage.setItem('nanotoxi_refresh', loginData.refresh_token);
        }
        window.location.href = '/';
      } else {
        showToast(data.detail || data.error || 'Signup failed. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Connection to auth server failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase = {
    width:'100%', background:'var(--surface2)', border:'1px solid var(--border)',
    borderRadius:10, padding:'13px 16px', color:'var(--text)', fontSize:14,
    outline:'none', transition:'border-color 0.2s',
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{background:'var(--bg)'}}>
      <MoleculeCanvas />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{background:'var(--glow-accent)',filter:'blur(120px)'}} />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{background:'var(--glow-blue)',filter:'blur(120px)'}} />

      <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}}
        transition={{duration:0.45,ease:[0.16,1,0.3,1]}}
        className="w-full max-w-lg relative z-10">

        {/* Logo */}
        <div className="flex justify-center mb-8 relative z-10">
          <Link to="/" className="flex items-center group">
            <img 
              src="/nanologo.png" 
              alt="NanoToxi AI" 
              className="h-10 md:h-15 transition-transform duration-300 group-hover:scale-105 rounded"
              style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'normal' }} 
            />
          </Link>
        </div>

        <div className="rounded-2xl border p-8 md:p-10 shadow-2xl relative overflow-hidden auth-card"
          style={{background:'var(--surface)',backdropFilter:'blur(24px)',borderColor:'var(--border)'}}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{background:'linear-gradient(90deg, transparent, rgba(0,255,157,0.4), transparent)'}} />

          <div className="text-center mb-7 relative z-10">
            <h2 className="text-3xl font-bold mb-2" style={{color:'var(--text)',fontFamily:'var(--font-display)'}}>Create Account</h2>
            <p className="text-sm" style={{color:'var(--text-muted)'}}>Join the platform advancing nanoparticle safety.</p>
          </div>

          {/* OAuth Buttons (Mocked) */}
          <div className="space-y-3 mb-6 relative z-10">
            <button onClick={() => handleMockSignup('google')} disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{background:'var(--surface2)',borderColor:'var(--border)',color:'var(--text)'}}>
              {oauthLoading === 'google' ? <Loader2 size={17} className="animate-spin"/>
                : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
              }
              Sign up with Google
            </button>

            <button onClick={() => handleMockSignup('github')} disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{background:'var(--surface2)',borderColor:'var(--border)',color:'var(--text)'}}>
              {oauthLoading === 'github' ? <Loader2 size={17} className="animate-spin"/>
                : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              }
              Sign up with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6 relative z-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{borderColor:'var(--border)'}} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs auth-divider-bg" style={{background:'var(--surface)',color:'var(--text-muted)'}}>or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider ml-0.5" style={{color:'var(--text-muted)'}}>Full Name</label>
              <input type="text" required placeholder="John Doe" style={inputBase}
                onFocus={e=>e.target.style.borderColor='var(--accent)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider ml-0.5" style={{color:'var(--text-muted)'}}>Work Email</label>
              <input type="email" required placeholder="name@company.com" style={inputBase}
                onFocus={e=>e.target.style.borderColor='var(--accent)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider ml-0.5" style={{color:'var(--text-muted)'}}>Password</label>
              <div className="relative">
                <input type={showPassword?'text':'password'} required
                  placeholder="Create a strong password"
                  value={password} onChange={e=>setPassword(e.target.value)}
                  style={{...inputBase,paddingRight:44}}
                  onFocus={e=>e.target.style.borderColor='var(--accent)'}
                  onBlur={e=>e.target.style.borderColor='var(--border)'} />
                <button type="button" onClick={()=>setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-100"
                  style={{color:'var(--text-muted)',opacity:0.7}}>
                  {showPassword?<EyeOff size={17}/>:<Eye size={17}/>}
                </button>
              </div>
              {password.length>0 && (
                <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} className="space-y-1.5 pt-1">
                  <div className="flex gap-1.5">
                    {[1,2,3,4].map(s=>(
                      <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{background:strength>=s?strengthColor[strength]:'var(--border)'}} />
                    ))}
                  </div>
                  <p className="text-xs" style={{color:strengthColor[strength]||'var(--text-muted)'}}>{strengthLabel[strength]}</p>
                </motion.div>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 pt-1">
              <div onClick={()=>setAgreed(!agreed)}
                className="mt-0.5 w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center cursor-pointer transition-all"
                style={{background:agreed?'var(--accent)':'transparent',borderColor:agreed?'var(--accent)':'var(--border)'}}>
                {agreed && <Check size={13} strokeWidth={3} color="#000"/>}
              </div>
              <p className="text-xs leading-relaxed cursor-pointer" style={{color:'var(--text-muted)'}} onClick={()=>setAgreed(!agreed)}>
                I agree to the{' '}
                <a href="#" className="underline hover:opacity-80" style={{color:'var(--text)'}}>Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="underline hover:opacity-80" style={{color:'var(--text)'}}>Privacy Policy</a>.
              </p>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{background:'var(--accent)',color:'#000',boxShadow:'0 0 25px rgba(0,255,157,0.2)'}}>
              {isLoading ? <Loader2 className="animate-spin" size={19}/> : <><span>Get Started</span><ArrowRight size={17}/></>}
            </button>
          </form>

          <div className="text-center mt-7 pt-6 border-t relative z-10" style={{borderColor:'var(--border)'}}>
            <p className="text-sm" style={{color:'var(--text-muted)'}}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{color:'var(--accent)'}}>Log in</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
