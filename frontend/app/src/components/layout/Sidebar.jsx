import { useEffect, useState } from "react";
import styled from "styled-components";
import { TbHash, TbLogout, TbMessageCircle, TbPlus } from "react-icons/tb";
import { useProfileOverlay } from "./ProfileOverlayContext";
import { getRooms, createRoom } from "../../api/rooms";
import CreateRoomInput from "./CreateRoomInput";
import { useAvatarUrl } from "../../hooks/useAvatarUrl";
import { Avatar, IconButton, InlineError, StatusText } from "../ui";

const SidebarRoot = styled.aside`
  display: flex;
  flex-direction: column;
  width: 280px;
  flex-shrink: 0;
  padding: var(--space-4);
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-surface);

  @media (max-width: 700px) {
    width: 76px;
    padding: 10px;
  }
`;

const SidebarHeaderBox = styled.div`
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
`;

const SidebarTitle = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--accent-500);

  @media (max-width: 700px) {
    display: none;
  }
`;

const SidebarSection = styled.section`
  padding-top: var(--space-5);
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const SectionTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  @media (max-width: 700px) {
    span {
      display: none;
    }
  }
`;

const RoomListNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: var(--space-2);
  overflow-y: auto;
  min-height: 0;
`;

/** Shared shape for the room rows and the Direct Messages entry. */
const NavItemButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  border: 0;
  border-radius: var(--radius-sm);
  padding: var(--space-2) 10px;
  background: ${({ $active }) => ($active ? "var(--accent-soft)" : "transparent")};
  color: ${({ $active }) => ($active ? "var(--text-primary)" : "var(--text-secondary)")};
  font-size: var(--text-md);
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  text-align: left;
  transition:
    background var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease);

  /* Accent bar marking the active entry. */
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    width: 3px;
    height: ${({ $active }) => ($active ? "60%" : "0")};
    border-radius: var(--radius-pill);
    background: var(--accent-500);
    transform: translateY(-50%);
    transition: height var(--dur) var(--ease);
  }

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  svg {
    flex-shrink: 0;
    color: var(--text-tertiary);
  }

  &:hover svg,
  &[data-active="true"] svg {
    color: var(--accent-400);
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 700px) {
    justify-content: center;
    padding: 10px 0;

    span {
      display: none;
    }
  }
`;

const DirectMessagesSection = styled.section`
  padding-top: var(--space-4);
`;

const ProfilePreviewBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding: var(--space-4) var(--space-2) var(--space-1);
  border-top: 1px solid var(--border-subtle);

  strong,
  span {
    display: block;
  }

  span {
    color: var(--text-tertiary);
    font-size: var(--text-xs);
  }

  @media (max-width: 700px) {
    justify-content: center;

    > div:last-of-type {
      display: none;
    }
  }
`;

const ProfileIdentity = styled.div`
  min-width: 0;
`;

export const ProfileName = styled.button`
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--text-primary);
  font-weight: 600;
  text-align: left;
  transition: color var(--dur-fast) var(--ease);

  &:hover {
    color: var(--accent-400);
  }
`;

function Sidebar({
  isDirectMessages,
  activeRoomId,
  onRoomChange,
  onDirectMessages,
  onLogout
}) {
  const { roomsRefreshTick } = useProfileOverlay();
  const [rooms, setRooms] = useState([]);
  const [loaded, setLoaded] = useState("loading");
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    async function loadRooms() {
      try {
        const data = await getRooms();
        setRooms(data);
        setLoaded("success");
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setLoaded("error");
      }
    }

    loadRooms();
  }, [roomsRefreshTick]);

  async function handleCreateRoom(name) {
    setCreateError(null);

    try {
      const newRoom = await createRoom(name);
      setRooms((prev) => [newRoom, ...prev]);
      setCreateOpen(false);
      if (onRoomChange) onRoomChange(newRoom);
    } catch (err) {
      console.error("Failed to create room:", err);
      setCreateError(err?.message || "Failed to create room");
    }
  }

  return (
    <SidebarRoot>
      <SidebarHeader />

      <DirectMessagesButton
        isDirectMessages={isDirectMessages}
        onDirectMessages={onDirectMessages}
      />

      <RoomsSection
        rooms={rooms}
        isDirectMessages={isDirectMessages}
        activeRoomId={activeRoomId}
        onRoomChange={onRoomChange}
        state={loaded}
        onCreate={() => {
          setCreateError(null);
          setCreateOpen((s) => !s);
        }}
        createOpen={createOpen}
        onSubmitCreate={handleCreateRoom}
        onCancelCreate={() => {
          setCreateOpen(false);
          setCreateError(null);
        }}
        createError={createError}
      />

      <ProfilePreview onLogout={onLogout} />
    </SidebarRoot>
  );
}

function SidebarHeader() {
  return (
    <SidebarHeaderBox>
      <SidebarTitle>FT_TRANSCENDENCE</SidebarTitle>
    </SidebarHeaderBox>
  );
}

function RoomsSection({
  rooms, isDirectMessages, activeRoomId, onRoomChange, state,
  onCreate, createOpen, onSubmitCreate, onCancelCreate, createError,
}) {
  return (
    <SidebarSection>
      <SectionTitle
        title="Rooms"
        actionLabel="Create room"
        onCreate={onCreate}
      />

      {createOpen && (
        <CreateRoomInput
          onCreate={onSubmitCreate}
          onCancel={onCancelCreate}
        />
      )}

      {createError && <InlineError role="alert">{createError}</InlineError>}

      {state === "loading" && (
        <StatusText>Loading rooms...</StatusText>
      )}

      {state === "error" && (
        <InlineError>Error loading rooms.</InlineError>
      )}

      <RoomListNav aria-label="Rooms">
        {rooms.filter((room) => room.type !== "dm").map((room) => (
          <RoomButton
            key={room.id}
            room={room}
            active={!isDirectMessages && activeRoomId === room.id}
            onClick={() => onRoomChange(room)}
          />
        ))}
      </RoomListNav>
    </SidebarSection>
  );
}

function SectionTitle({ title, actionLabel, onCreate }) {
  return (
    <SectionTitleRow>
      <span>{title}</span>
      <IconButton
        type="button"
        $size={26}
        aria-label={actionLabel}
        title={actionLabel}
        onClick={onCreate}
      >
        <TbPlus size={18} />
      </IconButton>
    </SectionTitleRow>
  );
}

function RoomButton({ room, active, onClick }) {
  return (
    <NavItemButton
      type="button"
      $active={active}
      data-active={active}
      onClick={onClick}
      title={room.name}
    >
      <TbHash size={18} />
      <span>{room.name}</span>
    </NavItemButton>
  );
}

function DirectMessagesButton({ isDirectMessages, onDirectMessages }) {
  return (
    <DirectMessagesSection>
      <NavItemButton
        type="button"
        $active={isDirectMessages}
        data-active={isDirectMessages}
        onClick={onDirectMessages}
        title="Direct Messages"
      >
        <TbMessageCircle size={18} />
        <span>Direct Messages</span>
      </NavItemButton>
    </DirectMessagesSection>
  );
}

function ProfilePreview({ onLogout }) {
  const { currentUser, openProfile } = useProfileOverlay();
  const { avatarUrl } = useAvatarUrl(currentUser?.avatar);
  const name = currentUser?.display_name || currentUser?.username;

  function openPrfl() {
    openProfile();
  }

  return (
    <ProfilePreviewBox>
      <Avatar src={avatarUrl} name={name} $size={36} />

      <ProfileIdentity>
        <ProfileName onClick={openPrfl}>{name}</ProfileName>
        <span>@{currentUser?.username}</span>
      </ProfileIdentity>

      <IconButton
        type="button"
        onClick={onLogout}
        aria-label="Log out"
        title="Log out"
        style={{ marginLeft: "auto" }}
      >
        <TbLogout size={18} />
      </IconButton>
    </ProfilePreviewBox>
  );
}

export default Sidebar;
