import styled from "styled-components";
import { ProfileName } from "../layout/Sidebar";
import { formatTimestamp } from "../../api/rooms";
import { useOpenUserPreview } from "../../hooks/useOpenUserPreview";

const PanelEmptyState = styled.div`
  display: grid;
  flex: 1;
  place-items: center;
  color: var(--color-text-muted);
`;

const RoomContentScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageItemRoot = styled.article`
  display: flex;
  gap: 10px;
  padding: 8px;

  &:hover {
    background: var(--color-surface-hover);
  }
`;

const MessageAvatar = styled.div`
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border: 1px solid var(--color-text);
  border-radius: 50%;
  place-items: center;
  cursor: pointer;
`;

const MessageBody = styled.div`
  min-width: 0;
`;

const MessageMeta = styled.div`
  display: flex;
  gap: 8px;
  align-items: baseline;

  time {
    font-size: 0.8rem;
  }
`;

const MessageContent = styled.p`
  margin: 4px 0 0;
  overflow-wrap: anywhere;
`;

function RoomContent({ roomChat, state, roomName, isDm }) {
  return (
    <>
      {state === "loading" && (
        <PanelEmptyState>
          <p>Loading chat...</p>
        </PanelEmptyState>
      )}

      {state === "success" && (
        <RoomContentScroll>
          <MessageList>
            {roomChat.length === 0 ? (
              <PanelEmptyState>
                <p>{isDm ? `Say hello to ${roomName}!` : `Say Hello to #${roomName}!`}</p>
              </PanelEmptyState>
            ) : (
              roomChat.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))
            )}
          </MessageList>
        </RoomContentScroll>
      )}

      {state === "error" && (
        <PanelEmptyState>
          <p>Error loading chat.</p>
        </PanelEmptyState>
      )}
    </>
  );
}

function MessageItem({ message }) {
  const openPreview = useOpenUserPreview();
  const canPreview = Boolean(message.sender_username);

  return (
    <MessageItemRoot>
      <MessageAvatar onClick={canPreview ? openPreview(message.sender_username) : undefined}>
        {message.sender_username?.[0] ?? "?"}
      </MessageAvatar>

      <MessageBody>
        <MessageMeta>
          <ProfileName
            onClick={canPreview ? openPreview(message.sender_username) : undefined}
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