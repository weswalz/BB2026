import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  speed?: number;
}

export default function ParallaxImage({ 
  src, 
  alt, 
  className = '', 
  speed = 0.5 
}: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 1, 1, 0.3]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        style={{ y, opacity }}
        className="h-full w-full"
      >
        <motion.img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          whileInView={{ 
            scale: 1,
            transition: { duration: 1.2, ease: "easeOut" }
          }}
          viewport={{ once: true }}
        />
      </motion.div>
    </div>
  );
}