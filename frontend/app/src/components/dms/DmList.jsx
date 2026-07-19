import DmItem from "./DmItem";
import DmItemSkeleton from "./DmItemSkeleton";
import styled from "styled-components";

const DmListRoot = styled.ul`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  margin: 16px 0 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
`;

const DmListErrorItem = styled.li`
  display: block;
  width: auto;
  text-align: center;
  font-weight: 700;
  color: var(--color-text-muted);
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
        <DmListErrorItem>Failed to load conversations.</DmListErrorItem>
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