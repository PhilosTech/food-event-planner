import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
}

export function ConfirmDialog({ isOpen, message, onConfirm, onCancel, confirmLabel = 'Confirm', confirmVariant = 'primary' }: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Are you sure?">
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
