import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { TbPencil, TbCheck, TbX } from "react-icons/tb";

// Availability hook
import { checkUsernameAvailability, updateProfile } from "../../api/profile";

const DEBOUNCE_MS = 400;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

// status: "idle" | "checking" | "available" | "taken" | "invalid" | "error"
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
        if (err.name !== "AbortError") setStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timerRef.current);
      controllerRef.current?.abort();
    };
  }, [username, currentUsername]);

  return status;
}
// ProfileOverlay component

export default function ProfileOverlay({ user, onClose, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("friends");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    displayName: user.displayName ?? "",
    username: user.username ?? "",
    bio: user.bio ?? "",
  });

  const usernameStatus = useUsernameAvailability(draft.username, user.username);

  const friends = user.friends ?? [];
  const rooms = user.rooms ?? [];

  const canSave =
    !saving &&
    draft.displayName.trim().length > 0 &&
    usernameStatus !== "checking" &&
    usernameStatus !== "taken" &&
    usernameStatus !== "invalid" &&
    usernameStatus !== "error";

  const startEditing = () => {
    setDraft({
      displayName: user.displayName ?? "",
      username: user.username ?? "",
      bio: user.bio ?? "",
    });
    setIsEditing(true);
  };

  const cancelEditing = () => setIsEditing(false);

  const saveEditing = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const updated = await updateProfile({
        display_name: draft.displayName,
        username: draft.username,
        bio: draft.bio,
      });
      onSave?.(updated);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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
              {isEditing ? (
                <>
                  <NameInput
                    value={draft.displayName}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, displayName: e.target.value }))
                    }
                    placeholder="Display name"
                  />
                  <HandleInput
                    value={draft.username}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, username: e.target.value }))
                    }
                    placeholder="username"
                    $status={usernameStatus}
                  />
                  {usernameStatus === "checking" && (
                    <HelperText>Checking availability…</HelperText>
                  )}
                  {usernameStatus === "taken" && (
                    <HelperText $error>Username taken</HelperText>
                  )}
                  {usernameStatus === "invalid" && (
                    <HelperText $error>
                      3–20 chars, letters/numbers/underscore
                    </HelperText>
                  )}
                  {usernameStatus === "available" && (
                    <HelperText $ok>Available</HelperText>
                  )}
                </>
              ) : (
                <>
                  <Username>{user.displayName}</Username>
                  {user.username && <Handle>@{user.username}</Handle>}
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
                <IconButton onClick={cancelEditing} aria-label="Cancel">
                  <TbX size={18} />
                </IconButton>
              </EditActions>
            ) : (
              <IconButton onClick={startEditing} aria-label="Edit profile">
                <TbPencil size={18} />
              </IconButton>
            )}
          </HeaderRow>

          <Divider />

          {isEditing ? (
            <BioInput
              value={draft.bio}
              onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
              placeholder="Write something about yourself..."
              rows={3}
            />
          ) : (
            <Bio>{user.bio}</Bio>
          )}

          <TabsSection>
            <TabList>
              <TabButton
                $active={activeTab === "friends"}
                onClick={() => setActiveTab("friends")}
              >
                Friends {friends.length ? `(${friends.length})` : ""}
              </TabButton>
              <TabButton
                $active={activeTab === "rooms"}
                onClick={() => setActiveTab("rooms")}
              >
                Rooms {rooms.length ? `(${rooms.length})` : ""}
              </TabButton>
            </TabList>

            <ListPanel>
              {activeTab === "friends" &&
                (friends.length ? (
                  friends.map((f) => (
                    <ListRow key={f.id}>
                      <RowAvatar src={f.avatar} alt="" />
                      <RowName>{f.displayName}</RowName>
                    </ListRow>
                  ))
                ) : (
                  <EmptyState>No friends yet</EmptyState>
                ))}

              {activeTab === "rooms" &&
                (rooms.length ? (
                  rooms.map((r) => (
                    <ListRow key={r.id}>
                      <RowAvatar src={r.avatar} alt="" />
                      <RowName>{r.name}</RowName>
                    </ListRow>
                  ))
                ) : (
                  <EmptyState>No rooms yet</EmptyState>
                ))}
            </ListPanel>
          </TabsSection>
        </Content>
      </Card>
    </Overlay>
  );
}

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
  display: flex;
  flex-direction: column;
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
  background: var(--color-surface, transparent);
  border: 1px solid var(--color-surface-hover);
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
    $status === "taken" || $status === "invalid" || $status === "error"
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
  margin-top: 1.25rem;
  border-top: 1px solid var(--color-surface-hover);
`;

const Bio = styled.p`
  margin: 0;
  padding-top: 1.25rem;
  line-height: 1.5;
  color: var(--color-text);
`;

const TabsSection = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

const TabList = styled.div`
  display: flex;
  gap: 1.5rem;
  border-bottom: 1px solid var(--color-surface-hover);
`;

const TabButton = styled.button`
  background: none;
  border: none;
  padding: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  color: ${({ $active }) =>
    $active ? "var(--color-text)" : "var(--color-text-muted)"};
  border-bottom: 2px solid
    ${({ $active }) => ($active ? "var(--color-accent)" : "transparent")};
  margin-bottom: -1px;
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: var(--color-text);
  }
`;

const ListPanel = styled.div`
  margin-top: 0.75rem;
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ListRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px;
  border-radius: 10px;
  transition: background 0.15s ease;

  &:hover {
    background: var(--color-surface-hover);
  }
`;

const RowAvatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--color-surface-hover);
`;

const RowName = styled.span`
  font-size: 0.95rem;
  color: var(--color-text);
`;

const EmptyState = styled.div`
  padding: 1.5rem 4px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
`;