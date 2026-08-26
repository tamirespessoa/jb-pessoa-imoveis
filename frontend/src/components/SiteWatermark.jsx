import logo from "../assets/logo-jb.png";

export default function SiteWatermark({
  size = "24%",
  opacity = 0.38,
  center = false,
}) {
  return (
    <img
      src={logo}
      alt=""
      aria-hidden="true"
      draggable="false"
      style={{
        position: "absolute",

        ...(center
          ? {
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }
          : {
              right: "18px",
              bottom: "18px",
            }),

        zIndex: 20,
        width: size,
        minWidth: "80px",
        maxWidth: "220px",
        maxHeight: "40%",
        height: "auto",
        objectFit: "contain",
        opacity: opacity,
        pointerEvents: "none",
        userSelect: "none",
        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.28))",
      }}
    />
  );
}