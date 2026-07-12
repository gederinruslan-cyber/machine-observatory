import { ImageResponse } from "next/og";

export const alt =
  "Machine Observatory — the field journal of the machine economy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The unfurl is the first impression for a link-share audience — same ink,
// paper, phosphor, and amber as the page itself.
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0a0d12",
        color: "#e9e2d0",
        padding: 72,
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 22,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "#8ce99a",
          fontFamily: "monospace",
        }}
      >
        Machine Observatory · est. 2026 · Base
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 74,
          lineHeight: 1.06,
          letterSpacing: -1,
        }}
      >
        <span>AI agents are paying</span>
        <span>each other right now.</span>
        <span style={{ display: "flex" }}>
          Somebody should be
          <span
            style={{ color: "#e2a65c", fontStyle: "italic", marginLeft: 20 }}
          >
            watching.
          </span>
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "monospace",
          fontSize: 20,
          color: "#a89f8a",
        }}
      >
        <span>the field journal of the machine economy</span>
        <span>x402 · ERC-8004 · Base</span>
      </div>
    </div>,
    { ...size },
  );
}
