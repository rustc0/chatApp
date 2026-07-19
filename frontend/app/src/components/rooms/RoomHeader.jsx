import styled from "styled-components";

const PanelHeader = styled.header`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 16px;
	border-bottom: 1px solid var(--color-text);

	h2 {
		transform: translateY(-8px);
		margin: 10px 0;
		font-size: 16px;
	}

	button {
		transform: translateY(-8px);
		border: 0;
		border-radius: 4px;
		padding: 8px 12px;
		background: transparent;
		color: var(--color-text-muted);
	}

	button:hover {
		background: var(--color-accent);
	}
`;

function RoomHeader({ roomName, onToggleMembers }) {
	return (
	  <PanelHeader>
		<h2># {roomName}</h2>

		<button type="button" onClick={onToggleMembers}>
		Members
		</button>
	  </PanelHeader>
	);
	}

	export default RoomHeader;