import DmList from "./DmList";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { getRooms, toConversation } from "../../api/rooms";

const DmViewShell = styled.section`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  padding: 16px;
`;

const PanelHeader = styled.header`
  padding: 0 16px;
  border-bottom: 1px solid var(--color-text);

  h2 {
    transform: translateY(-8px);
    margin: 10px 0;
    font-size: 16px;
  }
`;

function DmView() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState("loading");

  useEffect(() => {
    async function loadMessages() {
      try {
        const data = await getRooms();
        const dms = (data || []).filter((r) => r.type === "dm").map(toConversation);
        setConversations(dms);
        setLoading("success");
      } catch (error) {
        console.error(error);
        setLoading("error");
      }
    }
    loadMessages();
  }, []);

  return (
    <DmViewShell>
      <PanelHeader>
        <h2>Direct Messages</h2>
      </PanelHeader>

      <DmList
        conversations={conversations}
        state={ loading }
      />
    </DmViewShell>
  );
}

export default DmView;