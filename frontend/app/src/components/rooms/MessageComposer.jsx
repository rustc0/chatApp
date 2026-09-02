import { useState } from "react";
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

	button:hover:not(:disabled) {
		background: var(--color-accent);
		color: white;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

function MessageComposer({ roomName, isDm, onSend, disabled }) {
	const [text, setText] = useState("");
	const label = isDm ? `Message ${roomName}` : `Message #${roomName}`;

	async function handleSubmit(event) {
	  event.preventDefault();

	  const trimmed = text.trim();
	  if (!trimmed || disabled) return;

	  await onSend?.(trimmed);
	  setText("");
	}

	return (
	  <MessageComposerForm onSubmit={handleSubmit}>
		<input
		  type="text"
		  value={text}
		  onChange={(event) => setText(event.target.value)}
		  placeholder={label}
		  aria-label={label}
		  disabled={disabled}
		/>
		<button type="submit" disabled={disabled}>Send</button>
	  </MessageComposerForm>
	);
	}

	export default MessageComposer;