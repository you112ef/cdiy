import * as RadixDialog from '@radix-ui/react-dialog';
import { motion, type Variants } from 'framer-motion';
import React, { memo, type ReactNode, useState, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { IconButton } from './IconButton';
import { Button } from './Button';
import { FixedSizeList } from 'react-window';
import { Checkbox } from './Checkbox';
import { Label } from './Label';

export { Close as DialogClose, Root as DialogRoot } from '@radix-ui/react-dialog';

interface DialogButtonProps {
  type: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
  onClick?: (event: React.MouseEvent) => void;
  disabled?: boolean;
}

export const DialogButton = memo(({ type, children, onClick, disabled }: DialogButtonProps) => {
  return (
    <button
      className={classNames(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
        type === 'primary'
          ? 'bg-purple-500 text-white hover:bg-purple-600 focus:ring-2 focus:ring-purple-500/50'
          : type === 'secondary'
            ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white focus:ring-2 focus:ring-zinc-500/50'
            : 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500/50',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
});

export const DialogTitle = memo(({ className, children, ...props }: RadixDialog.DialogTitleProps) => {
  return (
    <RadixDialog.Title
      className={classNames('text-lg md:text-xl font-semibold text-white flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </RadixDialog.Title>
  );
});

export const DialogDescription = memo(({ className, children, ...props }: RadixDialog.DialogDescriptionProps) => {
  return (
    <RadixDialog.Description
      className={classNames('text-sm text-zinc-400 mt-1', className)}
      {...props}
    >
      {children}
    </RadixDialog.Description>
  );
});

const transition = {
  duration: 0.15,
  ease: cubicEasingFn,
};

export const dialogBackdropVariants = {
  closed: {
    opacity: 0,
    transition,
  },
  open: {
    opacity: 1,
    transition,
  },
} satisfies Variants;

export const dialogVariants = {
  closed: {
    x: '-50%',
    y: '-40%',
    scale: 0.96,
    opacity: 0,
    transition,
  },
  open: {
    x: '-50%',
    y: '-50%',
    scale: 1,
    opacity: 1,
    transition,
  },
} satisfies Variants;

interface DialogProps {
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
  onBackdrop?: () => void;
}

export const Dialog = memo(({ children, className, showCloseButton = true, onClose, onBackdrop }: DialogProps) => {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay asChild>
        <motion.div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
          initial="closed"
          animate="open"
          exit="closed"
          variants={dialogBackdropVariants}
          onClick={onBackdrop}
        />
      </RadixDialog.Overlay>
      <RadixDialog.Content asChild>
        <motion.div
          className={classNames(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-700 z-[9999] w-[95vw] max-w-md sm:max-w-lg md:max-w-xl focus:outline-none max-h-[90vh] overflow-hidden',
            className,
          )}
          initial="closed"
          animate="open"
          exit="closed"
          variants={dialogVariants}
        >
          <div className="flex flex-col max-h-[90vh]">
            {children}
            {showCloseButton && (
              <RadixDialog.Close asChild onClick={onClose}>
                <IconButton
                  icon="i-ph:x"
                  className="absolute top-3 right-3 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg"
                  size="sm"
                />
              </RadixDialog.Close>
            )}
          </div>
        </motion.div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});

/**
 * Props for the ConfirmationDialog component
 */
export interface ConfirmationDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Callback when the dialog is closed
   */
  onClose: () => void;

  /**
   * Callback when the confirm button is clicked
   */
  onConfirm: () => void;

  /**
   * The title of the dialog
   */
  title: string;

  /**
   * The description of the dialog
   */
  description: string;

  /**
   * The text for the confirm button
   */
  confirmLabel?: string;

  /**
   * The text for the cancel button
   */
  cancelLabel?: string;

  /**
   * The variant of the confirm button
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

  /**
   * Whether the confirm button is in a loading state
   */
  isLoading?: boolean;
}

/**
 * A reusable confirmation dialog component that uses the Dialog component
 */
export function ConfirmationDialog({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <RadixDialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog showCloseButton={false}>
        <div className="p-6 bg-zinc-900 relative z-10">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="mb-6">{description}</DialogDescription>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
              className="bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600 hover:text-white"
            >
              {cancelLabel}
            </Button>
            <Button
              variant={variant}
              onClick={onConfirm}
              disabled={isLoading}
              className={
                variant === 'destructive'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }
            >
              {isLoading ? (
                <>
                  <div className="i-ph-spinner-gap-bold animate-spin w-4 h-4 mr-2" />
                  {confirmLabel}
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </RadixDialog.Root>
  );
}

/**
 * Type for selection item in SelectionDialog
 */
type SelectionItem = {
  id: string;
  label: string;
  description?: string;
};

/**
 * Props for the SelectionDialog component
 */
export interface SelectionDialogProps {
  /**
   * The title of the dialog
   */
  title: string;

  /**
   * The items to select from
   */
  items: SelectionItem[];

  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Callback when the dialog is closed
   */
  onClose: () => void;

  /**
   * Callback when the confirm button is clicked with selected item IDs
   */
  onConfirm: (selectedIds: string[]) => void;

  /**
   * The text for the confirm button
   */
  confirmLabel?: string;

  /**
   * The maximum height of the selection list
   */
  maxHeight?: string;
}

/**
 * A reusable selection dialog component that uses the Dialog component
 */
export function SelectionDialog({
  title,
  items,
  isOpen,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  maxHeight = '60vh',
}: SelectionDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Reset selected items when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedItems([]);
      setSelectAll(false);
    }
  }, [isOpen]);

  const handleToggleItem = (id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(items.map((item) => item.id));
      setSelectAll(true);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedItems);
    onClose();
  };

  // Calculate the height for the virtualized list
  const listHeight = Math.min(
    items.length * 60,
    parseInt(maxHeight.replace('vh', '')) * window.innerHeight * 0.01 - 40,
  );

  // Render each item in the virtualized list
  const ItemRenderer = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    return (
      <div
        key={item.id}
        className={classNames(
          'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer',
          selectedItems.includes(item.id)
            ? 'bg-purple-500/20 border border-purple-500/50'
            : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700',
        )}
        style={{
          ...style,
          width: '100%',
          boxSizing: 'border-box',
          margin: '4px 0',
        }}
        onClick={() => handleToggleItem(item.id)}
      >
        <Checkbox
          id={`item-${item.id}`}
          checked={selectedItems.includes(item.id)}
          onCheckedChange={() => handleToggleItem(item.id)}
        />
        <div className="grid gap-1.5 leading-none flex-1">
          <Label
            htmlFor={`item-${item.id}`}
            className={classNames(
              'text-sm font-medium cursor-pointer',
              selectedItems.includes(item.id)
                ? 'text-purple-300'
                : 'text-white',
            )}
          >
            {item.label}
          </Label>
          {item.description && <p className="text-xs text-zinc-400">{item.description}</p>}
        </div>
      </div>
    );
  };

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog showCloseButton={false} className="max-w-2xl">
        <div className="p-6 bg-zinc-900 relative z-10">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="mt-2 mb-4">
            Select the items you want to include and click{' '}
            <span className="text-purple-400 font-medium">{confirmLabel}</span>.
          </DialogDescription>

          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-300">
                {selectedItems.length} of {items.length} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs h-8 px-3 text-white hover:text-purple-300 hover:bg-purple-500/20 bg-zinc-700"
              >
                {selectAll ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div
              className="pr-2 border rounded-lg border-zinc-700 bg-zinc-800"
              style={{
                maxHeight,
              }}
            >
              {items.length > 0 ? (
                <FixedSizeList
                  height={listHeight}
                  width="100%"
                  itemCount={items.length}
                  itemSize={68}
                  className="scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-zinc-600"
                >
                  {ItemRenderer}
                </FixedSizeList>
              ) : (
                <div className="text-center py-8 text-sm text-zinc-400">No items to display</div>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedItems.length === 0}
              className="bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Dialog>
    </RadixDialog.Root>
  );
}
