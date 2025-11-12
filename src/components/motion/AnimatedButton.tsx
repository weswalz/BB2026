import { motion } from 'framer-motion';

interface AnimatedButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export default function AnimatedButton({ 
  href, 
  children, 
  className = '', 
  variant = 'primary' 
}: AnimatedButtonProps) {
  const baseClass = variant === 'primary' ? 'biyu-btn' : 'biyu-btn-secondary';
  
  return (
    <motion.a
      href={href}
      className={`${baseClass} ${className}`}
      whileHover={{
        scale: 1.05,
        backgroundColor: variant === 'primary' ? '#F9E71E' : '#333333',
        transition: { 
          duration: 0.2,
          ease: "easeOut"
        }
      }}
      whileTap={{
        scale: 0.95,
        transition: { duration: 0.1 }
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: {
          delay: 0.4,
          duration: 0.5
        }
      }}
    >
      <motion.span
        initial={{ opacity: 0.8 }}
        whileHover={{ 
          opacity: 1,
          letterSpacing: '0.5px',
          transition: { duration: 0.2 }
        }}
      >
        {children}
      </motion.span>
    </motion.a>
  );
}