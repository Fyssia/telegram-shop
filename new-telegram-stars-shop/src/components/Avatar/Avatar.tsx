import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

function isValidUsername(u: string) {
  const v = u.trim().replace(/^@/, "").toLowerCase();
  return /^[a-z0-9_]{5,32}$/.test(v);
}

function pickHue(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

type CheckStatus =
  | "idle"
  | "typing"
  | "checking"
  | "valid"
  | "invalid"
  | "not_found"
  | "bot"
  | "not_a_user"
  | "error";

export function UsernameBadge({
  username,
  status,
  displayName,
  avatarUrl,
  size = 36,
}: {
  username: string;
  status: CheckStatus;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: number;
}) {
  const normalized = useMemo(
    () => username.trim().replace(/^@/, "").toLowerCase(),
    [username],
  );

  const showOnlyAt =
    !normalized || !isValidUsername(username) || status === "invalid";

  const cleanDisplayName = useMemo(() => {
    const base = (displayName ?? "").trim();
    return base.replace(/^@+/, "");
  }, [displayName]);

  const letter = useMemo(() => {
    const fromUsername = normalized[0];
    const fromDisplayName = cleanDisplayName[0];
    return (fromUsername || fromDisplayName || "@").toUpperCase();
  }, [cleanDisplayName, normalized]);

  const bg = useMemo(() => {
    const hue = pickHue(normalized || "seed");
    return `hsl(${hue} 70% 45%)`;
  }, [normalized]);

  const [imgBroken, setImgBroken] = useState(false);
  useEffect(() => {
    // Reset broken state when backend returns a new avatar URL.
    void avatarUrl;
    setImgBroken(false);
  }, [avatarUrl]);

  // 1) Пусто/невалидно -> только @
  if (showOnlyAt) return <span>@</span>;

  // 2) USER найден -> фото если доступно, иначе кружок
  const cleanAvatarUrl = avatarUrl?.trim() || null;
  const avatarSrc = status === "valid" && !imgBroken ? cleanAvatarUrl : null;

  if (avatarSrc) {
    return (
      <Image
        src={avatarSrc}
        width={size}
        height={size}
        alt={cleanDisplayName || normalized}
        onLoad={(event) => {
          const img = event.currentTarget;
          if (img.naturalWidth <= 1 && img.naturalHeight <= 1) {
            setImgBroken(true);
          }
        }}
        onError={() => setImgBroken(true)}
        style={{ borderRadius: 9999 }}
        unoptimized
      />
    );
  }

  // кружок показываем только если это USER (valid)
  if (status === "valid") {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 9999,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.max(12, Math.round(size * 0.5)),
          fontWeight: 700,
          color: "#fff",
          userSelect: "none",
        }}
        title={cleanDisplayName || normalized}
      >
        {letter}
      </div>
    );
  }

  return <span>@</span>;
}
