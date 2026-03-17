import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon, FileVideo, FileAudio } from 'lucide-react';
import ScanAnimation from './ScanAnimation';

export default function UploadCard({ file, setFile, activeTab, isDragging, setIsDragging, fileInputRef, isProcessing }) {
  const getAccept = () => {
    if (activeTab === 'image') return "image/*";
    if (activeTab === 'video') return "video/*";
    return "audio/*";
  };

  const preventDefault = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const renderPreview = () => {
    if (!file) return null;
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
      return <img src={url} alt="Preview" className="w-full h-full object-cover rounded-xl" />;
    } else if (file.type.startsWith('video/')) {
      return <video src={url} controls className="w-full h-full object-cover rounded-xl" />;
    } else if (file.type.startsWith('audio/')) {
      return (
         <div className="flex flex-col items-center justify-center h-full space-y-4">
           <FileAudio size={64} className="text-primary" />
           <audio src={url} controls className="w-full max-w-xs" />
         </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative w-full overflow-hidden rounded-2xl glass transition-all duration-300 ${isDragging ? 'border-primary shadow-[0_0_30px_rgba(127,90,240,0.3)] scale-[1.02]' : 'border-card_border'}`}
      onDragEnter={(e) => { preventDefault(e); setIsDragging(true); }}
      onDragLeave={(e) => { preventDefault(e); setIsDragging(false); }}
      onDragOver={preventDefault}
      onDrop={(e) => {
        preventDefault(e);
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          setFile(e.dataTransfer.files[0]);
        }
      }}
    >
      {isProcessing && <ScanAnimation />}
      
      {!file ? (
        <div 
          className="flex flex-col items-center justify-center p-12 cursor-pointer hover:bg-white/5 transition-colors h-[400px]"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={`p-5 rounded-full mb-6 transition-all duration-300 ${isDragging ? 'bg-primary/20 text-primary scale-110 shadow-[0_0_20px_rgba(127,90,240,0.4)]' : 'bg-card_border text-slate-400'}`}>
            <Upload size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Drop your <span className="text-secondary capitalize">{activeTab}</span> here
          </h3>
          <p className="text-sm text-slate-400">or click to browse from your device system</p>
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
            }}
            accept={getAccept()}
          />
        </div>
      ) : (
        <div className="relative h-[400px] w-full bg-black/40 p-2">
          {!isProcessing && (
            <button 
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="absolute top-4 right-4 p-2.5 bg-background/80 hover:bg-danger hover:text-white backdrop-blur-md rounded-full transition-colors text-slate-300 z-30 shadow-lg"
            >
              <X size={20} />
            </button>
          )}
          {renderPreview()}
        </div>
      )}
    </motion.div>
  );
}
