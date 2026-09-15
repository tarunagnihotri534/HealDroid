import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "9px",
          fontFamily: "serif",
          fontStyle: "italic",
          fontWeight: 700,
        }}
      >
        H
      </div>
    ),
    {
      ...size,
    }
  );
}
