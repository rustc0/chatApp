import { useState } from "react";
import styled from "styled-components";

const Form = styled.form`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 10px;
  padding: 6px;
  border: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  &:focus-within {
    border-color: color-mix(
      in srgb,
      var(--color-accent) 50%,
      transparent
    );
  }
`;

const Input = styled.input`
  min-width: 0;
  flex: 1;
  height: 34px;
  padding: 0 10px;

  border: 0;
  outline: 0;
  border-radius: 7px;

  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 13px;

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 0.7;
  }

  &:focus {
    background: color-mix(in srgb, var(--color-text) 5%, transparent);
  }
`;

const Button = styled.button`
  flex-shrink: 0;
  height: 34px;
  padding: 0 12px;

  border: 0;
  border-radius: 7px;

  background: var(--color-accent);
  color: white;

  font: inherit;
  font-size: 13px;
  font-weight: 600;

  cursor: pointer;
  transition:
    transform 120ms ease,
    filter 120ms ease,
    box-shadow 120ms ease;

  &:hover {
    filter: brightness(1.08);
    box-shadow: 0 3px 8px
      color-mix(in srgb, var(--color-accent) 25%, transparent);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`;

const Cancel = styled.button`
  flex-shrink: 0;
  height: 34px;
  padding: 0 8px;

  border: 0;
  border-radius: 7px;
  background: transparent;

  color: var(--color-text-muted);
  font: inherit;
  font-size: 13px;

  cursor: pointer;
  transition:
    color 120ms ease,
    background 120ms ease;

  &:hover {
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-text) 7%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
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
      <Input
        autoFocus
        placeholder="Room name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="New room name"
        maxLength={50}
      />

      <Cancel type="button" onClick={onCancel}>
        Cancel
      </Cancel>

      <Button type="submit" disabled={!name.trim()}>
        Create
      </Button>
    </Form>
  );
}

export default CreateRoomInput;