import styled from "styled-components";

/**
 * Icon-only button. Always pass an `aria-label` (or `title`) at the call site —
 * there is no text for a screen reader to fall back on.
 */
const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${({ $size = 32 }) => `${$size}px`};
  height: ${({ $size = 32 }) => `${$size}px`};
  border: 1px solid transparent;
  border-radius: ${({ $round }) => ($round ? "50%" : "var(--radius-sm)")};
  background: transparent;
  color: ${({ $danger }) => ($danger ? "var(--danger)" : "var(--text-secondary)")};
  transition:
    background var(--dur-fast) var(--ease),
    border-color var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease);

  &:hover:not(:disabled) {
    background: ${({ $danger }) =>
      $danger ? "rgba(229, 72, 77, 0.14)" : "var(--accent-soft)"};
    color: ${({ $danger }) => ($danger ? "var(--danger)" : "var(--accent-400)")};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export default IconButton;
