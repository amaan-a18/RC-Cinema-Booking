import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}

export function Modal({ title, onClose, children, widthClass = "max-w-lg" }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClass} rounded-md border border-ink/10 bg-surface p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
