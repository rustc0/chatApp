import styled from "styled-components";

/** Presence dot. `$ring` is the surrounding surface color, for the cut-out effect. */
const StatusDot = styled.span`
  display: block;
  flex-shrink: 0;
  width: ${({ $size = 9 }) => `${$size}px`};
  height: ${({ $size = 9 }) => `${$size}px`};
  border-radius: 50%;
  background: ${({ $online }) => ($online ? "var(--online)" : "var(--offline)")};
  box-shadow: ${({ $ring }) => ($ring ? `0 0 0 2px ${$ring}` : "none")};
  transition: background var(--dur-fast) var(--ease);
`;

export default StatusDot;
