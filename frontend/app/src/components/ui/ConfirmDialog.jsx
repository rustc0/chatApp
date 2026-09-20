import styled from "styled-components";
import Button from "./Button";
import { fadeIn, riseIn } from "./Card";

const Backdrop = styled.div`
  position: ${({ $position = "fixed" }) => $position};
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  animation: ${fadeIn} var(--dur) var(--ease);
`;

const Dialog = styled.div`
  width: min(92vw, 380px);
  padding: var(--space-5);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-lg);
  animation: ${riseIn} var(--dur) var(--ease);
`;

const Title = styled.h4`
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-lg);
`;

const Text = styled.p`
  margin: var(--space-3) 0 var(--space-4);
  color: var(--text-secondary);
  font-size: var(--text-md);
  line-height: 1.5;
`;

const ErrorText = styled.p`
  margin: 0 0 var(--space-4);
  color: var(--danger);
  font-size: var(--text-sm);
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
`;

/**
 * Styled replacement for `window.confirm`. Renders nothing when `open` is false.
 * `position` is "absolute" when nested inside an already-positioned overlay.
 */
function ConfirmDialog({
  open,
  title,
  text,
  error,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busyLabel = "Applying...",
  danger = true,
  busy = false,
  position = "fixed",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <Backdrop $position={position} onClick={onCancel}>
      <Dialog
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <Title>{title}</Title>
        {text && <Text>{text}</Text>}
        {error && <ErrorText>{error}</ErrorText>}

        <Actions>
          <Button
            type="button"
            $variant="secondary"
            $size="sm"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            $variant={danger ? "danger" : "primary"}
            $size="sm"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? busyLabel : confirmLabel}
          </Button>
        </Actions>
      </Dialog>
    </Backdrop>
  );
}

export default ConfirmDialog;
