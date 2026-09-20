import styled from "styled-components";
import { Skeleton } from "../ui";

const SkeletonItem = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  gap: var(--space-3);
  padding: 10px;
  border-radius: var(--radius-sm);
`;

const SkeletonAvatar = styled(Skeleton)`
  width: 44px;
  height: 44px;
  border-radius: 50%;
`;

const SkeletonDetails = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
`;

const SkeletonName = styled(Skeleton)`
  width: 120px;
  height: 14px;
  margin-bottom: var(--space-2);
`;

const SkeletonMessage = styled(Skeleton)`
  width: 180px;
  height: 12px;
`;

const SkeletonTime = styled(Skeleton)`
  width: 40px;
  height: 12px;
  margin-left: auto;
`;

function DmItemSkeleton() {
  return (
    <li>
      <SkeletonItem>
        <SkeletonAvatar />

        <SkeletonDetails>
          <SkeletonName />
          <SkeletonMessage />
        </SkeletonDetails>

        <SkeletonTime />
      </SkeletonItem>
    </li>
  );
}

export default DmItemSkeleton;
