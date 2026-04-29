"use client";

import { useState } from "react";
import DocumentLightbox from "./DocumentLightbox";

interface DocumentAttachmentProps {
  path: string;
  kind: "pdf" | "image";
  filename: string;
}

export default function DocumentAttachment({
  path,
  kind,
  filename,
}: DocumentAttachmentProps) {
  const [hover, setHover] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (kind === "image") {
    return (
      <>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          aria-label={`Preview ${filename}`}
          style={{
            display: "block",
            marginTop: 12,
            padding: 0,
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid #e8e3dd",
            boxShadow: hover
              ? "0 4px 12px rgba(0,0,0,0.08)"
              : "0 1px 3px rgba(0,0,0,0.04)",
            transition: "box-shadow 150ms ease",
            maxWidth: 320,
            width: "100%",
            background: "transparent",
            cursor: "zoom-in",
            fontFamily: "'Inter', sans-serif",
            textAlign: "left",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={path}
            alt={filename}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: 240,
              objectFit: "cover",
              display: "block",
            }}
          />
          <div
            style={{
              padding: "8px 12px",
              fontSize: 12,
              color: "#8a8279",
              backgroundColor: "#faf9f7",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {filename}
            </span>
            <span style={{ color: "#7c9a92", flexShrink: 0 }}>Preview →</span>
          </div>
        </button>
        <DocumentLightbox
          open={lightboxOpen}
          src={path}
          alt={filename}
          onClose={() => setLightboxOpen(false)}
        />
      </>
    );
  }

  return (
    <a
      href={path}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginTop: 12,
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid #e8e3dd",
        backgroundColor: "#faf9f7",
        textDecoration: "none",
        maxWidth: 320,
        boxShadow: hover
          ? "0 4px 12px rgba(0,0,0,0.08)"
          : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 150ms ease",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: 36,
          height: 44,
          flexShrink: 0,
          borderRadius: 4,
          backgroundColor: "#e8e3dd",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#7c9a92",
        }}
        aria-hidden
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            color: "#3d3832",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {filename}
        </div>
        <div style={{ fontSize: 11, color: "#7c9a92", marginTop: 2 }}>
          Open record →
        </div>
      </div>
    </a>
  );
}
