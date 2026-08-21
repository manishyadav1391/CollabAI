import { UploadIcon } from "@/components/documents/icons";

export function EmptyFilesState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[16px] border border-dashed border-[var(--border-2)] bg-white px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--bg-2)] text-[var(--faint)]">
        <UploadIcon size={20} />
      </span>
      <div>
        <h3 className="text-[16px] font-bold text-[var(--text)]">No documents yet</h3>
        <p className="mt-1 text-[13.5px] text-[var(--muted)]">
          Drag a file anywhere on this page, or upload one to get started.
        </p>
      </div>
      <button
        type="button"
        onClick={onUpload}
        className="rounded-[var(--r)] border border-[var(--border-2)] bg-[var(--panel-2)] px-5 py-[10px] text-[13.5px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--panel-3)]"
      >
        Upload a document
      </button>
    </div>
  );
}
