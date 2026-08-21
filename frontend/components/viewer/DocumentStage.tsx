"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { DownloadIcon, ZoomInIcon, ZoomOutIcon } from "@/components/documents/icons";
import { FileIcon } from "@/components/ui/icons";
import type { DocumentVersion } from "@/lib/types";

const BASE_WIDTH = 780;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.15;

function isRenderable(mimeType: string) {
  return mimeType === "application/pdf" || mimeType.startsWith("text/");
}

export function DocumentStage({
  documentId,
  version,
  initialPage,
}: {
  documentId: string;
  version: DocumentVersion;
  initialPage?: number | null;
}) {
  const [zoom, setZoom] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const renderable = isRenderable(version.mime_type);

  useEffect(() => {
    if (!renderable) return;
    apiClient
      .get<{ download_url: string }>(`/documents/${documentId}/download-url`)
      .then(({ data }) => setViewUrl(data.download_url))
      .catch(() => {});
  }, [documentId, renderable]);

  function handleDownload() {
    setDownloading(true);
    apiClient
      .get<{ download_url: string }>(`/documents/${documentId}/download-url`)
      .then(({ data }) => window.open(data.download_url, "_blank", "noopener,noreferrer"))
      .finally(() => setDownloading(false));
  }

  return (
    <div className="flex h-full flex-col bg-[var(--bg-2)]">
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] bg-white px-4 py-[10px]">
        <button
          type="button"
          disabled={!renderable || zoom <= MIN_ZOOM}
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
          className="flex h-7 w-7 items-center justify-center rounded-[7px] text-[var(--muted)] transition-colors hover:bg-[var(--panel-2)] disabled:opacity-30"
          aria-label="Zoom out"
        >
          <ZoomOutIcon size={15} />
        </button>
        <span className="w-[42px] text-center font-mono text-[11.5px] text-[var(--faint)]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          disabled={!renderable || zoom >= MAX_ZOOM}
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
          className="flex h-7 w-7 items-center justify-center rounded-[7px] text-[var(--muted)] transition-colors hover:bg-[var(--panel-2)] disabled:opacity-30"
          aria-label="Zoom in"
        >
          <ZoomInIcon size={15} />
        </button>

        <span className="ml-auto flex items-center gap-2 font-mono text-[11px] text-[var(--faint)]">
          {version.mime_type.split("/")[1]?.toUpperCase()}
        </span>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-[6px] rounded-[8px] border border-[var(--border)] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--panel-2)]"
        >
          <DownloadIcon size={14} />
          {downloading ? "Preparing…" : "Download"}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {renderable ? (
          <div
            className="mx-auto overflow-hidden rounded-[4px] bg-white shadow-[var(--sh-2)] transition-[width] duration-150"
            style={{ width: BASE_WIDTH * zoom, minHeight: 1000 }}
          >
            {viewUrl ? (
              <iframe
                src={initialPage ? `${viewUrl}#page=${initialPage}` : viewUrl}
                title={version.filename}
                className="h-[1400px] w-full border-0"
              />
            ) : (
              <div className="flex h-[1400px] items-center justify-center text-[13px] text-[var(--faint)]">
                Loading preview…
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto flex max-w-[420px] flex-col items-center gap-4 rounded-[16px] border border-[var(--border)] bg-white px-8 py-16 text-center shadow-[var(--sh-1)]">
            <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[var(--bg-2)] text-[var(--faint)]">
              <FileIcon size={24} />
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-[var(--text)]">Preview not available</h3>
              <p className="mt-1 text-[13px] text-[var(--muted)]">
                {version.filename} can&apos;t be previewed in the browser. Download it to view it.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-[7px] rounded-[var(--r)] px-5 py-[10px] text-[13.5px] font-semibold text-white shadow-[var(--sh-accent)] bg-[image:var(--grad)]"
            >
              <DownloadIcon size={14} />
              {downloading ? "Preparing…" : "Download"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
