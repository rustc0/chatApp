import styled, { css } from "styled-components";

const fieldStyles = css`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid
    ${({ $invalid }) => ($invalid ? "var(--danger)" : "var(--border-strong)")};
  border-radius: var(--radius-md);
  background: var(--bg-base);
  color: var(--text-primary);
  transition:
    border-color var(--dur-fast) var(--ease),
    box-shadow var(--dur-fast) var(--ease);

  &::placeholder {
    color: var(--text-tertiary);
  }

  &:hover:not(:disabled) {
    border-color: var(--text-tertiary);
  }

  &:focus {
    outline: none;
    border-color: var(--accent-500);
    box-shadow: 0 0 0 3px var(--accent-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  ${fieldStyles}
`;

export const TextArea = styled.textarea`
  ${fieldStyles}
  resize: vertical;
  min-height: 84px;
  line-height: 1.5;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

export const FieldError = styled.p`
  margin: 0;
  color: var(--danger);
  font-size: var(--text-sm);
`;

export default Input;
