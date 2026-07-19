import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'light' | 'dark';
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: ReactNode;
}

const padMap = { sm: 'p-4', md: 'p-6', lg: 'p-8' };

export const GlassCard = ({
  variant = 'light',
  padding = 'md',
  hover = false,
  className = '',
  children,
  ...rest
}: GlassCardProps) => {
  const base = variant === 'dark' ? 'glass-dark' : 'glass';
  return (
    <motion.div
      className={`${base} ${padMap[padding]} ${
        hover ? 'transition-transform hover:-translate-y-1 hover:shadow-glass-lg' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
