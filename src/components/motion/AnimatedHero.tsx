import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedHeroProps {
  children: React.ReactNode;
}

export default function AnimatedHero({ children }: AnimatedHeroProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const titleVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for professional feel
      },
    },
  };

  const subtitleVariants = {
    hidden: { 
      opacity: 0, 
      y: 30 
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      className="biyu-hero-content"
    >
      <motion.h1 
        variants={titleVariants}
        className="biyu-hero-title"
        whileHover={{ 
          scale: 1.05,
          transition: { duration: 0.3 }
        }}
      >
        BIYU PROMOTIONS
      </motion.h1>
      
      <motion.p 
        variants={subtitleVariants}
        className="biyu-hero-subtitle"
      >
        Fighting For Legacy, Driven by Culture
      </motion.p>
    </motion.div>
  );
}