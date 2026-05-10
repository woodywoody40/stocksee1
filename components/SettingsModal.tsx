import React, { useState, useEffect } from 'react';
import { X, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) {
      setSavedKey(stored);
      setApiKey(stored);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setSavedKey(apiKey.trim());
      onClose();
    }
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setSavedKey('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-surface-light dark:bg-surface-dark dark:bg-surface-dark-alt rounded-2xl shadow-2xl border border-outline-light dark:border-outline-dark overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-outline-light dark:border-outline-dark">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-brand-orange" />
                  <h2 className="text-lg font-semibold text-on-surface-light dark:text-on-surface-dark">
                    設定
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-secondary-light dark:text-secondary-dark" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-light dark:text-secondary-dark mb-2">
                    Gemini API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="輸入您的 Gemini API Key"
                      className="w-full px-4 py-3 pr-10 rounded-xl bg-background-light dark:bg-background-dark border border-outline-light dark:border-outline-dark text-on-surface-light dark:text-on-surface-dark placeholder-secondary-light dark:placeholder-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-light dark:text-secondary-dark hover:text-on-surface-light dark:hover:text-on-surface-dark"
                    >
                      {showKey ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Key className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-secondary-light dark:text-secondary-dark">
                    請至 Google AI Studio 取得 API Key：https://aistudio.google.com/app/apikey
                  </p>
                </div>

                {savedKey && (
                  <div className="flex items-center gap-2 text-sm text-positive dark:text-positive">
                    <div className="w-2 h-2 rounded-full bg-positive dark:bg-positive" />
                    <span>已設定 API Key</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={!apiKey.trim()}
                    className="flex-1 px-4 py-2.5 bg-brand-orange hover:bg-brand-orange/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                  >
                    儲存
                  </button>
                  {savedKey && (
                    <button
                      onClick={handleClear}
                      className="px-4 py-2.5 text-secondary-light dark:text-secondary-dark hover:text-negative dark:hover:text-negative font-medium rounded-xl border border-outline-light dark:border-outline-dark hover:border-negative dark:hover:border-negative transition-colors"
                    >
                      清除
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;