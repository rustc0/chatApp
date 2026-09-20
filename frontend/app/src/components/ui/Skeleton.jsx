import styled, { keyframes } from "styled-components";

const pulse = keyframes`
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.45;
  }
`;

const Skeleton = styled.span`
  display: block;
  border-radius: var(--radius-sm);
  background: var(--bg-hover);
  animation: ${pulse} 1.5s infinite ease-in-out;
`;

export default Skeleton;
