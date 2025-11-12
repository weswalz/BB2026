import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FloatingCTAProps {
  href: string;
  text: string;
  showAfterScroll?: number;
}

export default function FloatingCTA({ 
  href, 
  text, 
  showAfterScroll = 200 
}: FloatingCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollY } = useScroll();

  const y = useTransform(scrollY, [0, 100], [100, 0]);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfterScroll);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll]);

  if (!isVisible) return null;

  return (
    <motion.div
      style={{ y }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed bottom-8 right-8 z-40"
    >
      <motion.a
        href={href}
        className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-6 py-3 rounded-full font-bold shadow-xl flex items-center space-x-2"
        whileHover={{ 
          scale: 1.05,
          boxShadow: "0 10px 30px rgba(247, 223, 91, 0.4)" 
        }}
        whileTap={{ scale: 0.95 }}
      >
        <span>{text}</span>
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
        </motion.svg>
      </motion.a>
    </motion.div>
  );
}