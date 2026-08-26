import { useEffect, useState } from "react";
import styled from "styled-components";
import RoomHeader from "./RoomHeader";
import RoomContent from "./RoomContent";
import MessageComposer from "./MessageComposer";
import MembersSidebar from "./MembersSidebar";
import { getRoom } from "../../api/rooms";

const RoomViewShell = styled.section`
  display: flex;
  height: 100%;
  min-width: 0;
`;

const RoomMain = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding: 16px;
`;

function RoomView({ roomId, roomName }) {
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [roomChat, setRoomChat] = useState([]);
  const [isLoading, setIsLoading] = useState("loading");

  useEffect(() => {
    let isCanceled = false;
    async function loadRoom() {
      setIsLoading("loading");
      try {
        await getRoom(roomId);
        if (!isCanceled) {
          setRoomChat([]);
          setIsLoading("success");
        }
      } catch (error) {
        if (!isCanceled) setIsLoading("error");
      }
    }

    loadRoom();
    return () => {
      isCanceled = true;
    };
  }, [roomId]);

  return (
    <RoomViewShell>
      <RoomMain>
        <RoomHeader
          roomName={roomName}
          onToggleMembers={() => setIsMembersOpen((open) => !open)}
        />

        <RoomContent roomChat={roomChat} state={isLoading} roomName={roomName} />
        <MessageComposer roomName={roomName} />
      </RoomMain>

      {isMembersOpen && <MembersSidebar roomId={roomId} />}
    </RoomViewShell>
  );
}

export default RoomView;