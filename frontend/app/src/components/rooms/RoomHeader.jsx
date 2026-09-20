import styled from "styled-components";
import { TbHash, TbMessageCircle, TbUsers } from "react-icons/tb";
import { Button } from "../ui";

const PanelHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  color: var(--text-tertiary);

  h2 {
    overflow: hidden;
    margin: 0;
    color: var(--text-primary);
    font-size: var(--text-lg);
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

function RoomHeader({ roomName, isDm, onToggleMembers }) {
  const TitleIcon = isDm ? TbMessageCircle : TbHash;

  return (
    <PanelHeader>
      <HeaderTitle>
        <TitleIcon size={20} />
        <h2>{roomName}</h2>
      </HeaderTitle>

      <Button
        type="button"
        $variant="ghost"
        $size="sm"
        onClick={onToggleMembers}
        title="Toggle members"
      >
        <TbUsers size={18} />
        Members
      </Button>
    </PanelHeader>
  );
}

export default RoomHeader;
