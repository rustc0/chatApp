import { useState } from "react";
import styled from "styled-components";
import { TbSend } from "react-icons/tb";
import { Button, Input } from "../ui";

const MessageComposerForm = styled.form`
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4) var(--space-4);
`;

const ComposerInput = styled(Input)`
  min-width: 0;
  flex: 1;
  border-radius: var(--radius-pill);
  background: var(--bg-surface);
`;

const SendButton = styled(Button)`
  @media (max-width: 700px) {
    span {
      display: none;
    }
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
      <ComposerInput
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={label}
        aria-label={label}
        disabled={disabled}
      />

      <SendButton type="submit" $pill disabled={disabled || !text.trim()}>
        <TbSend size={18} />
        <span>Send</span>
      </SendButton>
    </MessageComposerForm>
  );
}

export default MessageComposer;
