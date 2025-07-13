import { memo } from 'react';
import IconButton from '~/components/ui/IconButton';
interface SettingsButtonProps {
  onClick: () => void;
}

export const SettingsButton = memo(({ onClick }: SettingsButtonProps) => {
  return (
    <IconButton
      onClick={onClick}
      icon="i-ph:gear-six-duotone"
      size="xl"
      data-testid="settings-button"
      className="text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
    />
  );
});
