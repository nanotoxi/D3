// src/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SPRING_FAST = { type: 'spring', stiffness: 130, damping: 22 };

export const ToastContext = createContext({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100000] flex flex-col gap-2.5 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.94 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: 12, scale: 0.94 }}
              transition={SPRING_FAST}
              className="pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium shadow-2xl backdrop-blur-2xl"
              style={{
                background: 'rgba(8,14,28,0.82)',
                boxShadow: `0 0 0 1px ${toast.type === 'success'
                  ? 'rgba(0,198,255,0.2)'
                  : 'rgba(239,68,68,0.2)'} inset, 0 20px 60px rgba(0,0,0,0.6)`,
              }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: toast.type === 'success' ? 'var(--accent)' : '#ef4444' }} />
              <span style={{ color: 'var(--text)' }}>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
