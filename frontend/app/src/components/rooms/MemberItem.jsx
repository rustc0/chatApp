import styled from "styled-components";
import { TbUserX } from "react-icons/tb";

const MemberItemRoot = styled.li`
	display: flex;
	align-items: center;
	gap: 8px;
	min-height: 36px;
	padding: 6px 8px;
	border-radius: 4px;

	&:hover {
		background: var(--color-surface-hover);
	}
`;

const MemberStatus = styled.span`
	width: 9px;
	height: 9px;
	flex-shrink: 0;
	border-radius: 50%;
	background: ${({ $online }) => ($online ? "var(--color-online)" : "var(--color-text)")};
`;

const MemberName = styled.span`
	overflow: hidden;
	color: var(--color-text-muted);
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const MemberRole = styled.span`
	margin-left: auto;
	color: var(--color-text-muted);
	font-size: 12px;
	text-transform: capitalize;
`;

const KickButton = styled.button`
	flex-shrink: 0;
	width: 22px;
	height: 22px;

	display: grid;
	place-items: center;

	border: 0;
	border-radius: 6px;
	background: transparent;
	color: var(--color-text-muted);

	cursor: pointer;

	&:hover {
		color: var(--color-danger, #e5484d);
		background: var(--color-surface-hover);
	}
`;

function MemberItem({ member, canKick, onKick }) {
	return (
	  <MemberItemRoot>
		<MemberStatus $online={member.status === "online"} aria-label={member.status} />

		<MemberName>{member.username}</MemberName>

		{(member.role === "owner" || member.role === "admin") && (
		  <MemberRole>{member.role}</MemberRole>
		)}

		{canKick && (
		  <KickButton
			type="button"
			onClick={() => onKick?.(member)}
			aria-label={`Remove ${member.username} from room`}
			title={`Remove ${member.username}`}
		  >
			<TbUserX size={15} />
		  </KickButton>
		)}
	  </MemberItemRoot>
	);
	}

	export default MemberItem;