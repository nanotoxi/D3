import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Undo2,
  ExternalLink,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from './hooks/use-auth';
import { useToast } from './ToastContext';
import { Link } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const BillingPage = () => {
  const { user, checkAuth } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState(null);
  const [actionPending, setActionPending] = useState(false);

  const fetchBilling = async () => {
    try {
      const token = localStorage.getItem('nanotoxi_token');
    const res = await fetch(`${BACKEND_URL}/api/v1/billing`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
      const data = await res.json();
      setBillingData(data);
    } catch (err) {
      console.error('Failed to fetch billing:', err);
      showToast('Could not load billing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
    
    // Check for success session in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_id')) {
      handleSuccess(params.get('session_id'));
    }
  }, []);

  const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:3000';

  const handleSuccess = async (sessionId) => {
    try {
      const _tok = localStorage.getItem('nanotoxi_token');
      await fetch(`${BACKEND_URL}/api/v1/stripe/checkout/success?session_id=${sessionId}`, {
        headers: _tok ? { Authorization: `Bearer ${_tok}` } : {},
      });
      showToast('Subscription activated! Redirecting to your dashboard…', 'success');
      fetchBilling();
      checkAuth();
      // Redirect to dashboard after short delay so the toast is visible
      setTimeout(() => {
        window.location.href = `${DASHBOARD_URL}/dashboard`;
      }, 1500);
    } catch (err) {
      console.error('Success handler failed:', err);
    }
  };

  const cancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel? You will keep access until the end of the period.')) return;
    setActionPending(true);
    try {
      const _t1 = localStorage.getItem('nanotoxi_token');
      const res = await fetch(`${BACKEND_URL}/api/v1/billing/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(_t1 ? { Authorization: `Bearer ${_t1}` } : {}) },
        body: JSON.stringify({ subscription_id: billingData.subscription?.id }),
      });
      if (res.ok) {
        showToast('Subscription scheduled for cancellation', 'info');
        fetchBilling();
      }
    } catch (err) {
      showToast('Cancellation failed', 'error');
    } finally {
      setActionPending(false);
    }
  };

  const resumeSubscription = async () => {
    setActionPending(true);
    try {
      const _t2 = localStorage.getItem('nanotoxi_token');
      const res = await fetch(`${BACKEND_URL}/api/v1/billing/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(_t2 ? { Authorization: `Bearer ${_t2}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ subscriptionId: billingData.subscription.id }),
      });
      if (res.ok) {
        showToast('Subscription resumed successfully!', 'success');
        fetchBilling();
      }
    } catch (err) {
      showToast('Resume failed', 'error');
    } finally {
      setActionPending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050810]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const sub = billingData?.subscription;
  const invoices = billingData?.invoices || [];

  return (
    <div className="min-h-screen bg-[#050810] text-white pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link to="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black font-display tracking-tight uppercase">Billing & Subscription</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your plan, invoices, and payment methods.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Plan Card */}
          <div className="md:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-8 rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)' }}
            >
              {/* Status Badge */}
              <div className="absolute top-8 right-8">
                {sub ? (
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                    sub.stripeStatus === 'active' && !sub.cancelAtPeriodEnd ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    sub.cancelAtPeriodEnd ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      sub.stripeStatus === 'active' && !sub.cancelAtPeriodEnd ? 'bg-emerald-400 animate-pulse' :
                      sub.cancelAtPeriodEnd ? 'bg-amber-400' : 'bg-slate-400'
                    }`} />
                    {sub.cancelAtPeriodEnd ? 'Canceling' : sub.status}
                  </span>
                ) : (
                  <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
                    No Plan
                  </span>
                )}
              </div>

              <div className="mb-10">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Current Plan</p>
                <h2 className="text-4xl font-black mb-2">{sub?.planName || 'Free Tier'}</h2>
                <p className="text-xl font-medium text-blue-400">{sub?.price || '₹0.00'}</p>
              </div>

              {sub && (
                <div className="grid grid-cols-2 gap-8 mb-10 pt-8 border-t border-white/5">
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                      <Calendar size={14} /> Next Billing
                    </div>
                    <p className="text-lg font-bold">{sub.nextBilling}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                      <CreditCard size={14} /> Method
                    </div>
                    <p className="text-lg font-bold">•••• 4242</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-4">
                {!sub ? (
                  <Link to="/#subscription" className="px-8 py-3 rounded-xl bg-blue-500 text-black font-bold uppercase text-xs tracking-widest hover:bg-blue-400 transition-all flex items-center gap-2">
                    View Plans <ChevronRight size={16} />
                  </Link>
                ) : sub.cancelAtPeriodEnd ? (
                  <button 
                    onClick={resumeSubscription}
                    disabled={actionPending}
                    className="px-8 py-3 rounded-xl bg-emerald-500 text-black font-bold uppercase text-xs tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2"
                  >
                    <Undo2 size={16} /> Undo Cancellation
                  </button>
                ) : (
                  <button 
                    onClick={cancelSubscription}
                    disabled={actionPending}
                    className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-bold uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all logout-transition"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </motion.div>

            {/* Invoice History */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2"><History size={18} /> Invoices</h3>
                <span className="text-xs text-slate-500">{invoices.length} entries</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white/5 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                      <th className="px-6 py-4">Month</th>
                      <th className="px-6 py-4">Plan</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.length > 0 ? invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-medium">{inv.month}</td>
                        <td className="px-6 py-4 text-slate-400">{inv.plan}</td>
                        <td className="px-6 py-4">{inv.amount}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-blue-400 hover:text-blue-300"><ExternalLink size={16} /></button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No billing history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
             <div className="p-6 rounded-3xl border border-white/10 bg-white/5">
                <h4 className="font-bold flex items-center gap-2 mb-4 text-blue-400"><Clock size={16} /> Trial Status</h4>
                {sub?.stripeStatus === 'trialing' ? (
                   <div className="space-y-4">
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500" style={{ width: '60%' }} />
                      </div>
                      <p className="text-sm text-slate-400">Your 14-day free trial ends in <span className="text-white font-bold">8 days</span>.</p>
                   </div>
                ) : (
                   <p className="text-sm text-slate-400">No active trial. Subscription is fully active.</p>
                )}
             </div>

             <div className="p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5">
                <h4 className="font-bold flex items-center gap-2 mb-3 text-blue-400"><AlertCircle size={16} /> Need help?</h4>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">Questions about your billing or plan? Our support team is here to assist you.</p>
                <button className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all">
                   Contact Support
                </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BillingPage;
