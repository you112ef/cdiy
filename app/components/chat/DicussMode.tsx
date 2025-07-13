import { classNames } from '~/utils/classNames';
import IconButton from '~/components/ui/IconButton';

export function DiscussMode() {
  return (
    <div>
      <IconButton className={classNames('transition-all', 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white')} icon="i-ph:chats text-xl" />
    </div>
  );
}
