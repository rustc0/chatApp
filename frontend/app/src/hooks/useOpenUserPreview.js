import { useProfileOverlay } from "../components/layout/ProfileOverlayContext";

export function useOpenUserPreview() {
  const { openUserPreview } = useProfileOverlay();

  return (username) => (e) => {
    if (!username) return;

    e.stopPropagation();
    openUserPreview(username, e.currentTarget.getBoundingClientRect());
  };
}
