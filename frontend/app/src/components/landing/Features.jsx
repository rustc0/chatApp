import styled from "styled-components";
import {
  TbMessageCircle,
  TbUsersGroup,
  TbUserCircle,
  TbBolt,
} from "react-icons/tb";
import { Card } from "../ui";
import { useInView } from "../../hooks/useInView";
import { Container, Section, SectionTitle, SectionLead, Eyebrow } from "./styles";

const FEATURES = [
  {
    icon: TbMessageCircle,
    title: "Direct messages",
    body: "One-to-one threads that stay in sync across every tab and device you have open.",
  },
  {
    icon: TbUsersGroup,
    title: "Rooms",
    body: "Spin up a room for a team, a project or a group of friends, and bring the right people in.",
  },
  {
    icon: TbUserCircle,
    title: "Profiles & friends",
    body: "Avatars, profiles and a friends list, so you always know who you are talking to.",
  },
  {
    icon: TbBolt,
    title: "Live presence",
    body: "See who is online the moment they arrive — messages land instantly, no refresh needed.",
  },
];

const Head = styled.div`
  margin-bottom: var(--space-6);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
`;

const Tile = styled(Card)`
  padding: var(--space-5);
  /* Card animates itself in on mount; here the reveal is scroll-driven. */
  animation: none;
  box-shadow: var(--shadow-md);
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? "0" : "16px")});
  transition:
    opacity 520ms var(--ease),
    transform 520ms var(--ease),
    border-color var(--dur) var(--ease);
  transition-delay: ${({ $delay }) => $delay}ms;

  &:hover {
    border-color: var(--border-strong);
  }
`;

const IconBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  color: var(--accent-400);
  margin-bottom: var(--space-4);
`;

const TileTitle = styled.h3`
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-2);
`;

const TileBody = styled.p`
  font-size: var(--text-md);
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
`;

function Features() {
  const [ref, inView] = useInView();

  return (
    <Section>
      <Container>
        <Head>
          <Eyebrow>What you get</Eyebrow>
          <SectionTitle>Everything a chat should do, and nothing it shouldn&apos;t</SectionTitle>
          <SectionLead>
            A small set of things, done properly — so the app gets out of the way
            and the conversation does the talking.
          </SectionLead>
        </Head>

        <Grid ref={ref}>
          {FEATURES.map(({ icon: Icon, title, body }, index) => (
            <Tile key={title} $visible={inView} $delay={index * 90}>
              <IconBadge>
                <Icon size={20} />
              </IconBadge>
              <TileTitle>{title}</TileTitle>
              <TileBody>{body}</TileBody>
            </Tile>
          ))}
        </Grid>
      </Container>
    </Section>
  );
}

export default Features;
