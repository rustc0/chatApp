import { useState } from "react";
import styled from "styled-components";
import { TbCheck, TbX } from "react-icons/tb";
import { Button, Input } from "../ui";

const Form = styled.form`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: var(--space-2) 0 10px;
  padding: 6px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);

  &:focus-within {
    border-color: var(--accent-500);
  }
`;

const NameInput = styled(Input)`
  min-width: 0;
  flex: 1;
  height: 34px;
  padding: 0 10px;
  border: 0;
  background: transparent;
  font-size: var(--text-sm);

  &:focus {
    box-shadow: none;
  }
`;

function CreateRoomInput({ onCreate, onCancel }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    onCreate(trimmedName);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <NameInput
        autoFocus
        placeholder="Room name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="New room name"
        maxLength={50}
      />

      <Button
        type="button"
        $variant="ghost"
        $size="sm"
        onClick={onCancel}
        title="Cancel"
      >
        <TbX size={16} />
      </Button>

      <Button type="submit" $size="sm" disabled={!name.trim()} title="Create room">
        <TbCheck size={16} />
      </Button>
    </Form>
  );
}

export default CreateRoomInput;
