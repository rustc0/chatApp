import styled from "styled-components";
import { TbMessageOff, TbPlugConnectedX } from "react-icons/tb";
import DmItem from "./DmItem";
import DmItemSkeleton from "./DmItemSkeleton";
import { EmptyState } from "../ui";

const DmListRoot = styled.ul`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);
  margin: var(--space-4) 0 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
`;

function DmList({ conversations, state }) {
  if (state === "loading") {
    return (
      <DmListRoot aria-busy="true">
        {Array.from({ length: 10 }).map((_, index) => (
          <DmItemSkeleton key={index} />
        ))}
      </DmListRoot>
    );
  }

  if (state === "error") {
    return (
      <DmListRoot>
        <li>
          <EmptyState
            icon={TbPlugConnectedX}
            title="Failed to load conversations."
            hint="Check your connection and try again."
          />
        </li>
      </DmListRoot>
    );
  }

  if (!conversations.length) {
    return (
      <DmListRoot>
        <li>
          <EmptyState
            icon={TbMessageOff}
            title="No conversations yet"
            hint="Open someone's profile to start a direct message."
          />
        </li>
      </DmListRoot>
    );
  }

  return (
    <DmListRoot>
      {conversations.map((conversation) => (
        <DmItem key={conversation.id} conversation={conversation} />
      ))}
    </DmListRoot>
  );
}

export default DmList;
