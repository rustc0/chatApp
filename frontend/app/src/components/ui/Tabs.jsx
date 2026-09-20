import styled from "styled-components";

export const TabList = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
`;

export const Tab = styled.button`
  position: relative;
  border: 0;
  background: transparent;
  padding: var(--space-3) var(--space-1);
  color: ${({ $active }) => ($active ? "var(--text-primary)" : "var(--text-secondary)")};
  font-size: var(--text-md);
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  transition: color var(--dur-fast) var(--ease);

  &:hover {
    color: var(--text-primary);
  }

  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 2px;
    border-radius: var(--radius-pill);
    background: ${({ $active }) => ($active ? "var(--accent-500)" : "transparent")};
    transition: background var(--dur-fast) var(--ease);
  }
`;

export default Tab;
