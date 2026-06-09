import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function ConfirmSaveDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
  title = 'Confirm changes',
  description = (
    <>
      Please type <strong className="text-red-500">confirm</strong> to save your changes.
    </>
  ),
  confirmWord = 'confirm',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isProcessing?: boolean;
  title?: string;
  description?: React.ReactNode;
  confirmWord?: string;
}) {
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = () => {
    if (confirmText.toLowerCase() === confirmWord.toLowerCase()) {
      onConfirm();
      setConfirmText('');
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setConfirmText('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Type "${confirmWord}"`}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                confirmText.toLowerCase() === confirmWord.toLowerCase()
              ) {
                e.preventDefault();
                handleConfirm();
              }
            }}
            disabled={isProcessing}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={
              confirmText.toLowerCase() !== confirmWord.toLowerCase() ||
              isProcessing
            }
            onClick={handleConfirm}
          >
            {isProcessing ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
