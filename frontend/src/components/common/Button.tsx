import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'emergency' | 'secondary' | 'ghost' | 'safe';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantMap: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-secondary to-primary text-white hover:shadow-lg hover:shadow-secondary/30 shadow-md shadow-secondary/20',
  emergency:
    'bg-gradient-to-r from-danger to-accent text-white hover:brightness-105 shadow-lg shadow-danger/30 animate-pulse-ring',
  secondary:
    'bg-white/80 text-primary border border-primary/15 hover:border-primary/40 hover:bg-white shadow-sm',
  ghost: 'bg-transparent text-primary hover:bg-primary/5',
  safe: 'bg-gradient-to-r from-safe to-emerald-600 text-white hover:brightness-105 shadow-md shadow-safe/25',
};

const sizeMap: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) => {
  return (
    <button
      className={`ripple focus-ring inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${
        variantMap[variant]
      } ${sizeMap[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
      {children}
    </button>
  );
};

export default Button;
