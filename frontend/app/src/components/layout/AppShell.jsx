import { useState } from "react";
import styled from "styled-components";
import Sidebar from "./Sidebar";
import MainPanel from "./MainPanel";
import ProfileOverlay from "./ProfileOverlay";
import { ProfileOverlayProvider, useProfileOverlay } from "./ProfileOverlayContext";

const AppShellRoot = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
`;

const MainContent = styled.main`
  position: relative;
  min-width: 0;
  flex: 1;
  background: var(--color-bg);

  &::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 42px;
    content: "";
    pointer-events: none;
    background: linear-gradient(to right, rgba(0, 0, 0, 0.1), transparent);
  }
`;

function AppShellContent({ onLogout }) {
  const [isDirectMessages, setIsDirectMessages] = useState(true);
  const [activeRoomId, setActiveRoomId] = useState(null);

  const { profile, closeProfile } = useProfileOverlay();

  function handleRoomChange(roomId) {
    setActiveRoomId(roomId);
    setIsDirectMessages(false);
  }

  return (
    <>
      <AppShellRoot>
        <Sidebar
          isDirectMessages={isDirectMessages}
          activeRoomId={activeRoomId?.id}
          onRoomChange={handleRoomChange}
          onDirectMessages={() => setIsDirectMessages(true)}
          onLogout={onLogout}
        />

        <MainContent>
          <MainPanel
            activeView={isDirectMessages ? true : activeRoomId}
          />
        </MainContent>
      </AppShellRoot>

      {profile && (
        <ProfileOverlay
          user={profile}
          onClose={closeProfile}
        />
      )}
    </>
  );
}

function AppShell({ onLogout }) {
  return (
    <ProfileOverlayProvider>
      <AppShellContent onLogout={onLogout} />
    </ProfileOverlayProvider>
  );
}

export default AppShell;