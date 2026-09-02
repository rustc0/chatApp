import { useEffect, useState } from "react";
import { getAvatarBlob } from "../api/profile";

export function useAvatarUrl(avatarFile) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    if (!avatarFile) {
      setAvatarUrl(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    getAvatarBlob(avatarFile)
      .then((blob) => {
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setAvatarUrl(objectUrl);
      })
      .catch((error) => {
        console.error("Failed to load avatar:", error);

        if (!cancelled) {
          setAvatarUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [avatarFile]);

  return { avatarUrl, loading };
}
