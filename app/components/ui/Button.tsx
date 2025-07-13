import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { classNames } from '~/utils/classNames';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-arabic',
  {
    variants: {
      variant: {
        default: 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 focus-visible:ring-emerald-500 focus-visible:ring-offset-zinc-900',
        destructive: 'bg-red-600 text-white shadow-lg hover:bg-red-700 focus-visible:ring-red-500 focus-visible:ring-offset-zinc-900',
        outline: 'border-2 border-zinc-600 bg-transparent text-zinc-300 shadow-md hover:bg-zinc-700 hover:text-white hover:border-emerald-500/50 focus-visible:ring-emerald-500 focus-visible:ring-offset-zinc-900',
        secondary: 'bg-zinc-700 text-zinc-300 shadow-md hover:bg-zinc-600 hover:text-white focus-visible:ring-zinc-500 focus-visible:ring-offset-zinc-900 border border-zinc-600',
        ghost: 'hover:bg-zinc-700 hover:text-white focus-visible:ring-zinc-500 focus-visible:ring-offset-zinc-900 text-zinc-400',
        link: 'text-emerald-400 underline-offset-4 hover:underline hover:text-emerald-300 focus-visible:ring-emerald-500 focus-visible:ring-offset-zinc-900',
        success: 'bg-green-600 text-white shadow-lg hover:bg-green-700 focus-visible:ring-green-500 focus-visible:ring-offset-zinc-900',
        warning: 'bg-yellow-600 text-white shadow-lg hover:bg-yellow-700 focus-visible:ring-yellow-500 focus-visible:ring-offset-zinc-900',
        info: 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus-visible:ring-blue-500 focus-visible:ring-offset-zinc-900',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10',
        icon-sm: 'h-8 w-8',
        icon-lg: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? 'slot' : 'button';
    const isDisabled = disabled || loading;
    
    return (
      <Comp 
        className={classNames(
          buttonVariants({ variant, size, className }),
          loading && 'relative',
          isDisabled && 'cursor-not-allowed'
        )} 
        ref={ref} 
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        <div className={classNames(
          'flex items-center gap-2',
          loading && 'opacity-0'
        )}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </div>
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
