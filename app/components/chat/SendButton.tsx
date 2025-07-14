import type { ComponentProps } from 'react';
import { memo } from 'react';
import { classNames } from '~/utils/classNames';

interface SendButtonProps extends ComponentProps<'button'> {
  show: boolean;
  isStreaming?: boolean;
}

export const SendButton = memo(({ show, isStreaming, className, disabled, ...props }: SendButtonProps) => {
  return (
    <button
      className={classNames(
        'flex items-center justify-center w-[34px] h-[34px] rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2',
        isStreaming
          ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500/50'
          : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        show ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {isStreaming ? <div className="i-ph:stop w-4 h-4" /> : <div className="i-ph:paper-plane-tilt w-4 h-4" />}
    </button>
  );
});

SendButton.displayName = 'SendButton';
