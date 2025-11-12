import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  stagger?: boolean;
}

export default function AnimatedSection({ 
  children, 
  className = '', 
  delay = 0,
  direction = 'up',
  stagger = false
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '-50px 0px -50px 0px' // Trigger slightly before element is visible
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const getInitialPosition = () => {
    switch (direction) {
      case 'up':
        return { opacity: 0, y: 60 };
      case 'down':
        return { opacity: 0, y: -60 };
      case 'left':
        return { opacity: 0, x: -60 };
      case 'right':
        return { opacity: 0, x: 60 };
      default:
        return { opacity: 0, y: 60 };
    }
  };

  const variants = {
    hidden: getInitialPosition(),
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
        ...(stagger && {
          staggerChildren: 0.1,
          delayChildren: 0.2,
        }),
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}