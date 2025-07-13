import React, { forwardRef } from 'react';
import { classNames } from '~/utils/classNames';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = true, ...props }, ref) => {
    const baseClasses = 'rounded-xl transition-all duration-200';
    
    const variantClasses = {
      default: 'bg-zinc-800 border border-zinc-700 shadow-lg',
      elevated: 'bg-zinc-800 border border-zinc-700 shadow-xl hover:shadow-2xl',
      outlined: 'bg-transparent border-2 border-zinc-700 shadow-md',
      ghost: 'bg-zinc-800/50 border border-zinc-700/50 shadow-sm backdrop-blur-sm',
    };
    
    const hoverClasses = hover ? 'hover:border-zinc-600 hover:bg-zinc-750 hover:shadow-xl' : '';
    
    return (
      <div
        ref={ref}
        className={classNames(
          baseClasses,
          variantClasses[variant],
          hoverClasses,
          'yousefsh-card',
          className,
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return (
    <div 
      ref={ref} 
      className={classNames(
        'flex flex-col space-y-2 p-4 sm:p-6 pb-0',
        'border-b border-zinc-700/50',
        className
      )} 
      {...props} 
    />
  );
});
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={classNames(
          'text-lg sm:text-xl font-semibold leading-tight tracking-tight',
          'text-white font-arabic',
          className
        )}
        {...props}
      />
    );
  },
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <p 
        ref={ref} 
        className={classNames(
          'text-sm text-zinc-400 font-arabic leading-relaxed',
          className
        )} 
        {...props} 
      />
    );
  },
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return (
    <div 
      ref={ref} 
      className={classNames(
        'p-4 sm:p-6',
        'text-zinc-300 font-arabic',
        className
      )} 
      {...props} 
    />
  );
});
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={classNames(
        'flex items-center justify-between p-4 sm:p-6 pt-0',
        'border-t border-zinc-700/50',
        className
      )} 
      {...props} 
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
