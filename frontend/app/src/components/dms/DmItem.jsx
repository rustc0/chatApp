import styled from "styled-components";
import { useOpenUserPreview } from "../../hooks/useOpenUserPreview";

const DmItemRoot = styled.li`
	display: flex;
	width: 100%;
	min-width: 0;
`;

const DmItemButton = styled.button`
	display: flex;
	align-items: center;
	width: 100%;
	min-width: 0;
	gap: 12px;
	border: 0;
	border-radius: 6px;
	padding: 10px;
	background: transparent;
	color: var(--color-text-muted);
	text-align: left;

	&:hover {
		background: var(--color-surface-hover);
	}
`;

const DmAvatar = styled.div`
	position: relative;
	display: grid;
	width: 44px;
	height: 44px;
	flex-shrink: 0;
	place-items: center;
	border-radius: 50%;
	background: var(--color-accent);
	font-weight: bold;
	cursor: pointer;
`;

const DmStatus = styled.span`
	position: absolute;
	right: -1px;
	bottom: -1px;
	width: 13px;
	height: 13px;
	border: 3px solid var(--color-bg);
	border-radius: 50%;
	background: ${({ $online }) => ($online ? "var(--color-online)" : "var(--color-text)")};
`;

const DmDetails = styled.div`
	display: flex;
	min-width: 0;
	flex: 1;
	flex-direction: column;
	gap: 4px;

	strong,
	span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	strong {
		color: var(--color-text-muted);
		cursor: pointer;
		width: fit-content;

		&:hover {
			text-decoration: underline;
		}
	}

	span {
		color: var(--color-text);
		font-size: 14px;
	}
`;

const DmTimestamp = styled.time`
	align-self: flex-start;
	flex-shrink: 0;
	color: var(--color-text-muted);
	font-size: 12px;
`;

function DmItem({ conversation }) {
	const initial = conversation.username?.charAt(0)?.toUpperCase() || "?";
	const openPreview = useOpenUserPreview();

	return (
	  <DmItemRoot>
		<DmItemButton type="button">
		  <DmAvatar onClick={openPreview(conversation.username)}>
			{initial}
			<DmStatus $online={conversation.status === "online"} aria-label={conversation.status} />
		  </DmAvatar>

		  <DmDetails>
			<strong onClick={openPreview(conversation.username)}>{conversation.username}</strong>
			<span>
				{conversation.lastMessage.length < 42 ? conversation.lastMessage : `${conversation.lastMessage.substring(0, 39)}...`}
			</span>
		  </DmDetails>

		  <DmTimestamp>{conversation.timestamp}</DmTimestamp>
		</DmItemButton>
	  </DmItemRoot>
	);
	}

	export default DmItem;