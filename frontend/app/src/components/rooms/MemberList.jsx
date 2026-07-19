import MemberItem from "./MemberItem";
import styled from "styled-components";

const MemberListRoot = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
`;

function MemberList({ members }) {
  return (
    <MemberListRoot>
      {members.map((member) => (
        <MemberItem key={member.id} member={member} />
      ))}
    </MemberListRoot>
  );
}

export default MemberList;