import { useProfileOverlay } from "../components/layout/ProfileOverlayContext";

/** openPreview({ id, username }) -> click handler. The popover loads by id. */
export function useOpenUserPreview() {
  const { openUserPreview } = useProfileOverlay();

  return (person) => (e) => {
    if (!person?.id) return;

    e.stopPropagation();
    openUserPreview(person, e.currentTarget.getBoundingClientRect());
  };
}
