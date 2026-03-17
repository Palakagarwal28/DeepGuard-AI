import React from 'react';
import { motion } from 'framer-motion';

export default function TabSelector({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'image', label: 'Image' },
    { id: 'video', label: 'Video' },
    { id: 'audio', label: 'Audio' }
  ];

  return (
    <div className="flex p-1 space-x-1 bg-indigo-50/50 rounded-xl mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`relative w-full py-2.5 text-sm font-medium rounded-lg focus:outline-none transition-colors
            ${activeTab === tab.id ? 'text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-indigo-600 hover:bg-white/50'}
          `}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute inset-0 bg-white rounded-lg opacity-100 shadow-sm border border-indigo-100/50"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
