import { classNames } from '~/utils/classNames';
import type { ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'danger';
}

export function IconButton({
  icon,
  size = 'md',
  variant = 'default',
  className,
  children,
  disabled,
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg',
  };

  const variantClasses = {
    default:
      'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white border border-zinc-600 hover:border-purple-500/50',
    ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-700 hover:text-white',
    outline:
      'bg-transparent text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-600 hover:border-purple-500/50',
    secondary: 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700',
    danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
  };

  return (
    <button
      className={classNames(
        'inline-flex items-center justify-center rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <div className={classNames(icon, 'w-4 h-4')} />}
      {children}
    </button>
  );
}
