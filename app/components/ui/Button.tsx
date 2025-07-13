import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { classNames } from '~/utils/classNames';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-purple-500 text-white shadow hover:bg-purple-600 focus-visible:ring-purple-500',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500',
        outline:
          'border border-zinc-600 bg-zinc-800 text-zinc-300 shadow-sm hover:bg-zinc-700 hover:text-white hover:border-purple-500/50 focus-visible:ring-purple-500',
        secondary: 'bg-zinc-700 text-zinc-300 shadow-sm hover:bg-zinc-600 hover:text-white focus-visible:ring-zinc-500',
        ghost: 'hover:bg-zinc-700 hover:text-white focus-visible:ring-zinc-500 text-zinc-300',
        link: 'text-purple-400 underline-offset-4 hover:underline hover:text-purple-300 focus-visible:ring-purple-500',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-8',
        icon: 'h-9 w-9',
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'slot' : 'button';
    return <Comp className={classNames(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
