import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: boolean;
  tag?: keyof JSX.IntrinsicElements;
}

export default function AnimatedText({ 
  text, 
  className = '', 
  delay = 0,
  stagger = false,
  tag: Tag = 'span'
}: AnimatedTextProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  if (stagger) {
    const words = text.split(' ');
    
    return (
      <Tag className={className}>
        {words.map((word, index) => (
          <motion.span
            key={index}
            className="inline-block mr-2"
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{
              delay: delay + (index * 0.1),
              duration: 0.5,
              ease: "easeOut"
            }}
          >
            {word}
          </motion.span>
        ))}
      </Tag>
    );
  }

  return (
    <motion.div
      as={Tag}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {text}
    </motion.div>
  );
}