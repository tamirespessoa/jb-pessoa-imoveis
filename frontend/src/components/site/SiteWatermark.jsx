export default function SiteWatermark({
  size = "24%",
  opacity = 0.34
}) {
  return (
    <img
      src="/logo-jb.png"
      alt=""
      aria-hidden="true"
      draggable="false"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
      style={{
        position: "absolute",
        right: "18px",
        bottom: "18px",
        zIndex: 5,
        width: size,
        maxWidth: "220px",
        minWidth: "70px",
        height: "auto",
        objectFit: "contain",
        opacity,
        pointerEvents: "none",
        userSelect: "none",
        filter: "drop-shadow(0 2px 8px rgba(0,0,0,.28))"
      }}
    />
  );
}
