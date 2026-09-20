import styled, { keyframes, css } from "styled-components";

// Hero entrance. Base styles stay at opacity 1, so when the global
// prefers-reduced-motion block collapses the duration the content simply
// appears instead of vanishing.
export const rise = keyframes`
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Slow drift on the crimson glow behind the hero.
export const drift = keyframes`
  0%, 100% {
    opacity: 0.75;
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate3d(0, 2%, 0) scale(1.08);
  }
`;

export const entrance = (delay = 0) => css`
  animation: ${rise} 520ms var(--ease) both;
  animation-delay: ${delay}ms;
`;

export const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);
  overflow-x: hidden;
`;

export const Container = styled.div`
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 var(--space-5);
`;

export const Section = styled.section`
  padding: 96px 0;

  @media (max-width: 700px) {
    padding: 64px 0;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin: 0 0 var(--space-3);

  @media (max-width: 700px) {
    font-size: 24px;
  }
`;

export const SectionLead = styled.p`
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0;
  max-width: 52ch;

  @media (max-width: 700px) {
    font-size: var(--text-md);
  }
`;

export const Eyebrow = styled.span`
  display: inline-block;
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent-500);
`;
