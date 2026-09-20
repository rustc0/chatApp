import styled, { css } from "styled-components";

const variants = {
  primary: css`
    border: 1px solid var(--accent-500);
    background: var(--accent-500);
    color: var(--accent-fg);

    &:hover:not(:disabled) {
      border-color: var(--accent-400);
      background: var(--accent-400);
    }
  `,
  secondary: css`
    border: 1px solid var(--border-strong);
    background: transparent;
    color: var(--text-primary);

    &:hover:not(:disabled) {
      border-color: var(--accent-500);
      background: var(--accent-soft);
      color: var(--accent-400);
    }
  `,
  ghost: css`
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-secondary);

    &:hover:not(:disabled) {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
  `,
  danger: css`
    border: 1px solid var(--danger);
    background: var(--danger);
    color: var(--accent-fg);

    &:hover:not(:disabled) {
      filter: saturate(1.2);
    }
  `,
};

const sizes = {
  sm: css`
    padding: 6px 10px;
    font-size: var(--text-sm);
  `,
  md: css`
    padding: 10px 14px;
    font-size: var(--text-md);
  `,
};

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: ${({ $full }) => ($full ? "100%" : "auto")};
  border-radius: ${({ $pill }) => ($pill ? "var(--radius-pill)" : "var(--radius-md)")};
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  /* Keeps the UA underline off when rendered as a link via the as prop. */
  text-decoration: none;
  transition:
    background var(--dur-fast) var(--ease),
    border-color var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);

  ${({ $size = "md" }) => sizes[$size] ?? sizes.md}
  ${({ $variant = "primary" }) => variants[$variant] ?? variants.primary}

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    flex-shrink: 0;
  }
`;

export default Button;
