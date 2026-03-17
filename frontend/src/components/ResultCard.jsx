import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Download } from 'lucide-react';

export default function ResultCard({ result, onDownload }) {
  if (!result) return null;

  const isFake = result.result === "Fake";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 mt-8 overflow-hidden relative shadow-2xl"
    >
      {/* Background glow modifier based on result */}
      <div className={`absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 rounded-full blur-[100px] opacity-20 pointer-events-none ${isFake ? 'bg-danger' : 'bg-secondary'}`} />

      <h3 className="text-lg font-bold text-white mb-6 tracking-wide flex items-center">
        Detection Results
      </h3>
      
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Outcome Box */}
        <div className={`flex-1 rounded-xl p-5 border shadow-inner ${
          isFake 
            ? 'bg-danger/10 border-danger/30 text-danger' 
            : 'bg-secondary/10 border-secondary/30 text-secondary'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {isFake ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
            <span className="text-2xl font-black uppercase tracking-widest">{result.result}</span>
          </div>
          <p className="text-sm opacity-80 mt-1 font-medium">Confidence Score: <span className="font-bold">{result.confidence.toFixed(2)}%</span></p>
          <p className="text-sm opacity-80 mt-1 font-medium">Risk Level: <span className="font-bold">{result.risk_level}</span></p>
        </div>

        {/* Action / Hook Box */}
        <div className="flex-1 rounded-xl p-5 border border-primary/20 bg-primary/5 flex flex-col justify-center items-center">
             <button
                onClick={onDownload}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <Download size={20} /> Download PDF Report
              </button>
        </div>
      </div>

      {result.explanation && (
        <div className="bg-background/50 rounded-xl p-5 border border-white/5">
           <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">AI Explainability</h4>
           <p className="text-slate-300 text-sm leading-relaxed mb-4">
             {result.explanation.summary}
           </p>
           
           <div className="space-y-2">
             <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Key Indicators</span>
             <ul className="space-y-2">
                {result.explanation.key_indicators && result.explanation.key_indicators.map((indicator, idx) => (
                  <li key={idx} className="flex items-start text-sm text-slate-300 bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-primary mr-2">❖</span>
                    {indicator}
                  </li>
                ))}
             </ul>
           </div>
        </div>
      )}
    </motion.div>
  );
}
