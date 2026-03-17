import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function SplashScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative flex flex-col items-center justify-center"
      >
        <div className="absolute w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full" />
        
        <motion.h1 
          className="text-5xl md:text-7xl font-bold text-white mb-4 z-10 tracking-tight"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          DeepGuard <span className="text-gradient">AI</span>
        </motion.h1>
        
        <motion.p 
          className="text-xl md:text-2xl text-secondary font-medium tracking-widest uppercase z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Detect. Verify. Trust.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
