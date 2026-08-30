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

function canKickMember({ currentUserId, currentUserRole, member }) {
  if (currentUserRole !== "owner" && currentUserRole !== "admin") return false;
  if (member.id === currentUserId) return false;
  if (member.role === "owner") return false;
  if (currentUserRole === "admin" && member.role === "admin") return false;
  return true;
}

function MemberList({ members, currentUserId, currentUserRole, onKick }) {
  return (
    <MemberListRoot>
      {members.map((member) => (
        <MemberItem
          key={member.id}
          member={member}
          canKick={canKickMember({ currentUserId, currentUserRole, member })}
          onKick={onKick}
        />
      ))}
    </MemberListRoot>
  );
}

export default MemberList;