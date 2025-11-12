import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedNavigationProps {
  children: React.ReactNode;
}

export default function AnimatedNavigation({ children }: AnimatedNavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  const headerBackground = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255, 255, 255, 0.1)', 'rgba(0, 0, 0, 0.9)']
  );

  const backdropBlur = useTransform(
    scrollY,
    [0, 100],
    ['blur(10px)', 'blur(20px)']
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      style={{ 
        backgroundColor: headerBackground,
        backdropFilter: backdropBlur 
      }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 w-full z-50 border-b transition-all duration-300 ${
        isScrolled ? 'border-white/40' : 'border-white/20'
      }`}
    >
      <div className="container mx-auto px-4">
        <motion.nav 
          className="flex items-center justify-between h-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {children}
        </motion.nav>
      </div>
    </motion.header>
  );
}