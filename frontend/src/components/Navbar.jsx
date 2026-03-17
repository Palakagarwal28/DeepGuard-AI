import { Info } from 'lucide-react';

export default function Navbar({ onOpenAbout }) {
  return (
    <nav className="w-full flex items-center justify-between p-6 px-8 md:px-12 backdrop-blur-md border-b border-white/5 bg-background/50 sticky top-0 z-40">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">DeepGuard <span className="text-gradient">AI</span></h1>
        <p className="text-xs text-secondary/80 uppercase tracking-widest font-semibold mt-0.5 drop-shadow-sm">Detect. Verify. Trust.</p>
      </div>
      <button 
        onClick={onOpenAbout}
        className="p-3 bg-card_border/50 rounded-full hover:bg-card_border text-secondary hover:text-primary transition-all duration-300 focus:outline-none hover:shadow-[0_0_15px_rgba(44,185,255,0.4)]"
        title="About System"
      >
        <Info size={24} />
      </button>
    </nav>
  );
}
