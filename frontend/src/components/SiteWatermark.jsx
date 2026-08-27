import watermarkLogo from "../assets/logo-jb-watermark.png";

export default function SiteWatermark({
  size = "30%",
  opacity = 0.30,
}) {
  return (
    <img
      src={watermarkLogo}
      alt=""
      aria-hidden="true"
      draggable="false"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 20,
        width: size,
        minWidth: "100px",
        maxWidth: "260px",
        maxHeight: "46%",
        height: "auto",
        objectFit: "contain",
        opacity,
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
}
