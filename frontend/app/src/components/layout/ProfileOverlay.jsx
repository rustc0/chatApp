import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  TbArrowLeft,
  TbCheck,
  TbDoorExit,
  TbPencil,
  TbSearch,
  TbUserMinus,
  TbX,
} from "react-icons/tb";

import { useProfileOverlay } from "./ProfileOverlayContext";

import {
  checkUsernameAvailability,
  getAvatarBlob,
  getUserByUsername,
  updateProfile,
  uploadAvatar,
} from "../../api/profile";

import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriendsList,
  removeFriend,
  sendFriendRequest,
} from "../../api/friends";

import {
  acceptRoomInvite,
  declineRoomInvite,
  getRoomInvites,
  getRooms,
  leaveRoom,
} from "../../api/rooms";


const DEBOUNCE_MS = 400;
const PREVIEW_LIMIT = 5;
const MANAGEMENT_PAGE_SIZE = 50;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;


// -----------------------------------------------------------------------------
// Username availability
// -----------------------------------------------------------------------------

export function useUsernameAvailability(username, currentUsername) {
  const [status, setStatus] = useState("idle");
  const controllerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    controllerRef.current?.abort();

    if (!username || username === currentUsername) {
      setStatus("idle");
      return;
    }

    if (!USERNAME_RE.test(username)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const { available } = await checkUsernameAvailability(username, {
          signal: controller.signal,
        });

        setStatus(available ? "available" : "taken");
      } catch (err) {
        if (err.name !== "AbortError") {
          setStatus("error");
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timerRef.current);
      controllerRef.current?.abort();
    };
  }, [username, currentUsername]);

  return status;
}


// -----------------------------------------------------------------------------
// Avatar loading
// -----------------------------------------------------------------------------

function useAvatarUrl(avatarFile) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    if (!avatarFile) {
      setAvatarUrl(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    getAvatarBlob(avatarFile)
      .then((blob) => {
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setAvatarUrl(objectUrl);
      })
      .catch((error) => {
        console.error("Failed to load avatar:", error);

        if (!cancelled) {
          setAvatarUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [avatarFile]);

  return { avatarUrl, loading };
}


// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function ProfileOverlay({ user, onClose, onSave }) {
  const {
    refreshProfile,
    loadingProfile,
    notifyRoomsChanged,
  } = useProfileOverlay();

  const { avatarUrl, loading: avatarLoading } = useAvatarUrl(
    user.avatar_file
  );

  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const handleAvatarButtonClick = () => {
    if (avatarUploading) {
      return;
    }

    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setAvatarUploading(true);
    setAvatarError("");

    try {
      await uploadAvatar(file);
      await refreshProfile();
    } catch (error) {
      console.error("Failed to upload avatar:", error);

      setAvatarError(
        error?.message || "Failed to upload avatar."
      );
    } finally {
      setAvatarUploading(false);
    }
  };


  // ---------------------------------------------------------------------------
  // View state
  // ---------------------------------------------------------------------------

  const [view, setView] = useState("profile");

  const [previewSection, setPreviewSection] = useState("friends");

  const [managementSection, setManagementSection] =
    useState("friends");

  const [managementTab, setManagementTab] =
    useState("friends");


  // ---------------------------------------------------------------------------
  // Profile editing
  // ---------------------------------------------------------------------------

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState({
    displayName: user.displayName ?? "",
    username: user.username ?? "",
    bio: user.bio ?? "",
  });

  const usernameStatus = useUsernameAvailability(
    draft.username,
    user.username
  );

  const canSave =
    !saving &&
    draft.displayName.trim().length > 0 &&
    usernameStatus !== "checking" &&
    usernameStatus !== "taken" &&
    usernameStatus !== "invalid" &&
    usernameStatus !== "error";


  // ---------------------------------------------------------------------------
  // Friends / rooms data
  // ---------------------------------------------------------------------------

  const [friends, setFriends] = useState([]);
  const [friendsOffset, setFriendsOffset] = useState(0);
  const [friendsHasMore, setFriendsHasMore] = useState(false);

  const [friendRequests, setFriendRequests] = useState([]);
  const [requestsOffset, setRequestsOffset] = useState(0);
  const [requestsHasMore, setRequestsHasMore] = useState(false);

  const [rooms, setRooms] = useState([]);
  const [roomsOffset, setRoomsOffset] = useState(0);
  const [roomsHasMore, setRoomsHasMore] = useState(false);

  const [roomInvites, setRoomInvites] = useState([]);
  const [invitesOffset, setInvitesOffset] = useState(0);
  const [invitesHasMore, setInvitesHasMore] = useState(false);

  const [loadingSection, setLoadingSection] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sectionError, setSectionError] = useState("");

  // Add friend
  const [friendUsername, setFriendUsername] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);

  // Confirmation
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmError, setConfirmError] = useState("");
  const [runningAction, setRunningAction] = useState(false);


  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const openManagement = (section = "friends") => {
    setSectionError("");
    setManagementSection(section);
    setManagementTab(section);
    setView("management");
  };

  const goBackToProfile = () => {
    setSectionError("");
    setView("profile");
  };


  // ---------------------------------------------------------------------------
  // Profile editing
  // ---------------------------------------------------------------------------

  const startEditing = () => {
    setDraft({
      displayName: user.displayName ?? "",
      username: user.username ?? "",
      bio: user.bio ?? "",
    });

    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = async () => {
    if (!canSave) {
      return;
    }

    setSaving(true);

    try {
      const updated = await updateProfile({
        display_name: draft.displayName,
        username: draft.username,
        bio: draft.bio,
      });

      await refreshProfile();

      onSave?.(updated);

      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  };


  // ---------------------------------------------------------------------------
  // Data loading — preview (profile view, capped at PREVIEW_LIMIT server-side)
  // ---------------------------------------------------------------------------

  const loadFriendsPreview = async () => {
    setLoadingSection(true);
    setSectionError("");

    try {
      const data = await getFriendsList({
        limit: PREVIEW_LIMIT,
        offset: 0,
      });

      setFriends(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load friends preview:", error);

      setSectionError(
        error?.message || "Failed to load friends."
      );
    } finally {
      setLoadingSection(false);
    }
  };

  const loadRoomsPreview = async () => {
    setLoadingSection(true);
    setSectionError("");

    try {
      const data = await getRooms({
        limit: PREVIEW_LIMIT,
        offset: 0,
      });

      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load rooms preview:", error);

      setSectionError(
        error?.message || "Failed to load rooms."
      );
    } finally {
      setLoadingSection(false);
    }
  };


  // ---------------------------------------------------------------------------
  // Data loading — management (paginated, MANAGEMENT_PAGE_SIZE at a time)
  // ---------------------------------------------------------------------------

  const loadFriendsPage = async (reset = false) => {
    const nextOffset = reset ? 0 : friendsOffset;

    reset ? setLoadingSection(true) : setLoadingMore(true);
    setSectionError("");

    try {
      const data = await getFriendsList({
        limit: MANAGEMENT_PAGE_SIZE,
        offset: nextOffset,
      });

      const batch = Array.isArray(data) ? data : [];

      setFriends((prev) => (reset ? batch : [...prev, ...batch]));
      setFriendsOffset(nextOffset + batch.length);
      setFriendsHasMore(batch.length === MANAGEMENT_PAGE_SIZE);
    } catch (error) {
      console.error("Failed to load friends:", error);

      setSectionError(
        error?.message || "Failed to load friends."
      );
    } finally {
      reset ? setLoadingSection(false) : setLoadingMore(false);
    }
  };

  const loadRequestsPage = async (reset = false) => {
    const nextOffset = reset ? 0 : requestsOffset;

    reset ? setLoadingSection(true) : setLoadingMore(true);
    setSectionError("");

    try {
      const data = await getFriendRequests({
        limit: MANAGEMENT_PAGE_SIZE,
        offset: nextOffset,
      });

      const batch = Array.isArray(data) ? data : [];

      setFriendRequests((prev) =>
        reset ? batch : [...prev, ...batch]
      );
      setRequestsOffset(nextOffset + batch.length);
      setRequestsHasMore(batch.length === MANAGEMENT_PAGE_SIZE);
    } catch (error) {
      console.error("Failed to load friend requests:", error);

      setSectionError(
        error?.message || "Failed to load requests."
      );
    } finally {
      reset ? setLoadingSection(false) : setLoadingMore(false);
    }
  };

  const loadRoomsPage = async (reset = false) => {
    const nextOffset = reset ? 0 : roomsOffset;

    reset ? setLoadingSection(true) : setLoadingMore(true);
    setSectionError("");

    try {
      const data = await getRooms({
        limit: MANAGEMENT_PAGE_SIZE,
        offset: nextOffset,
      });

      const batch = Array.isArray(data) ? data : [];

      setRooms((prev) => (reset ? batch : [...prev, ...batch]));
      setRoomsOffset(nextOffset + batch.length);
      setRoomsHasMore(batch.length === MANAGEMENT_PAGE_SIZE);
    } catch (error) {
      console.error("Failed to load rooms:", error);

      setSectionError(
        error?.message || "Failed to load rooms."
      );
    } finally {
      reset ? setLoadingSection(false) : setLoadingMore(false);
    }
  };

  const loadInvitesPage = async (reset = false) => {
    const nextOffset = reset ? 0 : invitesOffset;

    reset ? setLoadingSection(true) : setLoadingMore(true);
    setSectionError("");

    try {
      const data = await getRoomInvites({
        limit: MANAGEMENT_PAGE_SIZE,
        offset: nextOffset,
      });

      const batch = Array.isArray(data) ? data : [];

      setRoomInvites((prev) =>
        reset ? batch : [...prev, ...batch]
      );
      setInvitesOffset(nextOffset + batch.length);
      setInvitesHasMore(batch.length === MANAGEMENT_PAGE_SIZE);
    } catch (error) {
      console.error("Failed to load room invites:", error);

      setSectionError(
        error?.message || "Failed to load invites."
      );
    } finally {
      reset ? setLoadingSection(false) : setLoadingMore(false);
    }
  };


  // Profile view loads whichever preview tab is active.
  // Management view loads whichever management tab is active, from page 1.

  useEffect(() => {
    if (view === "profile") {
      if (previewSection === "friends") {
        loadFriendsPreview();
      } else {
        loadRoomsPreview();
      }
      return;
    }

    if (managementSection === "friends") {
      if (managementTab === "friends") {
        loadFriendsPage(true);
      } else if (managementTab === "requests") {
        loadRequestsPage(true);
      }
    } else {
      if (managementTab === "rooms") {
        loadRoomsPage(true);
      } else if (managementTab === "invites") {
        loadInvitesPage(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, previewSection, managementSection, managementTab, user.id]);


  // ---------------------------------------------------------------------------
  // Confirmation actions
  // ---------------------------------------------------------------------------

  const requestRemoveFriend = (friend) => {
    setConfirmError("");

    setConfirmAction({
      type: "remove-friend",
      id: friend.id,
      label: friend.username,
    });
  };


  const requestDeclineFriendRequest = (request) => {
    setConfirmError("");

    setConfirmAction({
      type: "decline-friend-request",
      id: request.friendship_id,
      label: request.sender?.username || "this request",
    });
  };


  const requestLeaveRoom = (room) => {
    setConfirmError("");

    setConfirmAction({
      type: "leave-room",
      id: room.id,
      label: room.name || "Direct message",
    });
  };


  const requestDeclineRoomInvite = (invite) => {
    setConfirmError("");

    setConfirmAction({
      type: "decline-room-invite",
      id: invite.id,
      label: invite.room_name || "this invite",
    });
  };


  const cancelConfirmAction = () => {
    if (runningAction) {
      return;
    }

    setConfirmError("");
    setConfirmAction(null);
  };


  const reloadActiveManagementTab = async () => {
    if (managementSection === "friends") {
      if (managementTab === "friends") {
        await loadFriendsPage(true);
      } else {
        await loadRequestsPage(true);
      }
    } else {
      if (managementTab === "rooms") {
        await loadRoomsPage(true);
      } else {
        await loadInvitesPage(true);
      }
    }
  };


  const applyAction = async () => {
    if (!confirmAction) {
      return;
    }

    setRunningAction(true);
    setConfirmError("");

    try {
      if (confirmAction.type === "remove-friend") {
        await removeFriend(confirmAction.id);
      }

      if (confirmAction.type === "decline-friend-request") {
        await declineFriendRequest(confirmAction.id);
      }

      if (confirmAction.type === "leave-room") {
        await leaveRoom(confirmAction.id, user.id);
        notifyRoomsChanged();
      }

      if (confirmAction.type === "decline-room-invite") {
        await declineRoomInvite(confirmAction.id);
      }

      await refreshProfile();
      await reloadActiveManagementTab();

      setConfirmAction(null);
    } catch (error) {
      console.error("Failed to apply profile action:", error);

      setConfirmError(
        error?.message || "Failed to apply action."
      );
    } finally {
      setRunningAction(false);
    }
  };


  // ---------------------------------------------------------------------------
  // Friend search
  // ---------------------------------------------------------------------------

  const handleFriendSearchAdd = async (event) => {
    event.preventDefault();

    const query = friendUsername.trim();

    if (!query) {
      setSectionError("Enter a username to add.");
      return;
    }

    setAddingFriend(true);
    setSectionError("");

    try {
      const match = await getUserByUsername(query);

      await sendFriendRequest(match.id);

      setFriendUsername("");
    } catch (error) {
      console.error("Failed to add friend:", error);

      setSectionError(
        error?.message || "Failed to add friend."
      );
    } finally {
      setAddingFriend(false);
    }
  };


  // ---------------------------------------------------------------------------
  // Rendering helpers
  // ---------------------------------------------------------------------------

  const renderFriendRows = (items, isPreview = false) => {
    return (
      <>
        {items.length > 0 ? (
          items.map((friend) => (
            <ListRow key={friend.id}>
              <RowAvatar>
                {friend.username
                  ?.charAt(0)
                  ?.toUpperCase() || "?"}
              </RowAvatar>

              <RowName>
                {friend.username}
              </RowName>

              {!isPreview && (
                <ActionButton
                  type="button"
                  onClick={() =>
                    requestRemoveFriend(friend)
                  }
                  aria-label={`Remove ${friend.username}`}
                >
                  <TbUserMinus size={16} />
                </ActionButton>
              )}
            </ListRow>
          ))
        ) : (
          <EmptyState>
            No friends yet
          </EmptyState>
        )}

        {isPreview && (
          <CenteredButtonWrap>
            <PillButton
              type="button"
              onClick={() =>
                openManagement("friends")
              }
            >
              See all
            </PillButton>
          </CenteredButtonWrap>
        )}
      </>
    );
  };


  const renderRoomRows = (items, isPreview = false) => {
    return (
      <>
        {items.length > 0 ? (
          items.map((room) => (
            <ListRow key={room.id}>
              <RowAvatar>
                {(room.name || "DM")
                  .charAt(0)
                  .toUpperCase()}
              </RowAvatar>

              <RowName>
                {room.name || "Direct message"}
              </RowName>

              {!isPreview && (
                <ActionButton
                  type="button"
                  onClick={() =>
                    requestLeaveRoom(room)
                  }
                  aria-label={`Leave ${
                    room.name || "direct message"
                  }`}
                >
                  <TbDoorExit size={16} />
                </ActionButton>
              )}
            </ListRow>
          ))
        ) : (
          <EmptyState>
            No rooms yet
          </EmptyState>
        )}

        {isPreview && (
          <CenteredButtonWrap>
            <PillButton
              type="button"
              onClick={() =>
                openManagement("rooms")
              }
            >
              See all
            </PillButton>
          </CenteredButtonWrap>
        )}
      </>
    );
  };


  // ---------------------------------------------------------------------------
  // Management content
  // ---------------------------------------------------------------------------

  const renderFriendsManagement = () => {
    if (managementTab === "friends") {
      return (
        <ExpandedListPanel>
          {renderFriendRows(friends, false)}

          {friendsHasMore && (
            <CenteredButtonWrap>
              <PillButton
                type="button"
                onClick={() => loadFriendsPage(false)}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load more"}
              </PillButton>
            </CenteredButtonWrap>
          )}
        </ExpandedListPanel>
      );
    }

    if (managementTab === "requests") {
      return (
        <ExpandedListPanel>
          {friendRequests.length > 0 ? (
            friendRequests.map((request) => (
              <RequestRow key={request.friendship_id}>
                <RowAvatar>
                  {request.sender?.username
                    ?.charAt(0)
                    ?.toUpperCase() || "?"}
                </RowAvatar>

                <RowName>
                  {request.sender?.username}
                </RowName>

                <RequestActions>
                  <ActionButton
                    type="button"
                    onClick={async () => {
                      try {
                        await acceptFriendRequest(
                          request.friendship_id
                        );

                        await Promise.all([
                          refreshProfile(),
                          loadRequestsPage(true),
                        ]);
                      } catch (error) {
                        setSectionError(
                          error?.message ||
                            "Failed to accept request."
                        );
                      }
                    }}
                    aria-label={`Accept ${
                      request.sender?.username
                    }`}
                  >
                    <TbCheck size={16} />
                  </ActionButton>

                  <ActionButton
                    type="button"
                    onClick={() =>
                      requestDeclineFriendRequest(
                        request
                      )
                    }
                    aria-label={`Decline ${
                      request.sender?.username
                    }`}
                  >
                    <TbX size={16} />
                  </ActionButton>
                </RequestActions>
              </RequestRow>
            ))
          ) : (
            <EmptyState>
              No pending requests
            </EmptyState>
          )}

          {requestsHasMore && (
            <CenteredButtonWrap>
              <PillButton
                type="button"
                onClick={() => loadRequestsPage(false)}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load more"}
              </PillButton>
            </CenteredButtonWrap>
          )}
        </ExpandedListPanel>
      );
    }

    return (
      <AddPanel onSubmit={handleFriendSearchAdd}>
        <AddRow>
          <AddInput
            value={friendUsername}
            onChange={(e) =>
              setFriendUsername(e.target.value)
            }
            placeholder="Exact username"
          />

          <AddButton
            type="submit"
            disabled={addingFriend}
          >
            {addingFriend ? "Adding..." : "Add"}
          </AddButton>
        </AddRow>

        <HelperRow>
          <TbSearch size={14} />
          Exact match only.
        </HelperRow>
      </AddPanel>
    );
  };


  const renderRoomsManagement = () => {
    if (managementTab === "rooms") {
      return (
        <ExpandedListPanel>
          {renderRoomRows(rooms, false)}

          {roomsHasMore && (
            <CenteredButtonWrap>
              <PillButton
                type="button"
                onClick={() => loadRoomsPage(false)}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load more"}
              </PillButton>
            </CenteredButtonWrap>
          )}
        </ExpandedListPanel>
      );
    }

    return (
      <ExpandedListPanel>
        {roomInvites.length > 0 ? (
          roomInvites.map((invite) => (
            <RequestRow key={invite.id}>
              <RowAvatar>
                {(invite.room_name || "DM")
                  .charAt(0)
                  .toUpperCase()}
              </RowAvatar>

              <RowName>
                {invite.room_name ||
                  "Direct message"}
              </RowName>

              <RequestActions>
                <ActionButton
                  type="button"
                  onClick={async () => {
                    try {
                      await acceptRoomInvite(
                        invite.id
                      );

                      await Promise.all([
                        refreshProfile(),
                        loadInvitesPage(true),
                      ]);

                      notifyRoomsChanged();
                    } catch (error) {
                      setSectionError(
                        error?.message ||
                          "Failed to accept invite."
                      );
                    }
                  }}
                  aria-label={`Accept invite for ${
                    invite.room_name || "room"
                  }`}
                >
                  <TbCheck size={16} />
                </ActionButton>

                <ActionButton
                  type="button"
                  onClick={() =>
                    requestDeclineRoomInvite(
                      invite
                    )
                  }
                  aria-label={`Decline invite for ${
                    invite.room_name || "room"
                  }`}
                >
                  <TbX size={16} />
                </ActionButton>
              </RequestActions>
            </RequestRow>
          ))
        ) : (
          <EmptyState>
            No pending invites
          </EmptyState>
        )}

        {invitesHasMore && (
          <CenteredButtonWrap>
            <PillButton
              type="button"
              onClick={() => loadInvitesPage(false)}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load more"}
            </PillButton>
          </CenteredButtonWrap>
        )}
      </ExpandedListPanel>
    );
  };


  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <Overlay onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        {view === "profile" && <Banner />}

        <CloseButton
          onClick={onClose}
          aria-label="Close"
        >
          <TbX size={20} />
        </CloseButton>

        {view === "profile" && (
          <AvatarWrap>
            <AvatarButton
              type="button"
              onClick={handleAvatarButtonClick}
              disabled={avatarUploading}
              aria-label="Update avatar"
            >
              {avatarLoading ? null : avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="" />
              ) : (
                <AvatarFallback>
                  {user.displayName
                    ?.charAt(0)
                    ?.toUpperCase() || "?"}
                </AvatarFallback>
              )}

              <AvatarOverlay>
                {avatarUploading
                  ? "Uploading..."
                  : "Update avatar"}
              </AvatarOverlay>
            </AvatarButton>

            <HiddenFileInput
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
            />

            {avatarError && (
              <AvatarErrorText>
                {avatarError}
              </AvatarErrorText>
            )}
          </AvatarWrap>
        )}

        <Content>
          {view === "profile" ? (
            <>
              {/* ------------------------------------------------------------- */}
              {/* PROFILE VIEW                                                   */}
              {/* ------------------------------------------------------------- */}

              {loadingProfile && (
                <LoadingHint>
                  Refreshing profile...
                </LoadingHint>
              )}

              <HeaderRow>
                <NameBlock>
                  {isEditing ? (
                    <>
                      <NameInput
                        value={draft.displayName}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            displayName:
                              e.target.value,
                          }))
                        }
                        placeholder="Display name"
                      />

                      <HandleInput
                        value={draft.username}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            username:
                              e.target.value,
                          }))
                        }
                        placeholder="username"
                        $status={usernameStatus}
                      />

                      {usernameStatus ===
                        "checking" && (
                        <HelperText>
                          Checking availability…
                        </HelperText>
                      )}

                      {usernameStatus ===
                        "taken" && (
                        <HelperText $error>
                          Username taken
                        </HelperText>
                      )}

                      {usernameStatus ===
                        "invalid" && (
                        <HelperText $error>
                          3–20 chars,
                          letters/numbers/underscore
                        </HelperText>
                      )}

                      {usernameStatus ===
                        "available" && (
                        <HelperText $ok>
                          Available
                        </HelperText>
                      )}
                    </>
                  ) : (
                    <>
                      <Username>
                        {user.displayName}
                      </Username>

                      {user.username && (
                        <Handle>
                          @{user.username}
                        </Handle>
                      )}
                    </>
                  )}
                </NameBlock>

                {isEditing ? (
                  <EditActions>
                    <IconButton
                      onClick={saveEditing}
                      aria-label="Save"
                      disabled={!canSave}
                    >
                      <TbCheck size={18} />
                    </IconButton>

                    <IconButton
                      onClick={cancelEditing}
                      aria-label="Cancel"
                    >
                      <TbX size={18} />
                    </IconButton>
                  </EditActions>
                ) : (
                  <IconButton
                    onClick={startEditing}
                    aria-label="Edit profile"
                  >
                    <TbPencil size={18} />
                  </IconButton>
                )}
              </HeaderRow>

              <Divider />

              {isEditing ? (
                <BioInput
                  value={draft.bio}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      bio: e.target.value,
                    }))
                  }
                  placeholder="Write something about yourself..."
                  rows={3}
                />
              ) : (
                <Bio>
                  {user.bio}
                </Bio>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PREVIEW                                                        */}
              {/* ------------------------------------------------------------- */}

              <PreviewSection>
                <PreviewTabs>
                  <PreviewTab
                    type="button"
                    $active={
                      previewSection === "friends"
                    }
                    onClick={() =>
                      setPreviewSection("friends")
                    }
                  >
                    Friends
                  </PreviewTab>

                  <PreviewTab
                    type="button"
                    $active={
                      previewSection === "rooms"
                    }
                    onClick={() =>
                      setPreviewSection("rooms")
                    }
                  >
                    Rooms
                  </PreviewTab>
                </PreviewTabs>

                <PreviewPanel>
                  {loadingSection ? (
                    <EmptyState>
                      Loading...
                    </EmptyState>
                  ) : sectionError ? (
                    <EmptyState>
                      {sectionError}
                    </EmptyState>
                  ) : previewSection === "friends" ? (
                    renderFriendRows(
                      friends,
                      true
                    )
                  ) : (
                    renderRoomRows(
                      rooms,
                      true
                    )
                  )}
                </PreviewPanel>
              </PreviewSection>
            </>
          ) : (
            <>
              {/* ------------------------------------------------------------- */}
              {/* MANAGEMENT VIEW                                                */}
              {/* ------------------------------------------------------------- */}

              <ManagementHeader>
                <BackButton
                  type="button"
                  onClick={goBackToProfile}
                >
                  <TbArrowLeft size={17} />
                  Back
                </BackButton>

                <ManagementTitle>
                  {managementSection ===
                  "friends"
                    ? "Friends"
                    : "Rooms"}
                </ManagementTitle>

                <HeaderSpacer />
              </ManagementHeader>

              <ManagementTabs>
                {managementSection ===
                "friends" ? (
                  <>
                    <ManagementTab
                      type="button"
                      $active={
                        managementTab ===
                        "friends"
                      }
                      onClick={() =>
                        setManagementTab(
                          "friends"
                        )
                      }
                    >
                      Friends
                    </ManagementTab>

                    <ManagementTab
                      type="button"
                      $active={
                        managementTab ===
                        "requests"
                      }
                      onClick={() =>
                        setManagementTab(
                          "requests"
                        )
                      }
                    >
                      Requests
                    </ManagementTab>

                    <ManagementTab
                      type="button"
                      $active={
                        managementTab === "add"
                      }
                      onClick={() =>
                        setManagementTab(
                          "add"
                        )
                      }
                    >
                      Add
                    </ManagementTab>
                  </>
                ) : (
                  <>
                    <ManagementTab
                      type="button"
                      $active={
                        managementTab === "rooms"
                      }
                      onClick={() =>
                        setManagementTab(
                          "rooms"
                        )
                      }
                    >
                      Rooms
                    </ManagementTab>

                    <ManagementTab
                      type="button"
                      $active={
                        managementTab ===
                        "invites"
                      }
                      onClick={() =>
                        setManagementTab(
                          "invites"
                        )
                      }
                    >
                      Invites
                    </ManagementTab>
                  </>
                )}
              </ManagementTabs>

              {sectionError && (
                <InlineError>
                  {sectionError}
                </InlineError>
              )}

              <ManagementContent>
                {loadingSection ? (
                  <EmptyState>
                    Loading...
                  </EmptyState>
                ) : managementSection ===
                  "friends" ? (
                  renderFriendsManagement()
                ) : (
                  renderRoomsManagement()
                )}
              </ManagementContent>
            </>
          )}
        </Content>

        {/* ----------------------------------------------------------------- */}
        {/* CONFIRMATION                                                       */}
        {/* ----------------------------------------------------------------- */}

        {confirmAction && (
          <ConfirmBackdrop
            onClick={cancelConfirmAction}
          >
            <ConfirmCard
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <ConfirmTitle>
                {confirmAction.type ===
                  "remove-friend" &&
                  "Remove friend?"}

                {confirmAction.type ===
                  "decline-friend-request" &&
                  "Decline request?"}

                {confirmAction.type ===
                  "leave-room" &&
                  "Leave room?"}

                {confirmAction.type ===
                  "decline-room-invite" &&
                  "Decline invite?"}
              </ConfirmTitle>

              <ConfirmText>
                {confirmAction.type ===
                  "remove-friend" &&
                  `Remove @${confirmAction.label} from your friends?`}

                {confirmAction.type ===
                  "decline-friend-request" &&
                  `Decline the request from @${confirmAction.label}?`}

                {confirmAction.type ===
                  "leave-room" &&
                  `Leave ${confirmAction.label}?`}

                {confirmAction.type ===
                  "decline-room-invite" &&
                  `Decline the invite for ${confirmAction.label}?`}
              </ConfirmText>

              {confirmError && (
                <ConfirmErrorText>
                  {confirmError}
                </ConfirmErrorText>
              )}

              <ConfirmActions>
                <ConfirmButton
                  type="button"
                  onClick={cancelConfirmAction}
                  disabled={runningAction}
                >
                  Cancel
                </ConfirmButton>

                <ConfirmButton
                  type="button"
                  $danger
                  onClick={applyAction}
                  disabled={runningAction}
                >
                  {runningAction
                    ? "Applying..."
                    : "Confirm"}
                </ConfirmButton>
              </ConfirmActions>
            </ConfirmCard>
          </ConfirmBackdrop>
        )}
      </Card>
    </Overlay>
  );
}


// =============================================================================
// Styles
// =============================================================================

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

  height: 85vh;

  display: flex;
  flex-direction: column;

  background: var(--color-bg);

  border: 1px solid var(--color-surface-hover);
  border-radius: 20px;

  overflow: hidden;

  color: var(--color-text);

  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
`;

const Banner = styled.div`
  flex-shrink: 0;

  height: 160px;

  background:
    color-mix(
      in srgb,
      var(--color-bg) 75%,
      black
    );

  border-bottom:
    1px solid var(--color-surface-hover);
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

  border:
    1px solid
    rgba(255, 255, 255, 0.15);

  border-radius: 50%;

  color: #fff;

  cursor: pointer;

  transition:
    background 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.55);
  }
`;


// =============================================================================
// Avatar — straddles the banner/content seam, centered horizontally,
// dims and shows an "Update avatar" overlay on hover.
// =============================================================================

const AvatarWrap = styled.div`
  flex-shrink: 0;

  display: flex;
  flex-direction: column;
  align-items: center;

  gap: 6px;

  margin-top: -64px;

  z-index: 1;
`;

const AvatarOverlay = styled.div`
  position: absolute;
  inset: 0;

  display: grid;
  place-items: center;

  padding: 0 10px;

  text-align: center;

  font-size: 0.75rem;
  font-weight: 600;

  color: #fff;

  background: rgba(0, 0, 0, 0.55);

  opacity: 0;

  transition: opacity 0.15s ease;
`;

const AvatarButton = styled.button`
  position: relative;

  width: 128px;
  height: 128px;

  padding: 0;

  border: 5px solid var(--color-bg);
  border-radius: 50%;

  overflow: hidden;

  background: var(--color-surface-hover);

  cursor: pointer;

  &:hover:not(:disabled) ${AvatarOverlay} {
    opacity: 1;
  }

  &:disabled {
    cursor: not-allowed;
  }
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

  font-size: 2.25rem;
  font-weight: 700;

  color: var(--color-text-muted);
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const AvatarErrorText = styled.span`
  font-size: 0.75rem;

  color: var(--color-danger, #e5484d);
`;


const Content = styled.div`
  flex: 1;
  min-height: 0;

  padding: 0 2rem 2rem;

  display: flex;
  flex-direction: column;

  overflow: hidden;
`;


const LoadingHint = styled.p`
  margin: 12px 0 0;

  color: var(--color-text-muted);

  font-size: 0.9rem;
`;


const HeaderRow = styled.div`
  flex-shrink: 0;

  display: flex;

  justify-content: space-between;
  align-items: center;

  margin-top: 1rem;

  gap: 1rem;
`;


const NameBlock = styled.div`
  min-width: 0;

  display: flex;
  flex-direction: column;

  gap: 6px;

  flex: 1;
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


const inputBase = `
  width: 100%;

  background:
    var(--color-surface, transparent);

  border:
    1px solid
    var(--color-surface-hover);

  border-radius: 8px;

  color: var(--color-text);

  padding: 6px 10px;

  font-family: inherit;

  outline: none;

  &:focus {
    border-color: var(--color-accent);
  }
`;


const NameInput = styled.input`
  ${inputBase}

  font-size: 1.15rem;
  font-weight: 600;
`;


const HandleInput = styled.input`
  ${inputBase}

  font-size: 0.9rem;

  border-color: ${({ $status }) =>
    $status === "taken" ||
    $status === "invalid" ||
    $status === "error"
      ? "var(--color-danger, #e5484d)"
      : $status === "available"
      ? "var(--color-success, #30a46c)"
      : "var(--color-surface-hover)"};
`;


const HelperText = styled.span`
  font-size: 0.78rem;

  margin-top: 4px;

  color: ${({ $error, $ok }) =>
    $error
      ? "var(--color-danger, #e5484d)"
      : $ok
      ? "var(--color-success, #30a46c)"
      : "var(--color-text-muted)"};
`;


const BioInput = styled.textarea`
  ${inputBase}

  margin-top: 1.25rem;

  resize: vertical;

  line-height: 1.5;
`;


const EditActions = styled.div`
  flex-shrink: 0;

  display: flex;

  gap: 8px;
`;


const IconButton = styled.button`
  flex-shrink: 0;

  width: 40px;
  height: 40px;

  display: flex;
  align-items: center;
  justify-content: center;

  border:
    1px solid
    var(--color-surface-hover);

  border-radius: 50%;

  background: transparent;

  color: var(--color-text);

  cursor: pointer;

  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    transform 0.1s ease;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;

    &:hover {
      color: var(--color-text);
      border-color: var(--color-surface-hover);
    }
  }
`;


const Divider = styled.div`
  flex-shrink: 0;

  margin-top: 1.25rem;

  border-top:
    1px solid
    var(--color-surface-hover);
`;


const Bio = styled.p`
  flex-shrink: 0;

  margin: 0;

  padding-top: 1.25rem;

  line-height: 1.5;

  color: var(--color-text);
`;


// =============================================================================
// Profile preview
// =============================================================================

const PreviewSection = styled.div`
  flex: 1;
  min-height: 0;

  margin-top: 1.5rem;

  display: flex;
  flex-direction: column;
`;


const PreviewTabs = styled.div`
  flex-shrink: 0;

  display: flex;
  justify-content: flex-start;

  gap: 1.5rem;

  border-bottom: 1px solid var(--color-surface-hover);
`;


const PreviewTab = styled.button`
  position: relative;

  background: none;
  border: none;

  padding: 0 0 0.75rem;

  font-size: 0.95rem;
  font-weight: 600;

  cursor: pointer;

  color: ${({ $active }) =>
    $active
      ? "var(--color-text)"
      : "var(--color-text-muted)"};

  border-bottom: none;

  margin-bottom: -1px;

  transition: color 0.15s ease;

  &::after {
    content: "";

    position: absolute;

    left: 0;
    right: 0;
    bottom: 0;

    height: 2px;

    background:
      ${({ $active }) =>
        $active
          ? "var(--color-accent)"
          : "transparent"};
  }

  &:hover {
    color: var(--color-text);
  }
`;

const PreviewPanel = styled.div`
  flex: 1;
  min-height: 0;

  margin-top: 0.75rem;

  display: flex;
  flex-direction: column;

  gap: 4px;

  overflow-y: auto;
`;


// =============================================================================
// Management
// =============================================================================

const ManagementHeader = styled.div`
  flex-shrink: 0;

  display: grid;

  grid-template-columns: 80px 1fr 80px;

  align-items: center;

  min-height: 48px;

  margin-top: 1.5rem;

  padding-bottom: 0.75rem;

  border-bottom:
    1px solid
    var(--color-surface-hover);
`;


const BackButton = styled.button`
  justify-self: start;

  border:
    1px solid
    var(--color-surface-hover);

  border-radius: 999px;

  background: transparent;

  color: var(--color-text);

  display: inline-flex;

  align-items: center;

  gap: 0.45rem;

  padding: 0.45rem 0.75rem;

  cursor: pointer;

  transition:
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
`;


const ManagementTitle = styled.h3`
  margin: 0;

  text-align: center;

  font-size: 1.05rem;
  font-weight: 700;

  color: var(--color-text);
`;


const HeaderSpacer = styled.div`
  width: 80px;
`;


const ManagementTabs = styled.div`
  flex-shrink: 0;

  display: flex;
  justify-content: flex-start;
  align-items: center;

  gap: 1.5rem;

  padding: 1rem 0 0.75rem;

  border-bottom: 1px solid var(--color-surface-hover);
`;


const ManagementTab = styled.button`
  position: relative;

  border: none;
  background: none;

  padding: 0 0 0.65rem;

  color: ${({ $active }) =>
    $active
      ? "var(--color-text)"
      : "var(--color-text-muted)"};

  font-size: 0.95rem;
  font-weight: 600;

  cursor: pointer;

  transition: color 0.15s ease;

  &::after {
    content: "";

    position: absolute;

    left: 0;
    right: 0;
    bottom: -1px;

    height: 2px;

    background:
      ${({ $active }) =>
        $active
          ? "var(--color-accent)"
          : "transparent"};
  }

  &:hover {
    color: var(--color-text);
  }
`;


const ManagementContent = styled.div`
  flex: 1;
  min-height: 0;

  display: flex;

  flex-direction: column;
`;


const InlineError = styled.div`
  flex-shrink: 0;

  margin-bottom: 0.75rem;

  color:
    var(--color-danger, var(--color-accent));

  font-size: 0.9rem;
`;


const ExpandedListPanel = styled.div`
  flex: 1;
  min-height: 0;

  overflow-y: auto;

  display: flex;
  flex-direction: column;

  gap: 4px;
`;


// =============================================================================
// Lists
// =============================================================================

const ListRow = styled.div`
  display: flex;

  align-items: center;

  gap: 10px;

  padding: 8px 4px;

  border-radius: 10px;

  transition:
    background 0.15s ease;

  &:hover {
    background:
      var(--color-surface-hover);
  }
`;


const RowAvatar = styled.div`
  flex-shrink: 0;

  width: 36px;
  height: 36px;

  border-radius: 50%;

  display: grid;
  place-items: center;

  font-size: 0.85rem;
  font-weight: 700;

  color: var(--color-text);

  background:
    var(--color-surface-hover);
`;


const RowName = styled.span`
  flex: 1;

  min-width: 0;

  font-size: 0.95rem;

  color: var(--color-text);

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;
`;


const ActionButton = styled.button`
  flex-shrink: 0;

  width: 30px;
  height: 30px;

  border-radius: 8px;

  border:
    1px solid
    var(--color-surface-hover);

  background: transparent;

  color: var(--color-text-muted);

  display: grid;
  place-items: center;

  cursor: pointer;

  &:hover {
    color: var(--color-accent);

    border-color:
      var(--color-accent);
  }
`;


const RequestRow = styled(ListRow)`
  justify-content: space-between;
`;


const RequestActions = styled.div`
  display: flex;

  align-items: center;

  gap: 0.45rem;
`;


const EmptyState = styled.div`
  flex-shrink: 0;

  padding: 1.5rem 4px;

  color: var(--color-text-muted);

  font-size: 0.9rem;

  text-align: center;
`;


// =============================================================================
// Add friend
// =============================================================================

const AddPanel = styled.form`
  display: flex;

  flex-direction: column;

  gap: 0.75rem;

  padding-top: 0.25rem;
`;


const AddRow = styled.div`
  display: flex;

  gap: 0.65rem;

  align-items: center;
`;


const AddInput = styled.input`
  flex: 1;

  min-width: 0;

  ${inputBase}
`;


const AddButton = styled.button`
  flex-shrink: 0;

  border:
    1px solid
    var(--color-accent);

  border-radius: 999px;

  background:
    var(--color-accent);

  color: #fff;

  padding: 0.5rem 0.9rem;

  font-weight: 600;

  cursor: pointer;

  &:disabled {
    opacity: 0.5;

    cursor: not-allowed;
  }
`;


const HelperRow = styled.div`
  display: inline-flex;

  align-items: center;

  gap: 0.35rem;

  color: var(--color-text-muted);

  font-size: 0.85rem;
`;


// =============================================================================
// See all / Load more
// =============================================================================

const CenteredButtonWrap = styled.div`
  flex-shrink: 0;

  display: flex;

  justify-content: center;

  padding: 0.75rem 0 0.25rem;
`;


const PillButton = styled.button`
  border:
    1px solid
    var(--color-surface-hover);

  border-radius: 999px;

  background: transparent;

  color: var(--color-text);

  padding: 0.5rem 1rem;

  font-weight: 600;

  cursor: pointer;

  transition:
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    color: var(--color-accent);

    border-color:
      var(--color-accent);
  }

  &:disabled {
    opacity: 0.5;

    cursor: not-allowed;
  }
`;


// =============================================================================
// Confirmation
// =============================================================================

const ConfirmBackdrop = styled.div`
  position: absolute;

  inset: 0;

  background:
    rgba(0, 0, 0, 0.45);

  display: grid;

  place-items: center;

  padding: 1rem;

  z-index: 10;
`;


const ConfirmCard = styled.div`
  width: min(92vw, 360px);

  background:
    var(--color-bg);

  border:
    1px solid
    var(--color-surface-hover);

  border-radius: 12px;

  padding: 1rem;

  box-shadow:
    0 16px 40px
    rgba(0, 0, 0, 0.25);
`;


const ConfirmTitle = styled.h4`
  margin: 0;

  color: var(--color-text);
`;


const ConfirmText = styled.p`
  margin: 0.75rem 0 1rem;

  color: var(--color-text-muted);

  font-size: 0.9rem;

  line-height: 1.5;
`;


const ConfirmErrorText = styled.p`
  margin: 0 0 1rem;

  color:
    var(--color-danger, var(--color-accent));

  font-size: 0.85rem;
`;


const ConfirmActions = styled.div`
  display: flex;

  justify-content: flex-end;

  gap: 0.5rem;
`;


const ConfirmButton = styled.button`
  border-radius: 8px;

  border:
    1px solid
    ${({ $danger }) =>
      $danger
        ? "var(--color-danger, var(--color-accent))"
        : "var(--color-surface-hover)"};

  background:
    ${({ $danger }) =>
      $danger
        ? "var(--color-danger, var(--color-accent))"
        : "transparent"};

  color:
    ${({ $danger }) =>
      $danger
        ? "#fff"
        : "var(--color-text)"};

  padding: 0.45rem 0.8rem;

  cursor: pointer;

  font-weight: 600;

  &:disabled {
    opacity: 0.5;

    cursor: not-allowed;
  }
`;