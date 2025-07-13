import IconButton from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';
import React from 'react';

export const SpeechRecognitionButton = ({
  isListening,
  onStart,
  onStop,
  disabled,
}: {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
}) => {
  return (
    <IconButton
      disabled={disabled}
      className={classNames(
        'transition-all',
        isListening ? 'bg-green-500 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white',
      )}
      onClick={isListening ? onStop : onStart}
      icon={isListening ? 'i-ph:microphone-slash text-xl' : 'i-ph:microphone text-xl'}
    />
  );
};
