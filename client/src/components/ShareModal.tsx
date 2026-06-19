import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './ui/Toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
}

export function ShareModal({ isOpen, onClose, title, text }: ShareModalProps) {
  const { toasts, showToast, removeToast } = useToast();
  const canShare = typeof navigator !== 'undefined' && !!navigator.canShare?.({ text });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    showToast('Copied!', 'success');
  };

  const handleShare = () => {
    navigator.share({ text });
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <pre className="whitespace-pre-wrap text-lg text-gray-800 bg-gray-50 rounded-lg p-3 mb-4 overflow-auto max-h-64 font-sans">{text}</pre>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleCopy} className="flex-1">Copy</Button>
          {canShare && <Button variant="primary" onClick={handleShare} className="flex-1">Share</Button>}
        </div>
      </Modal>
    </>
  );
}
