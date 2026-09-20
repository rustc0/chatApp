import styled from "styled-components";
import { useOpenUserPreview } from "../../hooks/useOpenUserPreview";
import { useRoomNavigation } from "../layout/RoomNavigationContext";
import { Avatar, StatusDot } from "../ui";

const DmItemRoot = styled.li`
  display: flex;
  width: 100%;
  min-width: 0;
`;

const DmItemButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  padding: 10px;
  background: transparent;
  color: var(--text-primary);
  text-align: left;
  transition: background var(--dur-fast) var(--ease);

  &:hover {
    background: var(--bg-hover);
  }
`;

const DmAvatarWrap = styled.span`
  position: relative;
  display: block;
  flex-shrink: 0;
  cursor: pointer;
`;

const DmStatus = styled(StatusDot)`
  position: absolute;
  right: -1px;
  bottom: -1px;
`;

const DmDetails = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--text-primary);
    font-weight: 600;
    cursor: pointer;
    width: fit-content;

    &:hover {
      color: var(--accent-400);
    }
  }

  span {
    color: var(--text-secondary);
    font-size: var(--text-sm);
  }
`;

const DmTimestamp = styled.time`
  align-self: flex-start;
  flex-shrink: 0;
  color: var(--text-tertiary);
  font-size: var(--text-xs);
`;

function DmItem({ conversation }) {
  const openPreview = useOpenUserPreview();
  const { navigateToRoom } = useRoomNavigation();
  const peer = { id: conversation.userId, username: conversation.username };

  function openConversation() {
    navigateToRoom({
      id: conversation.id,
      name: null,
      type: "dm",
      peer: {
        id: conversation.userId,
        username: conversation.username,
        status: conversation.status,
      },
    });
  }

  return (
    <DmItemRoot>
      <DmItemButton type="button" onClick={openConversation}>
        <DmAvatarWrap onClick={openPreview(peer)}>
          <Avatar name={conversation.username} $size={44} />
          <DmStatus
            $online={conversation.status === "online"}
            $size={13}
            $ring="var(--bg-surface)"
            aria-label={conversation.status}
          />
        </DmAvatarWrap>

        <DmDetails>
          <strong onClick={openPreview(peer)}>{conversation.username}</strong>
          <span>
            {conversation.lastMessage.length < 42
              ? conversation.lastMessage
              : `${conversation.lastMessage.substring(0, 39)}...`}
          </span>
        </DmDetails>

        <DmTimestamp>{conversation.timestamp}</DmTimestamp>
      </DmItemButton>
    </DmItemRoot>
  );
}

export default DmItem;
