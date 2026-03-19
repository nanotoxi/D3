// src/Benchmarks.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BarChart3, Shield, Activity,
  Microscope, ChevronDown, ExternalLink,
  TrendingUp, CheckCircle2, Zap
} from 'lucide-react';
import { useTheme } from './ThemeContext';

// ─── ANIMATION VARIANTS ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

// ─── BENCHMARK DATA — updated to use blue accent ──────────────────────────────
const BENCHMARK_CATEGORIES = [
  {
    id: 'toxicity',
    label: 'Toxicity Classification',
    icon: Shield,
    color: '#00c6ff',
    description: 'Binary TOXIC / NON-TOXIC prediction on diverse nanoparticle test sets.',
    metrics: [
      { name: 'Nanotoxi (Ours)', accuracy: 95.2, f1: 94.8, auc: 97.1, highlight: true },
      { name: 'Random Forest', accuracy: 81.4, f1: 80.1, auc: 84.3, highlight: false },
      { name: 'SVM (RBF)', accuracy: 78.9, f1: 77.5, auc: 82.1, highlight: false },
      { name: 'XGBoost', accuracy: 83.7, f1: 82.6, auc: 86.9, highlight: false },
      { name: 'Naive Bayes', accuracy: 71.2, f1: 69.8, auc: 75.4, highlight: false },
      { name: 'KNN (k=5)', accuracy: 74.5, f1: 73.1, auc: 78.8, highlight: false },
    ],
  },
  {
    id: 'aggregation',
    label: 'Aggregation Prediction',
    icon: Activity,
    color: '#2563eb',
    description: 'Hydrodynamic diameter and colloidal stability prediction (R² score).',
    metrics: [
      { name: 'Nanotoxi (Ours)', accuracy: 91.8, f1: 91.2, auc: 94.6, highlight: true },
      { name: 'Linear Regression', accuracy: 62.4, f1: 61.0, auc: 66.3, highlight: false },
      { name: 'Ridge Regression', accuracy: 64.7, f1: 63.5, auc: 68.9, highlight: false },
      { name: 'Gradient Boosting', accuracy: 76.2, f1: 75.4, auc: 79.8, highlight: false },
      { name: 'Neural Net (3L)', accuracy: 80.1, f1: 79.3, auc: 83.4, highlight: false },
      { name: 'Random Forest', accuracy: 74.8, f1: 73.9, auc: 77.6, highlight: false },
    ],
  },
  {
    id: 'cytotoxicity',
    label: 'Cytotoxicity Mechanisms',
    icon: Microscope,
    color: '#f59e0b',
    description: 'Multi-label classification of ROS, apoptosis, and membrane damage pathways.',
    metrics: [
      { name: 'Nanotoxi (Ours)', accuracy: 88.6, f1: 87.9, auc: 92.3, highlight: true },
      { name: 'Multi-label SVM', accuracy: 71.3, f1: 70.1, auc: 74.5, highlight: false },
      { name: 'Label Powerset RF', accuracy: 74.8, f1: 73.6, auc: 78.2, highlight: false },
      { name: 'MLKNN', accuracy: 69.2, f1: 67.8, auc: 72.9, highlight: false },
      { name: 'Binary Relevance', accuracy: 72.6, f1: 71.4, auc: 76.1, highlight: false },
      { name: 'Classifier Chains', accuracy: 73.4, f1: 72.3, auc: 77.0, highlight: false },
    ],
  },
  {
    id: 'risk',
    label: 'Risk Factor Analysis',
    icon: BarChart3,
    color: '#ec4899',
    description: 'Feature attribution accuracy for identifying physicochemical toxicity drivers.',
    metrics: [
      { name: 'Nanotoxi (Ours)', accuracy: 90.4, f1: 89.7, auc: 93.8, highlight: true },
      { name: 'SHAP + XGBoost', accuracy: 79.3, f1: 78.1, auc: 82.6, highlight: false },
      { name: 'LIME + RF', accuracy: 75.6, f1: 74.4, auc: 79.3, highlight: false },
      { name: 'Gradient SHAP', accuracy: 77.1, f1: 76.0, auc: 80.8, highlight: false },
      { name: 'Integrated Grad.', accuracy: 73.8, f1: 72.5, auc: 77.4, highlight: false },
      { name: 'Permutation Imp.', accuracy: 71.4, f1: 70.2, auc: 74.9, highlight: false },
    ],
  },
];

const SUMMARY_STATS = [
  { value: '95.2%', label: 'Peak Accuracy', sub: 'Toxicity classification' },
  { value: '14,791+', label: 'Test Samples', sub: 'Across all benchmarks' },
  { value: '4 Tasks', label: 'Evaluated', sub: 'End-to-end pipeline' },
  { value: '64%', label: 'Fewer False Positives', sub: 'vs. best baseline' },
];

const DATASET_INFO = [
  { label: 'Dataset Size', value: '14,791 nanoparticle samples' },
  { label: 'Nanomaterial Types', value: 'Metallic, Metal-oxide, Carbon, Polymeric' },
  { label: 'Size Range', value: '1 nm – 1,000 nm' },
  { label: 'Coating Variants', value: '47 distinct surface coatings' },
  { label: 'Cell Lines', value: '12 human & murine cell lines' },
  { label: 'Train / Test Split', value: '80% / 20% stratified' },
  { label: 'Cross-Validation', value: '5-fold on training set' },
  { label: 'Data Sources', value: 'eNanoMapper, NanoSafety Cluster, curated literature' },
];

// ─── ANIMATED BAR ─────────────────────────────────────────────────────────────
const AnimatedBar = ({ value, max = 100, color, highlight, delay = 0 }) => (
  <div className="bench-bar h-2 flex-1">
    <motion.div
      className="h-full rounded-full"
      style={{ background: highlight ? color : 'var(--border)' }}
      initial={{ width: 0 }}
      whileInView={{ width: `${(value / max) * 100}%` }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, ease: 'circOut', delay }}
    />
  </div>
);

// ─── METRIC ROW ───────────────────────────────────────────────────────────────
const MetricRow = ({ metric, color, delay }) => (
  <motion.div
    variants={fadeUp}
    className="grid items-center gap-4 py-3.5 border-b"
    style={{ gridTemplateColumns: '1fr 80px 1fr 56px', borderColor: 'var(--border)' }}
  >
    <div className="flex items-center gap-3">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          background: metric.highlight ? color : 'var(--text-muted)',
          opacity: metric.highlight ? 1 : 0.6,
          boxShadow: metric.highlight ? `0 0 6px ${color}` : 'none',
        }}
      />
      <span className="text-sm" style={{ 
        color: metric.highlight ? 'var(--text)' : 'var(--text-muted)', 
        fontWeight: metric.highlight ? 700 : 500,
        fontSize: metric.highlight ? '0.875rem' : '0.82rem',
      }}>
        {metric.name}
      </span>
    </div>
    <span className="text-sm font-bold text-right" style={{ color: metric.highlight ? color : 'var(--text-muted)' }}>
      {metric.accuracy}%
    </span>
    <AnimatedBar value={metric.accuracy} color={color} highlight={metric.highlight} delay={delay} />
    <span className="text-xs text-right" style={{ color: metric.highlight ? 'var(--text)' : 'var(--text-muted)' }}>
      AUC {metric.auc}
    </span>
  </motion.div>
);

// ─── BENCHMARK CARD ───────────────────────────────────────────────────────────
const BenchmarkCard = ({ cat, index }) => {
  const [expanded, setExpanded] = useState(index === 0);
  const Icon = cat.icon;

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-7 gap-4 text-left group"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${cat.color}14`, border: `1px solid ${cat.color}28` }}>
            <Icon size={20} style={{ color: cat.color }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{cat.label}</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{cat.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 flex-shrink-0">
          <div className="text-right">
            <div className="text-2xl font-black" style={{ color: cat.color, fontFamily: 'var(--font-display)' }}>
              {cat.metrics[0].accuracy}%
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>accuracy</div>
          </div>
          <ChevronDown size={18}
            style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-7 pb-7">
              <div className="grid text-xs font-semibold uppercase tracking-wider pb-2 border-b mb-1"
                style={{ gridTemplateColumns: '1fr 80px 1fr 56px', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <span>Model</span>
                <span className="text-right">Accuracy</span>
                <span className="pl-1">Bar</span>
                <span className="text-right">AUC-ROC</span>
              </div>
              <motion.div variants={stagger} initial="hidden" animate="visible">
                {cat.metrics.map((m, i) => (
                  <MetricRow key={m.name} metric={m} color={cat.color} delay={i * 0.08} />
                ))}
              </motion.div>
              <div className="mt-5 px-4 py-3 rounded-xl flex items-center gap-3"
                style={{ background: `${cat.color}0d`, border: `1px solid ${cat.color}20` }}>
                <TrendingUp size={16} style={{ color: cat.color, flexShrink: 0 }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Nanotoxi outperforms the next best model by{' '}
                  <span style={{ color: cat.color, fontWeight: 700 }}>
                    +{(cat.metrics[0].accuracy - Math.max(...cat.metrics.slice(1).map(m => m.accuracy))).toFixed(1)}%
                  </span>{' '}
                  accuracy on the held-out test set.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── RADAR CHART — updated to blue accent ─────────────────────────────────────
const RadarChart = () => {
  const axes = [
    { label: 'Toxicity', value: 95.2, baseline: 83.7 },
    { label: 'Aggregation', value: 91.8, baseline: 80.1 },
    { label: 'Cytotox.', value: 88.6, baseline: 74.8 },
    { label: 'Risk Factor', value: 90.4, baseline: 79.3 },
    { label: 'Speed', value: 98, baseline: 72 },
    { label: 'Coverage', value: 93, baseline: 68 },
  ];
  const N = axes.length;
  const CX = 150, CY = 150, R = 110;

  const toXY = (angle, r) => ({
    x: CX + r * Math.cos(angle - Math.PI / 2),
    y: CY + r * Math.sin(angle - Math.PI / 2),
  });

  const makePolygon = (values) =>
    values.map((v, i) => {
      const pt = toXY((2 * Math.PI * i) / N, (v / 100) * R);
      return `${pt.x},${pt.y}`;
    }).join(' ');

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg width="300" height="300" viewBox="0 0 300 300" className="mx-auto">
      {rings.map((r, ri) => (
        <polygon key={ri} points={makePolygon(Array(N).fill(r * 100))}
          fill="none" stroke="rgba(0,198,255,0.07)" strokeWidth="1" />
      ))}
      {axes.map((_, i) => {
        const pt = toXY((2 * Math.PI * i) / N, R);
        return <line key={i} x1={CX} y1={CY} x2={pt.x} y2={pt.y} stroke="rgba(0,198,255,0.08)" strokeWidth="1" />;
      })}
      <polygon points={makePolygon(axes.map(a => a.baseline))}
        fill="rgba(37,99,235,0.06)" stroke="rgba(37,99,235,0.35)" strokeWidth="1.5" strokeDasharray="4 3" />
      <polygon points={makePolygon(axes.map(a => a.value))}
        fill="rgba(0,198,255,0.12)" stroke="rgba(0,198,255,0.85)" strokeWidth="2" />
      {axes.map((a, i) => {
        const pt = toXY((2 * Math.PI * i) / N, (a.value / 100) * R);
        return <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#00c6ff" />;
      })}
      {axes.map((a, i) => {
        const angle = (2 * Math.PI * i) / N;
        const pt = toXY(angle, R + 22);
        return (
          <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fontFamily="var(--font-display)" fill="var(--text-muted)">
            {a.label}
          </text>
        );
      })}
    </svg>
  );
};

// ─── BENCHMARKS PAGE ─────────────────────────────────────────────────────────
const BenchmarksPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { theme } = useTheme();

  const filteredCats = activeTab === 'all'
    ? BENCHMARK_CATEGORIES
    : BENCHMARK_CATEGORIES.filter(c => c.id === activeTab);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Top nav bar — theme-aware */}
      <header className="border-b sticky top-0 z-40 backdrop-blur-xl"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-nav)' }}>
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <img
              src="/nanologo.png"
              alt="NanoToxi AI"
              className="h-8 md:h-10 rounded transition-transform duration-300 group-hover:scale-105"
              style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'normal' }}
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-muted)' }}>
              <ArrowLeft size={15} />
              Back to Home
            </Link>
            <a href="https://web-production-6a673.up.railway.app" target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
              style={{ background: 'var(--accent)', color: '#000' }}>
              Try API →
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 border-b overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {/* Blue grid overlay */}
        <div className="absolute inset-0 pointer-events-none grid-overlay" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(0,198,255,0.1) 0%, transparent 70%)', filter: 'blur(30px)' }} />

        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-wider uppercase"
                style={{ borderColor: 'rgba(0,198,255,0.35)', color: 'var(--accent)', background: 'rgba(0,198,255,0.07)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                NanotoxiBench v1.0
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-black mb-4"
              style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Benchmark Results
            </motion.h1>
            <motion.p variants={fadeUp} className="text-xl max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-muted)' }}>
              Rigorous evaluation of Nanotoxi's ML pipeline against established baselines across all four prediction tasks.
            </motion.p>

            {/* Summary stats */}
            <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {SUMMARY_STATS.map((stat, i) => (
                <motion.div key={i} variants={fadeUp}
                  className="rounded-2xl border p-5 text-center"
                  style={{
                    background: 'rgba(0,198,255,0.04)',
                    borderColor: 'rgba(0,198,255,0.15)',
                    backdropFilter: 'blur(10px)',
                  }}>
                  <div className="text-3xl font-black mb-1" style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text)' }}>{stat.label}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.sub}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-[1fr_340px] gap-10 items-start">

          {/* Left: benchmark tables */}
          <div>
            <div className="flex flex-wrap gap-2 mb-8">
              {[{ id: 'all', label: 'All Tasks' }, ...BENCHMARK_CATEGORIES.map(c => ({ id: c.id, label: c.label }))].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab.id ? 'var(--accent)' : 'var(--surface)',
                    color: activeTab === tab.id ? '#000' : 'var(--text-muted)',
                    border: `1px solid ${activeTab === tab.id ? 'transparent' : 'var(--border)'}`,
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={stagger}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
                className="space-y-5"
              >
                {filteredCats.map((cat, i) => (
                  <BenchmarkCard key={cat.id} cat={cat} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-bold mb-1 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Performance Radar</h3>
              <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Nanotoxi vs. best baseline across all dimensions</p>
              <RadarChart />
              <div className="flex items-center justify-center gap-6 mt-4">
                {[
                  { color: '#00c6ff', label: 'Nanotoxi' },
                  { color: 'rgba(37,99,235,0.5)', label: 'Best Baseline', dash: true },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div className="w-6 h-px" style={{ background: l.color, borderTop: l.dash ? '1.5px dashed' : 'none' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Dataset Details</h3>
              <div className="space-y-3">
                {DATASET_INFO.map(item => (
                  <div key={item.label} className="flex justify-between items-start gap-4">
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span className="text-xs text-right font-medium" style={{ color: 'var(--text)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* API CTA card — blue themed */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="rounded-2xl border p-6 relative overflow-hidden"
              style={{ background: 'rgba(0,198,255,0.04)', borderColor: 'rgba(0,198,255,0.18)' }}>
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.5), transparent)' }} />
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                Run Your Own Predictions
              </h3>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                Access the full pipeline via our REST API or schedule a live demo.
              </p>
              <div className="flex flex-col gap-3">
                <a href="https://web-production-6a673.up.railway.app" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{ background: 'var(--accent)', color: '#000' }}>
                  <Zap size={15} /> Try API Free
                </a>
                <a href="https://calendly.com/nanotoxi/demo"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm border transition-all hover:opacity-80"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <ExternalLink size={14} /> Schedule Demo
                </a>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Methodology</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                All models evaluated on identical 20% held-out stratified test sets. No data leakage.
                Hyperparameters tuned via 5-fold CV on training split only. Accuracy reported as
                balanced accuracy for imbalanced classes. AUC-ROC averaged across classes for
                multi-label tasks.
              </p>
              <div className="mt-4 pt-4 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Expert-reviewed evaluation protocol</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: 'var(--border)' }}>
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <Link to="/" className="flex items-center">
            <img
              src="/nanologo.png"
              alt="NanoToxi AI"
              className="h-6 md:h-8 rounded transition-transform duration-300 hover:scale-105"
              style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'normal' }}
            />
          </Link>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            NanotoxiBench v1.0 · © 2025 Nanotoxi. All rights reserved.
          </p>
          <Link to="/" className="text-sm hover:opacity-80 transition-opacity flex items-center gap-2"
            style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={13} /> Back to Home
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default BenchmarksPage;
