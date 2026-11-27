"use client";

import { Modal } from "./modal";

// Centered confirmation dialog rendered by the app. The caller mounts it
// only while the confirmation is pending.
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-zinc-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-zinc-300 bg-white px-3 py-1 font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded bg-red-500 px-3 py-1 font-medium text-white transition hover:bg-red-600"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
