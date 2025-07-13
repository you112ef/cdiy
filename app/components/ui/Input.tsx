import * as React from 'react';
import { classNames } from '~/utils/classNames';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'sm' | 'default' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', size = 'default', leftIcon, rightIcon, error, success, ...props }, ref) => {
    const baseClasses = 'w-full transition-all duration-200 font-arabic placeholder:text-zinc-500';
    
    const variantClasses = {
      default: 'bg-zinc-800 border border-zinc-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
      outlined: 'bg-transparent border-2 border-zinc-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
      filled: 'bg-zinc-700 border border-transparent text-white focus:bg-zinc-600 focus:ring-2 focus:ring-emerald-500/20',
    };
    
    const sizeClasses = {
      sm: 'h-8 px-3 text-sm rounded-md',
      default: 'h-10 px-4 text-sm rounded-lg',
      lg: 'h-12 px-4 text-base rounded-xl',
    };
    
    const stateClasses = {
      error: 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-500/20',
    };
    
    const inputClasses = classNames(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      error ? stateClasses.error : '',
      success ? stateClasses.success : '',
      className
    );
    
    if (leftIcon || rightIcon) {
      return (
        <div className="relative w-full">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={classNames(
              inputClasses,
              leftIcon ? 'pl-10' : '',
              rightIcon ? 'pr-10' : ''
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <input
        type={type}
        className={inputClasses}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
