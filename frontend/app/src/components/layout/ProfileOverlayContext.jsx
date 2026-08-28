import { createContext, useContext, useEffect, useState } from "react";
import { getMe } from "../../api/authentication.js";

const ProfileOverlayContext = createContext();

export function ProfileOverlayProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  async function fetchCurrentUser() {
    const user = await getMe();
    setCurrentUser(user);
    return user;
  }

  async function refreshProfile() {
    setLoadingProfile(true);

    try {
      const user = await fetchCurrentUser();
      setProfile(user);
      return user;
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const user = await fetchCurrentUser();

        if (active) {
          setCurrentUser(user);
        }
      } catch (error) {
        if (active) {
          console.error("Error fetching user data:", error);
        }
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  async function openProfile() {
    await refreshProfile();
  }

  function closeProfile() {
    setProfile(null);
  }

  return (
    <ProfileOverlayContext.Provider
      value={{
        currentUser,
        profile,
        loadingProfile,
        openProfile,
        closeProfile,
        refreshProfile,
      }}
    >
      {children}
    </ProfileOverlayContext.Provider>
  );
}

export function useProfileOverlay() {
  return useContext(ProfileOverlayContext);
}