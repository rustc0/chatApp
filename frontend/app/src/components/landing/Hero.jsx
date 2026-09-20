import styled from "styled-components";
import { Link } from "react-router-dom";
import { TbArrowRight } from "react-icons/tb";
import { Button } from "../ui";
import { Container, Eyebrow, drift, entrance } from "./styles";

const Wrapper = styled.header`
  position: relative;
  padding: 104px 0 88px;
  text-align: center;
  isolation: isolate;

  /* Same crimson glow the auth page uses, so the two pre-auth surfaces match. */
  &::before {
    content: "";
    position: absolute;
    inset: -20% -10% 0;
    z-index: -1;
    pointer-events: none;
    background: radial-gradient(
      900px circle at 50% 0%,
      var(--accent-soft),
      transparent 62%
    );
    animation: ${drift} 9s ease-in-out infinite;
  }

  @media (max-width: 700px) {
    padding: 72px 0 56px;
  }
`;

const Title = styled.h1`
  font-size: 58px;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.05;
  color: var(--text-primary);
  margin: var(--space-4) 0 0;
  ${entrance(60)}

  @media (max-width: 700px) {
    font-size: 36px;
  }
`;

const Accent = styled.span`
  color: var(--accent-500);
`;

const Tagline = styled.p`
  font-size: var(--text-lg);
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 54ch;
  margin: var(--space-5) auto 0;
  ${entrance(140)}

  @media (max-width: 700px) {
    font-size: var(--text-md);
    margin-top: var(--space-4);
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-6);
  ${entrance(220)}
`;

const Eyebrows = styled.div`
  ${entrance(0)}
`;

function Hero({ isAuth }) {
  return (
    <Wrapper>
      <Container>
        <Eyebrows>
          <Eyebrow>FT_TRANSCENDENCE</Eyebrow>
        </Eyebrows>

        <Title>
          Conversations that
          <br />
          keep <Accent>up with you</Accent>
        </Title>

        <Tagline>
          Direct messages, group rooms and live presence in one fast, focused
          space. No noise, no clutter — just the people you actually talk to.
        </Tagline>

        <Actions>
          <Button as={Link} to={isAuth ? "/app" : "/auth"} $size="md">
            {isAuth ? "Open app" : "Get started"}
            <TbArrowRight size={16} />
          </Button>

          {!isAuth && (
            <Button as={Link} to="/auth" $variant="secondary" $size="md">
              Sign in
            </Button>
          )}
        </Actions>
      </Container>
    </Wrapper>
  );
}

export default Hero;
