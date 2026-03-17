import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, FileText, Activity, BrainCircuit } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 cursor-pointer"
          />
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-4 right-4 bottom-4 w-full max-w-md glass-panel rounded-2xl p-6 shadow-2xl z-[60] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">DeepGuard <span className="text-gradient">AI</span></h2>
              <button 
                onClick={onClose} 
                className="p-2 bg-card_border/80 rounded-full hover:bg-primary/20 hover:text-primary text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-slate-300 mb-8 leading-relaxed">
              An advanced AI-powered multimodal deepfake detection system engineered to identify synthetic media manipulation across images, videos, and audio.
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0 h-fit">
                  <BrainCircuit size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Multimodal Engine</h3>
                  <p className="text-sm text-slate-400">ResNet50 & EfficientNet vision transformers paired with Librosa MFCC audio classifiers.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-3 bg-secondary/10 rounded-xl text-secondary shrink-0 h-fit">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Explainability</h3>
                  <p className="text-sm text-slate-400">Detailed deterministic logic mapping out exactly *why* content was flagged as synthetic.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="p-3 bg-warning/10 rounded-xl text-warning shrink-0 h-fit">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Risk Scoring</h3>
                  <p className="text-sm text-slate-400">Temperature-scaled Softmax confidence layers computing precise categorical risk bounds.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-3 bg-danger/10 rounded-xl text-danger shrink-0 h-fit flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">PDF Reporting</h3>
                  <p className="text-sm text-slate-400">Dynamic ReportLab document generation providing fully compliant metadata audits.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 p-5 bg-primary/5 border border-primary/20 rounded-xl text-center shadow-[0_0_30px_rgba(127,90,240,0.1)]">
              <p className="text-xs text-primary uppercase tracking-widest font-bold">Hackathon Production Ready</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
