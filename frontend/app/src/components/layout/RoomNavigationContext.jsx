import { createContext, useContext } from "react";

const RoomNavigationContext = createContext({ navigateToRoom: () => {} });

export function RoomNavigationProvider({ navigateToRoom, children }) {
  return (
    <RoomNavigationContext.Provider value={{ navigateToRoom }}>
      {children}
    </RoomNavigationContext.Provider>
  );
}

export function useRoomNavigation() {
  return useContext(RoomNavigationContext);
}
