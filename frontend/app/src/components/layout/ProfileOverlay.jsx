import styled from "styled-components";
import { TbMessageCirclePlus } from "react-icons/tb";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
  padding: 4vh 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  z-index: 9999;
`;

const Card = styled.div`
  position: relative;
  width: 640px;
  max-width: 90vw;
  min-height: 85vh;
  background: var(--color-bg);
  border: 1px solid var(--color-surface-hover);
  border-radius: 20px;
  overflow: hidden;
  color: var(--color-text);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
`;

const Banner = styled.div`
  height: 160px;
  background: color-mix(in srgb, var(--color-bg) 75%, black);
  border-bottom: 1px solid var(--color-surface-hover);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.55);
  }
`;

const Content = styled.div`
  padding: 0 2rem 2rem;
`;

const Avatar = styled.img`
  width: 128px;
  height: 128px;
  border-radius: 50%;
  object-fit: cover;
  border: 5px solid var(--color-bg);
  margin-top: -64px;
  background: var(--color-bg);
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  gap: 1rem;
`;

const NameBlock = styled.div`
  min-width: 0;
`;

const Username = styled.h2`
  margin: 0;
  font-size: 1.4rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Handle = styled.span`
  display: block;
  margin-top: 2px;
  font-size: 0.9rem;
  color: var(--color-text-muted);
`;

const DMButton = styled.button`
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-surface-hover);
  border-radius: 50%;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  &:active {
    transform: scale(0.97);
  }
`;

const Divider = styled.div`
  margin-top: 1.25rem;
  border-top: 1px solid var(--color-surface-hover);
`;

const Bio = styled.p`
  margin: 0;
  padding-top: 1.25rem;
  line-height: 1.5;
  color: var(--color-text);
`;

const StatsRow = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-surface-hover);
`;

const Stat = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
`;

const StatValue = styled.span`
  font-weight: 700;
  color: var(--color-text);
`;

const StatLabel = styled.span`
  font-size: 0.85rem;
  color: var(--color-text-muted);
`;

export default function ProfileOverlay({ user, onClose }) {
  return (
    <Overlay onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        <Banner />
        <CloseButton onClick={onClose} aria-label="Close">
          ✕
        </CloseButton>

        <Content>
          <Avatar src={user.avatar} alt="" />

          <HeaderRow>
            <NameBlock>
              <Username>{user.displayName}</Username>
              {user.username && <Handle>@{user.username}</Handle>}
            </NameBlock>
            <DMButton aria-label="Send DM">
              <TbMessageCirclePlus size={20} />
            </DMButton>
          </HeaderRow>

          <Divider />

          <Bio>{user.bio}</Bio>

          {(user.postsCount || user.rooms || user.connections) && (
            <StatsRow>
              {user.postsCount != null && (
                <Stat>
                  <StatValue>{user.postsCount}</StatValue>
                  <StatLabel>Posts</StatLabel>
                </Stat>
              )}
              {user.rooms != null && (
                <Stat>
                  <StatValue>{user.rooms}</StatValue>
                  <StatLabel>Rooms</StatLabel>
                </Stat>
              )}
              {user.connections != null && (
                <Stat>
                  <StatValue>{user.connections}</StatValue>
                  <StatLabel>Connections</StatLabel>
                </Stat>
              )}
              {user.following != null && (
                <Stat>
                  <StatValue>{user.following}</StatValue>
                  <StatLabel>Following</StatLabel>
                </Stat>
              )}
            </StatsRow>
          )}
        </Content>
      </Card>
    </Overlay>
  );
}