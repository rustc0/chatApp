import styled from "styled-components";
import { TbAlertTriangle, TbMessage2 } from "react-icons/tb";
import { ProfileName } from "../layout/Sidebar";
import { formatTimestamp } from "../../api/rooms";
import { useOpenUserPreview } from "../../hooks/useOpenUserPreview";
import { Avatar, EmptyState, Spinner } from "../ui";

const PanelCenter = styled.div`
  display: grid;
  flex: 1;
  place-items: center;
  color: var(--text-secondary);
`;

const RoomContentScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-4);
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const MessageItemRoot = styled.article`
  display: flex;
  gap: 10px;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  transition: background var(--dur-fast) var(--ease);

  &:hover {
    background: var(--bg-surface);
  }
`;

const MessageAvatarWrap = styled.div`
  flex: 0 0 36px;
  cursor: pointer;
`;

const MessageBody = styled.div`
  min-width: 0;
`;

const MessageMeta = styled.div`
  display: flex;
  gap: var(--space-2);
  align-items: baseline;

  time {
    color: var(--text-tertiary);
    font-size: var(--text-xs);
  }
`;

const MessageContent = styled.p`
  margin: var(--space-1) 0 0;
  color: var(--text-primary);
  overflow-wrap: anywhere;
`;

function RoomContent({ roomChat, state, roomName, isDm }) {
  return (
    <>
      {state === "loading" && (
        <PanelCenter>
          <Spinner $size={24} aria-label="Loading chat" />
        </PanelCenter>
      )}

      {state === "success" && (
        <RoomContentScroll>
          {roomChat.length === 0 ? (
            <EmptyState
              icon={TbMessage2}
              title={isDm ? `Say hello to ${roomName}!` : `Say hello to #${roomName}!`}
              hint="No messages here yet — be the first to write one."
            />
          ) : (
            <MessageList>
              {roomChat.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}
            </MessageList>
          )}
        </RoomContentScroll>
      )}

      {state === "error" && (
        <PanelCenter>
          <EmptyState
            icon={TbAlertTriangle}
            title="Error loading chat."
            hint="Something went wrong fetching these messages."
          />
        </PanelCenter>
      )}
    </>
  );
}

function MessageItem({ message }) {
  const openPreview = useOpenUserPreview();
  const sender = { id: message.sender_id, username: message.sender_username };
  const canPreview = Boolean(sender.id);

  return (
    <MessageItemRoot>
      <MessageAvatarWrap onClick={canPreview ? openPreview(sender) : undefined}>
        <Avatar name={message.sender_username} $size={36} />
      </MessageAvatarWrap>

      <MessageBody>
        <MessageMeta>
          <ProfileName
            onClick={canPreview ? openPreview(sender) : undefined}
            style={canPreview ? { cursor: "pointer" } : undefined}
          >
            {message.sender_username ?? "Unknown user"}
          </ProfileName>
          <time>{formatTimestamp(message.sent_at)}</time>
        </MessageMeta>

        <MessageContent>{message.content}</MessageContent>
      </MessageBody>
    </MessageItemRoot>
  );
}

export default RoomContent;
