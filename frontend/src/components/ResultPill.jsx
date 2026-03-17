import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertOctagon, Info } from 'lucide-react';

export default function ResultPill({ result, confidence, explanation, heatmap }) {
  const isFake = result === 'Fake';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: 'spring' }}
      className={`mt-6 p-6 rounded-2xl border ${
        isFake ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {isFake ? (
            <AlertOctagon className="w-8 h-8 text-red-500" />
          ) : (
            <CheckCircle className="w-8 h-8 text-green-500" />
          )}
          <h3 className={`text-2xl font-bold ${isFake ? 'text-red-700' : 'text-green-700'}`}>
            {result} Media Detected
          </h3>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Confidence</span>
          <span className="text-3xl font-black text-gray-800">
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-3 rounded-full ${isFake ? 'bg-red-500' : 'bg-green-500'}`}
        ></motion.div>
      </div>

      {explanation && typeof explanation === 'object' ? (
        <div className={`p-5 rounded-xl border ${isFake ? 'bg-red-50/50 border-red-100 text-red-900' : 'bg-green-50/50 border-green-100 text-green-900'}`}>
          <div className="flex items-start space-x-3 mb-3">
            <Info className={`w-5 h-5 mt-0.5 shrink-0 ${isFake ? 'text-red-600' : 'text-green-600'}`} />
            <p className="text-sm font-medium leading-relaxed">{explanation.summary}</p>
          </div>
          
          {explanation.key_indicators && explanation.key_indicators.length > 0 && (
            <div className="ml-8 mb-4">
              <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Key Indicators Analyzed</p>
              <ul className="space-y-1.5">
                {explanation.key_indicators.map((indicator, idx) => (
                  <li key={idx} className="text-sm flex items-center before:content-['•'] before:mr-2 before:opacity-50">
                    {indicator}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {explanation.modality_specific && Object.values(explanation.modality_specific)[0] && (
            <div className={`ml-8 mt-4 pt-4 border-t ${isFake ? 'border-red-200/50' : 'border-green-200/50'}`}>
               <p className="text-xs font-mono opacity-80">System Detail: {Object.values(explanation.modality_specific)[0]}</p>
            </div>
          )}
        </div>
      ) : explanation && (
        <div className={`p-4 rounded-xl flex items-start space-x-3 ${isFake ? 'bg-red-100/50 text-red-800' : 'bg-green-100/50 text-green-800'}`}>
          <Info className="w-5 h-5 mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed">{explanation}</p>
        </div>
      )}

      {heatmap && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Analysis Heatmap</h4>
          <img src={heatmap} alt="Grad-CAM Heatmap" className="w-full h-auto rounded-xl shadow-sm border border-gray-200" />
        </div>
      )}
    </motion.div>
  );
}
