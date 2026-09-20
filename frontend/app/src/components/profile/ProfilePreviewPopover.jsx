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
import { getCurrentUserId } from "../../api/session";
import { getOrCreateDm } from "../../api/rooms";
import { sendMessage } from "../../api/messages";
import { Avatar, Button, IconButton, Input, riseIn } from "../ui";

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

    // /by-username embeds friendship_status and friendship_id on the response,
    // so one call is enough.
    const isSelf = target.id === getCurrentUserId();

    getUserByUsername(target.username)
      .then((data) => {
        if (!cancelled) {
          setUser(isSelf ? { ...data, friendship_status: "self", friendship_id: null } : data);
        }
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
  }, [target.id, target.username]);

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
      // POST /friends/add answers with the status only; re-read the profile so
      // friendship_id is known and "cancel" works straight away.
      const refreshed = await getUserByUsername(user.username);
      setUser((u) => ({ ...u, ...refreshed }));
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

        <CloseButton
          type="button"
          $size={26}
          $round
          onClick={onClose}
          aria-label="Close"
          title="Close"
        >
          <TbX size={16} />
        </CloseButton>

        {loading && <StatusText>Loading…</StatusText>}
        {error && <StatusText $error>{error}</StatusText>}

        {user && (
          <>
            <AvatarWrap>
              <Avatar
                src={avatarLoading ? null : avatarUrl}
                name={user.display_name || user.username}
                $size={64}
              />
            </AvatarWrap>

            <Content>
              <DisplayName>{user.display_name || user.username}</DisplayName>
              {user.username && <Handle>@{user.username}</Handle>}

              <Divider />

              <Bio>{user.bio || "No bio yet."}</Bio>

              {actionError && <ActionErrorText>{actionError}</ActionErrorText>}

              {user.friendship_status === "none" && (
                <ActionRow>
                  <PrimaryButton
                    type="button"
                    $pill
                    $size="sm"
                    onClick={handleAddFriend}
                    disabled={runningAction}
                  >
                    <TbUserPlus size={16} />
                    Add Friend
                  </PrimaryButton>
                </ActionRow>
              )}

              {user.friendship_status === "pending_outgoing" && (
                <ActionRow>
                  <DisabledPill type="button" $variant="secondary" $pill $size="sm" disabled>
                    <TbUserCheck size={16} />
                    Request Sent
                  </DisabledPill>

                  <RoundIconButton
                    type="button"
                    $size={34}
                    onClick={handleCancelRequest}
                    disabled={runningAction}
                    aria-label="Cancel friend request"
                    title="Cancel friend request"
                  >
                    <TbX size={16} />
                  </RoundIconButton>
                </ActionRow>
              )}

              {user.friendship_status === "pending_incoming" && (
                <ActionRow>
                  <PrimaryButton
                    type="button"
                    $pill
                    $size="sm"
                    onClick={handleAccept}
                    disabled={runningAction}
                  >
                    <TbCheck size={16} />
                    Accept
                  </PrimaryButton>

                  <RoundIconButton
                    type="button"
                    $size={34}
                    onClick={handleDecline}
                    disabled={runningAction}
                    aria-label="Decline friend request"
                    title="Decline friend request"
                  >
                    <TbX size={16} />
                  </RoundIconButton>
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

                  <SendButton
                    type="submit"
                    $size="sm"
                    disabled={sending || !messageDraft.trim()}
                    aria-label="Send message"
                    title="Send message"
                  >
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
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  box-shadow: var(--shadow-lg);
  animation: ${riseIn} var(--dur) var(--ease);
  z-index: 9999;
`;

const Banner = styled.div`
  height: 72px;
  border-bottom: 1px solid var(--border-subtle);
  background: linear-gradient(
    135deg,
    var(--accent-600),
    color-mix(in srgb, var(--accent-600) 35%, var(--bg-base))
  );
`;

const CloseButton = styled(IconButton)`
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  border-color: var(--border-strong);
  background: rgba(0, 0, 0, 0.35);
  color: #fff;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
  }
`;

const StatusText = styled.p`
  margin: 0;
  padding: var(--space-4);
  font-size: var(--text-sm);
  color: ${({ $error }) => ($error ? "var(--danger)" : "var(--text-secondary)")};
`;

const AvatarWrap = styled.div`
  margin-top: -32px;
  margin-left: var(--space-4);
  width: fit-content;
  border: 4px solid var(--bg-elevated);
  border-radius: 50%;
`;

const Content = styled.div`
  padding: var(--space-2) var(--space-4) var(--space-4);
`;

const DisplayName = styled.h3`
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-lg);
`;

const Handle = styled.span`
  display: block;
  margin-top: 2px;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
`;

const Divider = styled.div`
  margin: 10px 0;
  border-top: 1px solid var(--border-subtle);
`;

const Bio = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--text-secondary);
`;

const ActionErrorText = styled.p`
  margin: 10px 0 0;
  font-size: var(--text-sm);
  color: var(--danger);
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
`;

const PrimaryButton = styled(Button)`
  flex: 1;
`;

const DisabledPill = styled(Button)`
  flex: 1;
`;

const RoundIconButton = styled(IconButton)`
  border-color: var(--border-strong);
  border-radius: 50%;
`;

const MessageForm = styled.form`
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
`;

const MessageInput = styled(Input)`
  flex: 1;
  min-width: 0;
  padding: var(--space-2) 10px;
  font-size: var(--text-sm);
`;

const SendButton = styled(Button)`
  flex-shrink: 0;
  width: 36px;
  padding: 0;
`;
