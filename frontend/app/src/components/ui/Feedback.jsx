import styled, { keyframes } from "styled-components";

export const StatusText = styled.p`
  margin: var(--space-2) 0 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
`;

export const InlineError = styled.p`
  margin: var(--space-2) 0 0;
  color: var(--danger);
  font-size: var(--text-sm);
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const Spinner = styled.span`
  display: inline-block;
  width: ${({ $size = 16 }) => `${$size}px`};
  height: ${({ $size = 16 }) => `${$size}px`};
  border: 2px solid var(--border-strong);
  border-top-color: var(--accent-500);
  border-radius: 50%;
  animation: ${spin} 700ms linear infinite;
`;

const EmptyStateRoot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-4);
  text-align: center;
  color: var(--text-secondary);

  svg {
    color: var(--text-tertiary);
    opacity: 0.6;
  }
`;

const EmptyTitle = styled.p`
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-md);
  font-weight: 600;
`;

const EmptyHint = styled.p`
  margin: 0;
  max-width: 32ch;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
`;

/** Centered empty placeholder: a large muted icon, a title and an optional hint. */
export function EmptyState({ icon: Icon, title, hint, ...rest }) {
  return (
    <EmptyStateRoot {...rest}>
      {Icon && <Icon size={32} />}
      {title && <EmptyTitle>{title}</EmptyTitle>}
      {hint && <EmptyHint>{hint}</EmptyHint>}
    </EmptyStateRoot>
  );
}

export default EmptyState;
