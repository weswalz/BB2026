import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

export default function AnimatedCard({ 
  children, 
  className = '', 
  delay = 0,
  hover = true
}: AnimatedCardProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
          delay,
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }}
      viewport={{ once: true, margin: "-50px" }}
      {...(hover && {
        whileHover: {
          y: -8,
          scale: 1.02,
          boxShadow: "0 20px 40px rgba(247, 223, 91, 0.1)",
          transition: { 
            duration: 0.3,
            ease: "easeOut"
          }
        }
      })}
    >
      {children}
    </motion.div>
  );
}