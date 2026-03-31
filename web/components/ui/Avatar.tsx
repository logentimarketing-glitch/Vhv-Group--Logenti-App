type AvatarProps = {
  src?: string;
  alt?: string;
  fallback?: string;
};

export function Avatar({ src, alt = "Avatar", fallback = "U" }: AvatarProps) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "999px",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, #0f766e, #49b0a4)",
        color: "#fff",
        fontWeight: 800,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        fallback
      )}
    </div>
  );
}
