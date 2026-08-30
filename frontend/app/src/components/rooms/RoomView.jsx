import { useState } from "react";
import styled from "styled-components";
import RoomHeader from "./RoomHeader";
import RoomContent from "./RoomContent";
import MessageComposer from "./MessageComposer";
import MembersSidebar from "./MembersSidebar";
import { useRoomMessages } from "../../hooks/useRoomMessages";

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
  const { messages, state, sending, send } = useRoomMessages(roomId);

  return (
    <RoomViewShell>
      <RoomMain>
        <RoomHeader
          roomName={roomName}
          onToggleMembers={() => setIsMembersOpen((open) => !open)}
        />

        <RoomContent roomChat={messages} state={state} roomName={roomName} />
        <MessageComposer roomName={roomName} onSend={send} disabled={sending} />
      </RoomMain>

      {isMembersOpen && <MembersSidebar roomId={roomId} />}
    </RoomViewShell>
  );
}

export default RoomView;