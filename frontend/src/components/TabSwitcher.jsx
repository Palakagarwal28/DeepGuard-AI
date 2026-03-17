import { motion } from 'framer-motion';

const tabs = [
  { id: 'image', label: 'Image Modality' },
  { id: 'video', label: 'Video Modality' },
  { id: 'audio', label: 'Audio Modality' }
];

export default function TabSwitcher({ activeTab, setActiveTab }) {
  return (
    <div className="flex justify-center my-8 z-10 relative">
      <div className="flex space-x-2 bg-card/60 p-1.5 rounded-full border border-card_border backdrop-blur-md shadow-2xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-2.5 text-sm font-semibold rounded-full transition-colors ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-primary/90 rounded-full shadow-[0_0_20px_rgba(127,90,240,0.6)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
