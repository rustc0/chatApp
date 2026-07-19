import styled from "styled-components";

const MessageComposerForm = styled.form`
	display: flex;
	gap: 8px;
	padding: 12px;

	input {
		min-width: 0;
		flex: 1;
		border: 0;
		border-radius: 8px;
		padding: 12px;
		outline: none;
		background: var(--color-surface-hover);
		color: var(--color-text-muted);
	}

	button {
		border: 0;
		border-radius: 8px;
		padding: 0 16px;
		background: transparent;
		color: var(--color-accent);
	}

	button:hover {
		background: var(--color-accent);
		color: white;
	}
`;

function MessageComposer({ roomName }) {
	function handleSubmit(event) {
	  event.preventDefault();
	}

	return (
	  <MessageComposerForm onSubmit={handleSubmit}>
		<input
		  type="text"
		  placeholder={`Message #${roomName}`}
		  aria-label={`Message #${roomName}`}
		/>
		<button type="submit">Send</button>
	  </MessageComposerForm>
	);
	}

	export default MessageComposer;