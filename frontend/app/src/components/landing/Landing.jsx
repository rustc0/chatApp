import styled from "styled-components";
import { Link } from "react-router-dom";
import { Button } from "../ui";
import Hero from "./Hero";
import Features from "./Features";
import { Page, Container, Section, SectionTitle, SectionLead } from "./styles";

const Nav = styled.nav`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) 0;
`;

const Brand = styled(Link)`
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--accent-500);
  text-decoration: none;
  white-space: nowrap;

  /* The name is long; ease off the tracking before it crowds the nav button. */
  @media (max-width: 480px) {
    font-size: var(--text-xs);
    letter-spacing: 0.1em;
  }
`;

const Closing = styled(Section)`
  text-align: center;
  border-top: 1px solid var(--border-subtle);
`;

const ClosingLead = styled(SectionLead)`
  margin: var(--space-3) auto 0;
`;

const ClosingActions = styled.div`
  margin-top: var(--space-6);
`;

const Footer = styled.footer`
  margin-top: auto;
  padding: var(--space-5) 0;
  border-top: 1px solid var(--border-subtle);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  text-align: center;
`;

function Landing({ isAuth }) {
  const target = isAuth ? "/app" : "/auth";
  const label = isAuth ? "Open app" : "Create an account";

  return (
    <Page>
      <Container>
        <Nav>
          <Brand to="/">FT_TRANSCENDENCE</Brand>
          <Button as={Link} to={target} $variant="secondary" $size="sm">
            {isAuth ? "Open app" : "Sign in"}
          </Button>
        </Nav>
      </Container>

      <Hero isAuth={isAuth} />

      <Features />

      <Closing>
        <Container>
          <SectionTitle>Ready when you are</SectionTitle>
          <ClosingLead>
            It takes about a minute to set up. Pick a name, and start talking.
          </ClosingLead>
          <ClosingActions>
            <Button as={Link} to={target} $size="md">
              {label}
            </Button>
          </ClosingActions>
        </Container>
      </Closing>

      <Footer>
        <Container>CHATAPP — Built for ft_transcendence</Container>
      </Footer>
    </Page>
  );
}

export default Landing;
