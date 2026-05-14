// src/PricingSection.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2, Zap, CreditCard, Shield, Undo2, History, Activity } from 'lucide-react';
import { useToast } from './ToastContext';

const EASE_EXPO = [0.16, 1, 0.3, 1];
const SPRING_FAST = { type: 'spring', stiffness: 130, damping: 22 };

const fadeUp = {
  hidden:  { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE_EXPO } },
};

const cardStagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.15 } },
};

/* ─── Plan data ──────────────────────────────────────────────────────────── */
const PLANS = [
  {
    id: 'individual',
    name: 'Individual Researcher',
    tier: 'Individual Plan',
    price: 100,
    priceLabel: '$100',
    priceSuffix: '/month',
    ctaLabel: 'Start 14-Day Free Trial',
    ctaType: 'stripe',
    highlighted: true,
    features: [
      '14-Day Free Trial',
      'One Seat',
      'Access to all modules',
      'GPU orchestration',
      'Priority Support',
    ],
  },
  {
    id: 'institutions',
    tier: 'For Institutions / Labs',
    priceLabel: 'CUSTOM',
    priceSuffix: '/month',
    ctaLabel: 'Contact Sales',
    ctaType: 'link',
    ctaHref: 'https://calendly.com/nanotoxi-sales',
    highlighted: false,
    pilotTag: 'For larger teams',
    features: [
      'Unlimited Seats',
      'Everything in Individual',
      'Admin Dashboard',
      'Priority GPU access',
    ],
  },
  {
    id: 'regulatory',
    tier: 'For Regulatory Bodies',
    priceLabel: 'CUSTOM',
    priceSuffix: '/month',
    ctaLabel: 'Contact Sales',
    ctaType: 'link',
    ctaHref: 'https://calendly.com/nanotoxi-sales',
    highlighted: false,
    features: [
      'Custom Model Tuning',
      'Regulatory Compliance Tools',
      'Large Molecule Support',
    ],
  },
];

/* ─── Stripe checkout handler ─────────────────────────────────────────────── */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

async function startStripeCheckout(setPending, showToast, planId) {
  setPending(true);
  try {
    const token = localStorage.getItem('nanotoxi_token');
    if (!token) {
      // Not logged in — redirect to sign up first
      window.location.href = '/signup?plan=' + planId;
      return;
    }
    const res = await fetch(`${BACKEND_URL}/api/v1/stripe/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ plan_id: planId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.error || `Server error: ${res.status}`);
    if (data.checkout_url) {
      window.location.href = data.checkout_url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (err) {
    console.error('Stripe checkout error:', err);
    if (showToast) {
      showToast(err.message || 'Could not connect to payment server.', 'error');
    } else {
      alert(err.message || 'Could not connect to payment server.');
    }
    setPending(false);
  }
}

/* ─── Single card ─────────────────────────────────────────────────────────── */
const PricingCard = ({ plan, isSubscribed }) => {
  const [pending, setPending] = useState(false);
  const { showToast } = useToast();

  const cardStyle = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    border: plan.highlighted
      ? '2px dashed rgba(251,146,60,0.7)'
      : '1px solid rgba(0,198,255,0.22)',
    borderRadius: 24,
    padding: '24px 20px 20px',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    transition: 'border-color 0.3s, box-shadow 0.3s',
    boxSizing: 'border-box',
    height: '100%',
    width: '100%',
  };

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{
        y: plan.highlighted ? -6 : -10,
        boxShadow: plan.highlighted
          ? '0 32px 80px rgba(0,0,0,0.6), 0 0 0 2px rgba(251,146,60,0.5)'
          : '0 24px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,198,255,0.4)',
        transition: SPRING_FAST,
      }}
      style={cardStyle}
    >
      {/* ── Popular badge on highlighted card ── */}
      {plan.highlighted && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(90deg, rgba(251,146,60,0.9), rgba(251,100,30,0.95))',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '0.6rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            padding: '5px 14px',
            borderRadius: 99,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 18px rgba(251,146,60,0.45)',
          }}
        >
          Most Popular
        </div>
      )}

      {/* ── Tier label ── */}
      <div
        style={{
          background: 'var(--accent)',
          color: '#000',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '0.58rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '6px 12px',
          marginBottom: 20,
          lineHeight: 1.4,
          borderRadius: 3,
          display: 'inline-block',
          maxWidth: '100%',
          boxSizing: 'border-box',
          wordWrap: 'break-word',
          overflowWrap: 'anywhere',
        }}
      >
        {plan.tier}
      </div>

      {/* ── Price ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 6,
          marginBottom: 26,
          flexWrap: 'nowrap',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: plan.priceLabel === 'CUSTOM'
              ? 'clamp(1.6rem, 3.5vw, 2.4rem)'
              : 'clamp(2.2rem, 4.5vw, 3rem)',
            color: 'var(--accent)',
            lineHeight: 1,
            letterSpacing: plan.priceLabel === 'CUSTOM' ? '0' : '-0.04em',
            textShadow: '0 0 20px rgba(0,198,255,0.2)',
            whiteSpace: 'nowrap',
          }}
        >
          {plan.priceLabel}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            fontSize: '0.88rem',
            color: 'var(--text-muted)',
            paddingBottom: 3,
            whiteSpace: 'nowrap',
          }}
        >
          {plan.priceSuffix}
        </span>
      </div>

      {/* ── Divider ── */}
      <div
        style={{
          height: 1,
          background: plan.highlighted
            ? 'linear-gradient(90deg, transparent, rgba(0,198,255,0.4), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(0,198,255,0.14), transparent)',
          marginBottom: 24,
          flexShrink: 0,
        }}
      />

      {/* ── Features ── */}
      <ul
        style={{
          listStyle: 'none',
          margin: '0 0 30px 0',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 13,
        }}
      >
        {plan.features.map((feat, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <CheckCircle2
              size={15}
              style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2, opacity: 0.9 }}
            />
            <span
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.91rem',
                lineHeight: 1.55,
                fontFamily: 'var(--font-body)',
              }}
            >
              {feat}
            </span>
          </li>
        ))}
      </ul>

      {/* ── CTA — pushed to bottom with auto margin ── */}
      <div style={{ marginTop: 'auto' }}>
        {plan.ctaType === 'stripe' ? (
          /* Stripe Subscribe button */
          <motion.button
            onClick={() => {
              if (isSubscribed) {
                window.location.href = '/settings/billing';
              } else {
                startStripeCheckout(setPending, showToast, plan.id);
              }
            }}
            disabled={pending}
            whileHover={!pending ? { scale: 1.03 } : {}}
            whileTap={!pending ? { scale: 0.97 } : {}}
            transition={SPRING_FAST}
            id="btn-subscribe-researchers"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.78rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '14px 20px',
              borderRadius: 4,
              border: 'none',
              cursor: pending ? 'default' : 'pointer',
              background: pending
                ? 'rgba(0,198,255,0.6)'
                : 'var(--accent)',
              color: '#000',
              boxShadow: pending
                ? 'none'
                : '0 0 30px rgba(0,198,255,0.32)',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
          >
            {pending ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 0.9s linear infinite' }} />
                Redirecting…
              </>
            ) : isSubscribed && plan.ctaType === 'stripe' ? (
              <>
                <CreditCard size={14} />
                Manage Billing
                <ArrowRight size={13} style={{ flexShrink: 0, marginLeft: 2 }} />
              </>
            ) : (
              <>
                <Zap size={14} />
                {plan.ctaLabel}
                <ArrowRight size={13} style={{ flexShrink: 0, marginLeft: 2 }} />
              </>
            )}
          </motion.button>
        ) : (
          /* Contact Sales link */
          <motion.a
            href={plan.ctaHref}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_FAST}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              textDecoration: 'none',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.78rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '14px 20px',
              borderRadius: 4,
              width: '100%',
              boxSizing: 'border-box',
              background: plan.highlighted ? 'var(--accent)' : 'transparent',
              color: plan.highlighted ? '#000' : 'var(--accent)',
              border: plan.highlighted ? 'none' : '1px solid rgba(0,198,255,0.38)',
              boxShadow: plan.highlighted ? '0 0 28px rgba(0,198,255,0.28)' : 'none',
            }}
          >
            {plan.ctaLabel}
            <ArrowRight size={13} style={{ flexShrink: 0 }} />
          </motion.a>
        )}

        {/* "Our Current Pilots" tag */}
        {plan.pilotTag && (
          <p
            style={{
              textAlign: 'center',
              marginTop: 13,
              color: '#fb923c',
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: '0.84rem',
              fontFamily: 'var(--font-body)',
            }}
          >
            {plan.pilotTag}
          </p>
        )}
      </div>
    </motion.div>
  );
};

/* ─── Main section ────────────────────────────────────────────────────────── */
const PricingSection = () => {
  const { showToast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      showToast('Subscription activated! Welcome to Nanotoxi Pro.', 'success');
      setIsSubscribed(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [showToast]);

  return (
  <section
    id="pricing"
    style={{ padding: '80px 0 100px', position: 'relative', overflow: 'hidden' }}
  >
    {/* Ambient glow */}
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 1000,
        height: 500,
        background: 'radial-gradient(ellipse, rgba(0,198,255,0.07) 0%, transparent 68%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
      }}
    />

    {/* Top rule */}
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 10%, rgba(0,198,255,0.1) 50%, transparent 90%)',
      }}
    />

    <div
      className="container mx-auto px-6"
      style={{ position: 'relative', zIndex: 10, maxWidth: 1200 }}
    >
      {/* ── Header ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        style={{ marginBottom: 48 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 5,
              height: 44,
              background: 'var(--accent)',
              borderRadius: 3,
              flexShrink: 0,
              boxShadow: '0 0 18px rgba(0,198,255,0.6)',
            }}
          />
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              color: 'var(--text)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              lineHeight: 1,
              margin: 0,
            }}
          >
            Pricing
          </h2>
        </div>

        <p
          style={{
            marginTop: 18,
            marginLeft: 21,
            color: 'var(--text-muted)',
            fontSize: '1rem',
            lineHeight: 1.65,
            maxWidth: 520,
          }}
        >
          Choose the plan that fits your research scale. Upgrade or cancel anytime.
        </p>
      </motion.div>

      {/* ── Cards ── */}
      <motion.div
        variants={cardStagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="pricing-grid"
        style={{
          display: 'grid',
          gap: '24px',
          alignItems: 'stretch',
        }}
      >
        {PLANS.map((plan) => (
          <PricingCard key={plan.id} plan={plan} isSubscribed={isSubscribed} />
        ))}
      </motion.div>

      {/* ── Trust badges ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        style={{
          marginTop: 52,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {[
          { icon: <Shield size={16} />, text: 'Secured by Stripe' },
          { icon: <Undo2 size={16} />,  text: 'Cancel anytime' },
          { icon: <History size={16} />, text: 'Instant receipts' },
          { icon: <Activity size={16} />, text: 'PCI compliant' },
        ].map(({ icon, text }) => (
          <div
            key={text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-body)',
              background: 'rgba(255,255,255,0.03)',
              padding: '6px 14px',
              borderRadius: '99px',
              border: '1px solid var(--border)'
            }}
          >
            <span style={{ color: 'var(--accent)' }}>{icon}</span>
            {text}
          </div>
        ))}
      </motion.div>
    </div>

    {/* Bottom rule */}
    <div
      style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 10%, rgba(0,198,255,0.06) 50%, transparent 90%)',
      }}
    />

    {/* Spinner keyframe */}
    <style>{`
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `}</style>
  </section>
  );
};

export default PricingSection;
