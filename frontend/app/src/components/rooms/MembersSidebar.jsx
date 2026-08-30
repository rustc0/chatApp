import { useEffect, useState } from "react";
import styled from "styled-components";
import { TbArrowLeft, TbCheck, TbUserPlus } from "react-icons/tb";

import MemberList from "./MemberList";
import {
  getRoomMembers,
  getRoomPendingInvites,
  inviteToRoom,
  removeMember,
} from "../../api/rooms";
import { getFriendsList } from "../../api/friends";
import { useProfileOverlay } from "../layout/ProfileOverlayContext";


const MembersSidebarRoot = styled.aside`
  width: 260px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 16px;
  border-left: 1px solid var(--color-text);
  background: var(--color-bg);

  @media (max-width: 700px) {
    display: none;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 8px;
`;

const MembersTitle = styled.h3`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 13px;
  text-transform: uppercase;
`;

const ToggleButton = styled.button`
  flex-shrink: 0;

  width: 26px;
  height: 26px;

  display: grid;
  place-items: center;

  border: 1px solid var(--color-surface-hover);
  border-radius: 6px;

  background: transparent;
  color: var(--color-text-muted);

  cursor: pointer;

  transition:
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
`;

const FriendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 6px 2px;
`;

const FriendAvatar = styled.div`
  flex-shrink: 0;

  width: 28px;
  height: 28px;

  border-radius: 50%;

  display: grid;
  place-items: center;

  font-size: 0.75rem;
  font-weight: 700;

  color: var(--color-text);
  background: var(--color-surface-hover);
`;

const FriendName = styled.span`
  flex: 1;
  min-width: 0;

  font-size: 0.9rem;
  color: var(--color-text);

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const InviteButton = styled.button`
  flex-shrink: 0;

  width: 26px;
  height: 26px;

  display: grid;
  place-items: center;

  border: 1px solid var(--color-surface-hover);
  border-radius: 6px;

  background: transparent;
  color: var(--color-text-muted);

  font-size: 0.95rem;
  line-height: 1;

  cursor: pointer;

  transition:
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover:not(:disabled) {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;


function MembersSidebar({ roomId }) {
  const { currentUser } = useProfileOverlay();
  const [view, setView] = useState("members");

  const [loading, setLoading] = useState("loading");
  const [members, setMembers] = useState([]);
  const [kickError, setKickError] = useState(null);

  const [friendsLoading, setFriendsLoading] = useState("idle");
  const [friends, setFriends] = useState([]);
  const [pendingInviteIds, setPendingInviteIds] = useState(new Set());
  const [invitingId, setInvitingId] = useState(null);

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

        const pendingIds = Array.isArray(pendingInvites)
          ? pendingInvites.map((invite) => invite.user_id)
          : [];

        setPendingInviteIds(new Set(pendingIds));
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

  const handleKick = async (member) => {
    if (!window.confirm(`Remove ${member.username} from this room?`)) return;

    setKickError(null);
    try {
      await removeMember(roomId, member.id);
      setMembers((prev) => prev.filter((item) => item.id !== member.id));
    } catch (error) {
      console.error("Error removing member:", error);
      setKickError(`Couldn't remove ${member.username}.`);
    }
  };

  const handleInvite = async (friend) => {
    setInvitingId(friend.id);

    try {
      await inviteToRoom(roomId, friend.id);

      setPendingInviteIds((prev) => new Set(prev).add(friend.id));
    } catch (error) {
      console.error("Error sending room invite:", error);
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
          <ToggleButton
            type="button"
            onClick={() =>
              setView(view === "members" ? "friends" : "members")
            }
            aria-label={
              view === "members"
                ? "Invite friends"
                : "Back to members"
            }
          >
            {view === "members" ? (
              <TbUserPlus size={15} />
            ) : (
              <TbArrowLeft size={15} />
            )}
          </ToggleButton>
        )}
      </SidebarHeader>

      {view === "members" ? (
        <>
          {loading === "loading" && <p>Loading members...</p>}
          {loading === "error" && <p>Error loading members.</p>}
          {kickError && <p role="alert">{kickError}</p>}
          {loading === "success" && (
            <MemberList
              members={members}
              currentUserId={currentUser?.id}
              currentUserRole={currentUserRole}
              onKick={handleKick}
            />
          )}
        </>
      ) : (
        <>
          {friendsLoading === "loading" && <p>Loading friends...</p>}
          {friendsLoading === "error" && <p>Error loading friends.</p>}
          {friendsLoading === "success" &&
            (invitableFriends.length > 0 ? (
              invitableFriends.map((friend) => {
                const isPending = pendingInviteIds.has(friend.id);
                const isInviting = invitingId === friend.id;

                return (
                  <FriendRow key={friend.id}>
                    <FriendAvatar>
                      {friend.username
                        ?.charAt(0)
                        ?.toUpperCase() || "?"}
                    </FriendAvatar>

                    <FriendName>
                      {friend.username}
                    </FriendName>

                    <InviteButton
                      type="button"
                      onClick={() => handleInvite(friend)}
                      disabled={isPending || isInviting}
                      aria-label={
                        isPending
                          ? `Invite pending for ${friend.username}`
                          : `Invite ${friend.username}`
                      }
                    >
                      {isPending ? <TbCheck size={14} /> : "+"}
                    </InviteButton>
                  </FriendRow>
                );
              })
            ) : (
              <p>No friends to invite.</p>
            ))}
        </>
      )}
    </MembersSidebarRoot>
  );
}

export default MembersSidebar;