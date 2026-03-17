import React, { useCallback, useState } from 'react';
import { UploadCloud, FileVideo, FileAudio, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const getIconForTab = (tab) => {
  switch (tab) {
    case 'image': return <ImageIcon className="w-12 h-12 text-blue-400 mb-4" />;
    case 'video': return <FileVideo className="w-12 h-12 text-blue-400 mb-4" />;
    case 'audio': return <FileAudio className="w-12 h-12 text-blue-400 mb-4" />;
    default: return <UploadCloud className="w-12 h-12 text-blue-400 mb-4" />;
  }
};

export default function UploadZone({ activeTab, onFileSelect }) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-colors duration-200
        ${isDragActive ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-300 hover:border-indigo-300 hover:bg-slate-50'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="fileInput"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleChange}
        accept={
          activeTab === 'image' ? 'image/*' :
          activeTab === 'video' ? 'video/*' :
          activeTab === 'audio' ? 'audio/*' : '*/*'
        }
      />
      {getIconForTab(activeTab)}
      <p className="text-lg font-medium text-slate-700">
        Drag & drop {activeTab} or <span className="text-indigo-500 hover:underline cursor-pointer">browse</span>
      </p>
      <p className="text-sm text-slate-500 mt-2">
        {activeTab === 'image' ? 'Supports JPG, PNG, WEBP' :
         activeTab === 'video' ? 'Supports MP4, AVI, MOV' :
         'Supports WAV, MP3'}
      </p>
    </motion.div>
  );
}
