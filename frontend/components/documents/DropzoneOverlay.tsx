"use client";

import { useEffect, useRef, useState } from "react";
import { UploadIcon } from "@/components/documents/icons";

function isFileDrag(e: DragEvent) {
  return Array.from(e.dataTransfer?.types ?? []).includes("Files");
}

export function DropzoneOverlay({ label, onDrop }: { label: string; onDrop: (files: FileList) => void }) {
  const [active, setActive] = useState(false);
  const depth = useRef(0);

  useEffect(() => {
    function onDragEnter(e: DragEvent) {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      depth.current += 1;
      setActive(true);
    }
    function onDragOver(e: DragEvent) {
      if (!isFileDrag(e)) return;
      e.preventDefault();
    }
    function onDragLeave(e: DragEvent) {
      if (!isFileDrag(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setActive(false);
    }
    function onDropWindow(e: DragEvent) {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      depth.current = 0;
      setActive(false);
      if (e.dataTransfer?.files?.length) onDrop(e.dataTransfer.files);
    }

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDropWindow);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDropWindow);
    };
  }, [onDrop]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-[rgba(250,250,251,.78)] backdrop-blur-[6px]"
      style={{ animation: "om-rise .2s ease-out both" }}
    >
      <div className="flex flex-col items-center gap-5 rounded-[24px] border-2 border-dashed border-[var(--accent)] bg-white px-20 py-16 shadow-[var(--sh-2)]">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-[image:var(--grad)] shadow-[var(--sh-accent)]"
          style={{ animation: "om-pulse 1.6s ease-in-out infinite" }}
        >
          <UploadIcon size={30} stroke="#fff" />
        </span>
        <div className="text-center">
          <div className="text-[19px] font-bold text-[var(--text)]">Drop files to upload</div>
          <div className="mt-1 text-[14px] text-[var(--muted)]">to {label}</div>
        </div>
      </div>
    </div>
  );
}
