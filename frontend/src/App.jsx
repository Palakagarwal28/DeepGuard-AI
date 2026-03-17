import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertOctagon, RefreshCw } from 'lucide-react';

import SplashScreen from './components/SplashScreen';
import Background3D from './components/Background3D';
import CursorGlow from './components/CursorGlow';
import Navbar from './components/Navbar';
import TabSwitcher from './components/TabSwitcher';
import UploadCard from './components/UploadCard';
import ResultCard from './components/ResultCard';
import AboutModal from './components/AboutModal';

const API_BASE_URL = 'http://localhost:8000/api/v1';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('image');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const loadSample = async (type) => {
    const fileNames = { image: 'sample_image.jpg', video: 'sample_video.mp4', audio: 'sample_audio.wav' };
    const mimeTypes = { image: 'image/jpeg', video: 'video/mp4', audio: 'audio/wav' };
    
    if (activeTab !== type) setActiveTab(type);
    
    try {
      const response = await fetch(`/samples/${fileNames[type]}`);
      const blob = await response.blob();
      const sampleFile = new File([blob], fileNames[type], { type: mimeTypes[type] });
      setFile(sampleFile);
      setResult(null);
      setError(null);
    } catch (err) {
      console.error("Failed to load sample:", err);
      setError("Failed to load sample file.");
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const endpoints = {
      image: `${API_BASE_URL}/detect/image`,
      video: `${API_BASE_URL}/detect/video`,
      audio: `${API_BASE_URL}/detect/audio`
    };

    try {
      const response = await axios.post(endpoints[activeTab], formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err?.response?.data?.detail || 'Analysis failed. Make sure the backend server is running and the file is valid.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!result || !file) return;
    
    const now = new Date();
    
    let risk_level = "Low";
    if (result.result === "Fake") {
      risk_level = result.confidence > 0.7 ? "High" : "Medium";
    }

    const reportPayload = {
      filename: file.name,
      file_type: activeTab,
      result: result.result,
      confidence: result.confidence * 100,
      risk_level: risk_level,
      explanation: typeof result.explanation === 'object' 
        ? result.explanation 
        : { summary: result.explanation || "No advanced determinism available.", key_indicators: [] },
      timestamp: now.toLocaleString()
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/generate-report`, reportPayload, {
        responseType: 'blob' 
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Report download failed:', err);
      setError('Failed to download PDF report.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      {!showSplash && (
        <div className="min-h-screen font-sans text-white overflow-x-hidden relative">
          <Background3D />
          <CursorGlow />
          
          <Navbar onOpenAbout={() => setIsAboutOpen(true)} />
          <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <TabSwitcher activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); handleReset(); }} />

              {/* Upload or Analysis Section */}
              <div className="mt-8">
                 <UploadCard 
                   file={file} 
                   setFile={setFile} 
                   activeTab={activeTab}
                   isDragging={isDragging}
                   setIsDragging={setIsDragging}
                   fileInputRef={fileInputRef}
                   isProcessing={isAnalyzing}
                 />

                 {/* Load Samples */}
                 {!file && !result && (
                   <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                     className="mt-10 flex flex-col items-center"
                   >
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Or bypass manual tracking with demo hooks</p>
                     <div className="flex flex-wrap justify-center gap-4">
                       <button onClick={() => loadSample('image')} className="px-5 py-2.5 text-sm bg-card hover:bg-card_border text-secondary rounded-full font-bold transition-all border border-white/5 hover:scale-105 shadow-md">Test Image</button>
                       <button onClick={() => loadSample('video')} className="px-5 py-2.5 text-sm bg-card hover:bg-card_border text-secondary rounded-full font-bold transition-all border border-white/5 hover:scale-105 shadow-md">Test Video</button>
                       <button onClick={() => loadSample('audio')} className="px-5 py-2.5 text-sm bg-card hover:bg-card_border text-secondary rounded-full font-bold transition-all border border-white/5 hover:scale-105 shadow-md">Test Audio</button>
                     </div>
                   </motion.div>
                 )}

                 {/* Analyze Button */}
                 {file && !result && (
                   <div className="mt-8 flex flex-col sm:flex-row gap-4">
                     <button
                       onClick={handleAnalyze}
                       disabled={isAnalyzing}
                       className="flex-1 bg-primary hover:bg-[#9571fa] text-white font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(127,90,240,0.5)] transition-all flex items-center justify-center disabled:opacity-50 hover:scale-[1.02]"
                     >
                       {isAnalyzing ? (
                         <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Scanning Intelligence...</>
                       ) : (
                         'Initiate Scan'
                       )}
                     </button>
                     <button
                       onClick={handleReset}
                       disabled={isAnalyzing}
                       className="w-full sm:w-auto bg-card hover:bg-danger/20 text-slate-300 font-bold py-4 px-8 rounded-xl transition-colors disabled:opacity-50 border border-white/5 hover:text-white hover:border-danger/50"
                     >
                       Cancel
                     </button>
                   </div>
                 )}

                 {/* Error Handling */}
                 {error && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-danger/10 text-danger rounded-xl border border-danger/30 mt-6 text-sm font-bold flex items-center shadow-[0_0_15px_rgba(255,75,75,0.2)]">
                     <AlertOctagon className="w-5 h-5 mr-3 shrink-0" />
                     {error}
                   </motion.div>
                 )}

                 {/* Execution Results Section */}
                 <AnimatePresence>
                   {result && (
                     <motion.div
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       exit={{ opacity: 0, height: 0 }}
                       className="mt-4"
                     >
                       <ResultCard 
                         result={result} 
                         onDownload={handleDownloadReport}
                       />
                       
                       <div className="mt-8 flex justify-center">
                         <button
                           onClick={handleReset}
                           className="inline-flex items-center justify-center text-secondary bg-secondary/10 hover:bg-secondary/20 font-bold px-8 py-4 rounded-xl transition-all hover:scale-[1.02] border border-secondary/20 shadow-[0_0_20px_rgba(44,185,255,0.15)]"
                         >
                           <RefreshCw className="w-5 h-5 mr-3" />
                           Scan Another Protocol
                         </button>
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>

              </div>
            </motion.div>
          </main>
        </div>
      )}
    </>
  );
}

export default App;
