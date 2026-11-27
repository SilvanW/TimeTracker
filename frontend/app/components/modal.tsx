"use client";

import type { ReactNode } from "react";

// Generic centered modal (dimmed backdrop + card). The caller mounts it
// only while it is open; clicking the backdrop calls onClose.
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40"
      onClick={onClose}
    >
      <div
        className={`w-full ${wide ? "max-w-md" : "max-w-sm"} rounded-lg border border-zinc-200 bg-white p-6 shadow-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-zinc-800">{title}</h2>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}
