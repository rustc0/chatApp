import { useEffect, useState } from "react";
import styled from "styled-components";
import { TbArrowLeft, TbCheck, TbUserPlus, TbUsersGroup } from "react-icons/tb";

import MemberList from "./MemberList";
import {
  getRoomMembers,
  getRoomPendingInvites,
  inviteToRoom,
  removeMember,
} from "../../api/rooms";
import { getFriendsList } from "../../api/friends";
import { useProfileOverlay } from "../layout/ProfileOverlayContext";
import {
  Avatar,
  ConfirmDialog,
  EmptyState,
  IconButton,
  InlineError,
  StatusText,
} from "../ui";

const MembersSidebarRoot = styled.aside`
  width: 260px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: var(--space-4);
  border-left: 1px solid var(--border-subtle);
  background: var(--bg-surface);

  @media (max-width: 700px) {
    display: none;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
`;

const MembersTitle = styled.h3`
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const FriendRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px var(--space-2);
  border-radius: var(--radius-sm);
  transition: background var(--dur-fast) var(--ease);

  &:hover {
    background: var(--bg-hover);
  }
`;

const FriendName = styled.span`
  flex: 1;
  min-width: 0;
  color: var(--text-primary);
  font-size: var(--text-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ListArea = styled.div`
  padding-top: var(--space-3);
`;

function MembersSidebar({ roomId }) {
  const { currentUser } = useProfileOverlay();
  const [view, setView] = useState("members");

  const [loading, setLoading] = useState("loading");
  const [members, setMembers] = useState([]);
  const [kickError, setKickError] = useState(null);
  const [pendingKick, setPendingKick] = useState(null);
  const [kicking, setKicking] = useState(false);

  const [friendsLoading, setFriendsLoading] = useState("idle");
  const [friends, setFriends] = useState([]);
  const [pendingInviteIds, setPendingInviteIds] = useState(new Set());
  const [invitingId, setInvitingId] = useState(null);
  const [inviteError, setInviteError] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading("loading");
      try {
        const roomMembers = await getRoomMembers(roomId);
        setMembers(roomMembers);
        setLoading("success");
      } catch (error) {
        console.error("Error fetching room members:", error);
        setLoading("error");
      }
    };

    fetchMembers();
  }, [roomId]);

  useEffect(() => {
    if (view !== "friends") {
      return;
    }

    const fetchFriendsAndInvites = async () => {
      setFriendsLoading("loading");

      try {
        const [friendsData, pendingInvites] = await Promise.all([
          getFriendsList({ limit: 100, offset: 0 }),
          getRoomPendingInvites(roomId),
        ]);

        setFriends(Array.isArray(friendsData) ? friendsData : []);
        setPendingInviteIds(
          new Set(
            Array.isArray(pendingInvites)
              ? pendingInvites.map((invite) => invite.user_id)
              : [],
          ),
        );
        setFriendsLoading("success");
      } catch (error) {
        console.error("Error fetching friends/invites:", error);
        setFriendsLoading("error");
      }
    };

    fetchFriendsAndInvites();
  }, [view, roomId]);

  const memberIds = new Set(members.map((member) => member.id));
  const invitableFriends = friends.filter(
    (friend) => !memberIds.has(friend.id)
  );

  const currentUserRole = members.find(
    (member) => member.id === currentUser?.id
  )?.role;
  const canInvite = currentUserRole === "owner" || currentUserRole === "admin";

  const confirmKick = async () => {
    if (!pendingKick) return;

    setKicking(true);
    setKickError(null);
    try {
      await removeMember(roomId, pendingKick.id);
      setMembers((prev) => prev.filter((item) => item.id !== pendingKick.id));
      setPendingKick(null);
    } catch (error) {
      console.error("Error removing member:", error);
      setKickError(`Couldn't remove ${pendingKick.username}.`);
    } finally {
      setKicking(false);
    }
  };

  /** The friend joins once they accept the invite from their profile overlay. */
  const handleInvite = async (friend) => {
    setInvitingId(friend.id);
    setInviteError(null);

    try {
      await inviteToRoom(roomId, friend.id);
      setPendingInviteIds((prev) => new Set(prev).add(friend.id));
    } catch (error) {
      console.error("Error sending room invite:", error);
      setInviteError(error?.message || `Couldn't invite ${friend.username}.`);
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <MembersSidebarRoot>
      <SidebarHeader>
        <MembersTitle>
          {view === "members"
            ? `Members — ${members.length}`
            : `Friends — ${invitableFriends.length}`}
        </MembersTitle>

        {(view !== "members" || canInvite) && (
          <IconButton
            type="button"
            $size={26}
            onClick={() =>
              setView(view === "members" ? "friends" : "members")
            }
            aria-label={
              view === "members"
                ? "Invite friends"
                : "Back to members"
            }
            title={view === "members" ? "Invite friends" : "Back to members"}
          >
            {view === "members" ? (
              <TbUserPlus size={18} />
            ) : (
              <TbArrowLeft size={18} />
            )}
          </IconButton>
        )}
      </SidebarHeader>

      <ListArea>
        {view === "members" ? (
          <>
            {loading === "loading" && <StatusText>Loading members...</StatusText>}
            {loading === "error" && <InlineError>Error loading members.</InlineError>}
            {kickError && !pendingKick && (
              <InlineError role="alert">{kickError}</InlineError>
            )}
            {loading === "success" && (
              <MemberList
                members={members}
                currentUserId={currentUser?.id}
                currentUserRole={currentUserRole}
                onKick={setPendingKick}
              />
            )}
          </>
        ) : (
          <>
            {friendsLoading === "loading" && <StatusText>Loading friends...</StatusText>}
            {friendsLoading === "error" && <InlineError>Error loading friends.</InlineError>}
            {inviteError && <InlineError role="alert">{inviteError}</InlineError>}
            {friendsLoading === "success" &&
              (invitableFriends.length > 0 ? (
                invitableFriends.map((friend) => {
                  const invited = pendingInviteIds.has(friend.id);
                  const isInviting = invitingId === friend.id;

                  return (
                    <FriendRow key={friend.id}>
                      <Avatar name={friend.username} $size={28} />

                      <FriendName>{friend.username}</FriendName>

                      <IconButton
                        type="button"
                        $size={26}
                        onClick={() => handleInvite(friend)}
                        disabled={invited || isInviting}
                        aria-label={
                          invited
                            ? `${friend.username} has been invited`
                            : `Invite ${friend.username} to the room`
                        }
                        title={invited ? "Invite sent" : `Invite ${friend.username}`}
                      >
                        {invited ? <TbCheck size={16} /> : <TbUserPlus size={16} />}
                      </IconButton>
                    </FriendRow>
                  );
                })
              ) : (
                <EmptyState
                  icon={TbUsersGroup}
                  title={
                    friends.length === 0
                      ? "No friends yet."
                      : "Everyone's here"
                  }
                  hint={
                    friends.length === 0
                      ? "Add friends from their profile to invite them to rooms."
                      : "All your friends are already in this room."
                  }
                />
              ))}
          </>
        )}
      </ListArea>

      <ConfirmDialog
        open={Boolean(pendingKick)}
        title="Remove member?"
        text={
          pendingKick
            ? `Remove ${pendingKick.username} from this room?`
            : ""
        }
        error={kickError}
        confirmLabel="Remove"
        busyLabel="Removing..."
        busy={kicking}
        onConfirm={confirmKick}
        onCancel={() => {
          setPendingKick(null);
          setKickError(null);
        }}
      />
    </MembersSidebarRoot>
  );
}

export default MembersSidebar;
