import { createContext, useContext, useState } from "react";

const ProfileOverlayContext = createContext();

export function ProfileOverlayProvider({ children }) {
  const [profile, setProfile] = useState(null);

  function openProfile(user) {
    setProfile(user);
  }

  function closeProfile() {
    setProfile(null);
  }

  return (
    <ProfileOverlayContext.Provider
      value={{
        profile,
        openProfile,
        closeProfile,
      }}
    >
      {children}
    </ProfileOverlayContext.Provider>
  );
}

export function useProfileOverlay() {
  return useContext(ProfileOverlayContext);
}