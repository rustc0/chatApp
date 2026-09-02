import styled from "styled-components";
import { TbUserX } from "react-icons/tb";
import { useOpenUserPreview } from "../../hooks/useOpenUserPreview";

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

const MemberIdentity = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
	flex: 1;

	border: 0;
	background: transparent;
	padding: 0;

	cursor: pointer;

	&:hover span {
		text-decoration: underline;
	}
`;

const MemberAvatar = styled.span`
	display: grid;
	width: 22px;
	height: 22px;
	flex-shrink: 0;
	place-items: center;
	border-radius: 50%;
	background: var(--color-surface-hover);
	color: var(--color-text);
	font-size: 11px;
	font-weight: 700;
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
	const openPreview = useOpenUserPreview();

	return (
	  <MemberItemRoot>
		<MemberStatus $online={member.status === "online"} aria-label={member.status} />

		<MemberIdentity type="button" onClick={openPreview(member.username)}>
		  <MemberAvatar>{member.username?.charAt(0)?.toUpperCase() || "?"}</MemberAvatar>
		  <MemberName>{member.username}</MemberName>
		</MemberIdentity>

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