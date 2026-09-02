import { useEffect, useState } from "react";
import styled from "styled-components";
import { TbCheck, TbSend, TbUserCheck, TbUserPlus, TbX } from "react-icons/tb";

import { useAvatarUrl } from "../../hooks/useAvatarUrl";
import { useRoomNavigation } from "../layout/RoomNavigationContext";
import { getUserByUsername } from "../../api/profile";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  sendFriendRequest,
} from "../../api/friends";
import { getOrCreateDm } from "../../api/rooms";
import { sendMessage } from "../../api/messages";

const POPOVER_WIDTH = 320;
const POPOVER_MARGIN = 12;

function clampPosition(anchorRect) {
  if (!anchorRect) {
    return { top: 80, left: 80 };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = anchorRect.left;
  if (left + POPOVER_WIDTH + POPOVER_MARGIN > viewportWidth) {
    left = viewportWidth - POPOVER_WIDTH - POPOVER_MARGIN;
  }
  left = Math.max(POPOVER_MARGIN, left);

  let top = anchorRect.bottom + 8;
  const estimatedHeight = 340;
  if (top + estimatedHeight > viewportHeight) {
    top = Math.max(POPOVER_MARGIN, anchorRect.top - estimatedHeight - 8);
  }

  return { top, left };
}

export default function ProfilePreviewPopover({ target, onClose }) {
  const { navigateToRoom } = useRoomNavigation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [messageDraft, setMessageDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [runningAction, setRunningAction] = useState(false);

  const { avatarUrl, loading: avatarLoading } = useAvatarUrl(user?.avatar);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");
    setUser(null);

    getUserByUsername(target.username)
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Failed to load profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [target.username]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleAddFriend = async () => {
    setRunningAction(true);
    setActionError("");

    try {
      await sendFriendRequest(user.id);
      setUser((u) => ({ ...u, friendship_status: "pending_outgoing" }));
    } catch (err) {
      setActionError(err?.message || "Failed to send friend request.");
    } finally {
      setRunningAction(false);
    }
  };

  const handleCancelRequest = async () => {
    setRunningAction(true);
    setActionError("");

    try {
      await cancelFriendRequest(user.friendship_id);
      setUser((u) => ({ ...u, friendship_status: "none", friendship_id: null }));
    } catch (err) {
      setActionError(err?.message || "Failed to cancel friend request.");
    } finally {
      setRunningAction(false);
    }
  };

  const handleAccept = async () => {
    setRunningAction(true);
    setActionError("");

    try {
      await acceptFriendRequest(user.friendship_id);
      setUser((u) => ({ ...u, friendship_status: "friends" }));
    } catch (err) {
      setActionError(err?.message || "Failed to accept friend request.");
    } finally {
      setRunningAction(false);
    }
  };

  const handleDecline = async () => {
    setRunningAction(true);
    setActionError("");

    try {
      await declineFriendRequest(user.friendship_id);
      setUser((u) => ({ ...u, friendship_status: "none", friendship_id: null }));
    } catch (err) {
      setActionError(err?.message || "Failed to decline friend request.");
    } finally {
      setRunningAction(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const content = messageDraft.trim();
    if (!content || sending) return;

    setSending(true);
    setActionError("");

    try {
      const room = await getOrCreateDm(user.id);
      await sendMessage(room.id, content);
      navigateToRoom(room);
      onClose();
    } catch (err) {
      setActionError(err?.message || "Failed to send message.");
      setSending(false);
    }
  };

  const { top, left } = clampPosition(target.anchorRect);

  return (
    <Backdrop onClick={onClose}>
      <Card
        style={{ top, left }}
        onClick={(e) => e.stopPropagation()}
      >
        <Banner />

        <CloseButton onClick={onClose} aria-label="Close">
          <TbX size={16} />
        </CloseButton>

        {loading && <StatusText>Loading…</StatusText>}
        {error && <StatusText $error>{error}</StatusText>}

        {user && (
          <>
            <AvatarWrap>
              <AvatarCircle>
                {avatarLoading ? null : avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="" />
                ) : (
                  <AvatarFallback>
                    {(user.display_name || user.username)?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                )}
              </AvatarCircle>
            </AvatarWrap>

            <Content>
              <DisplayName>{user.display_name || user.username}</DisplayName>
              {user.username && <Handle>@{user.username}</Handle>}

              <Divider />

              <Bio>{user.bio || "No bio yet."}</Bio>

              {actionError && <ActionErrorText>{actionError}</ActionErrorText>}

              {user.friendship_status === "none" && (
                <ActionRow>
                  <PrimaryButton type="button" onClick={handleAddFriend} disabled={runningAction}>
                    <TbUserPlus size={16} />
                    Add Friend
                  </PrimaryButton>
                </ActionRow>
              )}

              {user.friendship_status === "pending_outgoing" && (
                <ActionRow>
                  <DisabledPill type="button" disabled>
                    <TbUserCheck size={16} />
                    Request Sent
                  </DisabledPill>

                  <IconButton
                    type="button"
                    onClick={handleCancelRequest}
                    disabled={runningAction}
                    aria-label="Cancel friend request"
                  >
                    <TbX size={16} />
                  </IconButton>
                </ActionRow>
              )}

              {user.friendship_status === "pending_incoming" && (
                <ActionRow>
                  <PrimaryButton type="button" onClick={handleAccept} disabled={runningAction}>
                    <TbCheck size={16} />
                    Accept
                  </PrimaryButton>

                  <IconButton
                    type="button"
                    onClick={handleDecline}
                    disabled={runningAction}
                    aria-label="Decline friend request"
                  >
                    <TbX size={16} />
                  </IconButton>
                </ActionRow>
              )}

              {user.friendship_status === "friends" && (
                <MessageForm onSubmit={handleSendMessage}>
                  <MessageInput
                    value={messageDraft}
                    onChange={(e) => setMessageDraft(e.target.value)}
                    placeholder={`Message @${user.username}`}
                    disabled={sending}
                  />

                  <SendButton type="submit" disabled={sending || !messageDraft.trim()} aria-label="Send message">
                    <TbSend size={16} />
                  </SendButton>
                </MessageForm>
              )}
            </Content>
          </>
        )}
      </Card>
    </Backdrop>
  );
}

// =============================================================================
// Styles
// =============================================================================

const Backdrop = styled.div`
  position: fixed;
  inset: 0;

  z-index: 9998;
`;

const Card = styled.div`
  position: fixed;

  width: ${POPOVER_WIDTH}px;

  background: var(--color-bg);

  border: 1px solid var(--color-surface-hover);
  border-radius: 14px;

  overflow: hidden;

  color: var(--color-text);

  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);

  z-index: 9999;
`;

const Banner = styled.div`
  height: 72px;

  background: color-mix(in srgb, var(--color-bg) 75%, black);

  border-bottom: 1px solid var(--color-surface-hover);
`;

const CloseButton = styled.button`
  position: absolute;

  top: 8px;
  right: 8px;

  width: 26px;
  height: 26px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(0, 0, 0, 0.35);

  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;

  color: #fff;

  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.55);
  }
`;

const StatusText = styled.p`
  margin: 0;
  padding: 1rem;

  font-size: 0.85rem;

  color: ${({ $error }) => ($error ? "var(--color-danger, #e5484d)" : "var(--color-text-muted)")};
`;

const AvatarWrap = styled.div`
  margin-top: -32px;
  margin-left: 16px;
`;

const AvatarCircle = styled.div`
  position: relative;

  width: 64px;
  height: 64px;

  border: 4px solid var(--color-bg);
  border-radius: 50%;

  overflow: hidden;

  background: var(--color-surface-hover);
`;

const AvatarImage = styled.img`
  position: absolute;
  inset: 0;

  width: 100%;
  height: 100%;

  object-fit: cover;
`;

const AvatarFallback = styled.span`
  position: absolute;
  inset: 0;

  display: grid;
  place-items: center;

  font-size: 1.35rem;
  font-weight: 700;

  color: var(--color-text-muted);
`;

const Content = styled.div`
  padding: 8px 16px 16px;
`;

const DisplayName = styled.h3`
  margin: 0;

  font-size: 1.05rem;
`;

const Handle = styled.span`
  display: block;

  margin-top: 2px;

  font-size: 0.85rem;

  color: var(--color-text-muted);
`;

const Divider = styled.div`
  margin: 10px 0;

  border-top: 1px solid var(--color-surface-hover);
`;

const Bio = styled.p`
  margin: 0;

  font-size: 0.88rem;
  line-height: 1.45;

  color: var(--color-text);
`;

const ActionErrorText = styled.p`
  margin: 10px 0 0;

  font-size: 0.8rem;

  color: var(--color-danger, #e5484d);
`;

const ActionRow = styled.div`
  display: flex;

  align-items: center;

  gap: 8px;

  margin-top: 14px;
`;

const PrimaryButton = styled.button`
  flex: 1;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  gap: 6px;

  border: 1px solid var(--color-accent);
  border-radius: 999px;

  background: var(--color-accent);

  color: #fff;

  padding: 0.5rem 0.9rem;

  font-weight: 600;

  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DisabledPill = styled.button`
  flex: 1;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  gap: 6px;

  border: 1px solid var(--color-surface-hover);
  border-radius: 999px;

  background: transparent;

  color: var(--color-text-muted);

  padding: 0.5rem 0.9rem;

  font-weight: 600;

  cursor: not-allowed;
`;

const IconButton = styled.button`
  flex-shrink: 0;

  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid var(--color-surface-hover);
  border-radius: 50%;

  background: transparent;

  color: var(--color-text-muted);

  cursor: pointer;

  &:hover:not(:disabled) {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MessageForm = styled.form`
  display: flex;

  gap: 8px;

  margin-top: 14px;
`;

const MessageInput = styled.input`
  flex: 1;
  min-width: 0;

  background: var(--color-surface, transparent);

  border: 1px solid var(--color-surface-hover);
  border-radius: 8px;

  color: var(--color-text);

  padding: 8px 10px;

  font-family: inherit;
  font-size: 0.85rem;

  outline: none;

  &:focus {
    border-color: var(--color-accent);
  }
`;

const SendButton = styled.button`
  flex-shrink: 0;

  width: 36px;
  height: 36px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: none;
  border-radius: 8px;

  background: var(--color-accent);

  color: #fff;

  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
