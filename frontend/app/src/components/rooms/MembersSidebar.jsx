import MemberList from "./MemberList";
import { getRoomMembers } from "../../api/rooms";
import { useEffect, useState } from "react";
import styled from "styled-components";

const MembersSidebarRoot = styled.aside`
  width: 260px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 16px;
  border-left: 1px solid var(--color-text);
  background: var(--color-bg);

  @media (max-width: 700px) {
    display: none;
  }
`;

const MembersTitle = styled.h3`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 13px;
  text-transform: uppercase;
`;

function MembersSidebar( { roomId } ) {
  const [loading, setLoading] = useState("loading");
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading("loading");
      try {
        const roomMembers = await getRoomMembers(roomId);
        setMembers(roomMembers);
        setLoading("success");
      } catch (error) {
        console.error("Error fetching room members:", error);
        setLoading("error");
      }
    };

    fetchMembers();
  }, [roomId]);

  return (
    <MembersSidebarRoot>
      <MembersTitle>Members — {members.length}</MembersTitle>
      {loading === "loading" && <p>Loading members...</p>}
      {loading === "error" && <p>Error loading members.</p>}
      {loading === "success" && <MemberList members={members} />}
    </MembersSidebarRoot>
  );
}

export default MembersSidebar;