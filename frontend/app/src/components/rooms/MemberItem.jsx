import styled from "styled-components";
import { TbUserX } from "react-icons/tb";
import { useOpenUserPreview } from "../../hooks/useOpenUserPreview";
import { Avatar, IconButton, StatusDot } from "../ui";

const MemberItemRoot = styled.li`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 36px;
  padding: 6px var(--space-2);
  border-radius: var(--radius-sm);
  transition: background var(--dur-fast) var(--ease);

  &:hover {
    background: var(--bg-hover);
  }
`;

const MemberIdentity = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  flex: 1;
  border: 0;
  background: transparent;
  padding: 0;

  &:hover span:last-child {
    color: var(--accent-400);
  }
`;

const MemberName = styled.span`
  overflow: hidden;
  color: var(--text-primary);
  font-size: var(--text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--dur-fast) var(--ease);
`;

const MemberRole = styled.span`
  margin-left: auto;
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent-400);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
`;

function MemberItem({ member, canKick, onKick }) {
  const openPreview = useOpenUserPreview();

  return (
    <MemberItemRoot>
      <StatusDot $online={member.status === "online"} aria-label={member.status} />

      <MemberIdentity type="button" onClick={openPreview(member)}>
        <Avatar name={member.username} $size={22} />
        <MemberName>{member.username}</MemberName>
      </MemberIdentity>

      {(member.role === "owner" || member.role === "admin") && (
        <MemberRole>{member.role}</MemberRole>
      )}

      {canKick && (
        <IconButton
          type="button"
          $size={24}
          $danger
          onClick={() => onKick?.(member)}
          aria-label={`Remove ${member.username} from room`}
          title={`Remove ${member.username}`}
        >
          <TbUserX size={16} />
        </IconButton>
      )}
    </MemberItemRoot>
  );
}

export default MemberItem;
