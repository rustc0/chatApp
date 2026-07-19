import styled, { keyframes } from "styled-components";

const pulse = keyframes`
	0%,
	100% {
		opacity: 1;
	}

	50% {
		opacity: 0.45;
	}
`;

const SkeletonBlock = styled.span`
	display: block;
	background: var(--color-surface-hover);
	border-radius: 6px;
	animation: ${pulse} 1.5s infinite ease-in-out;
`;

const SkeletonItem = styled.div`
	display: flex;
	align-items: center;
	width: 100%;
	gap: 12px;
	padding: 10px;
	border-radius: 6px;
`;

const SkeletonAvatar = styled(SkeletonBlock)`
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

const SkeletonName = styled(SkeletonBlock)`
	width: 120px;
	height: 14px;
	margin-bottom: 8px;
`;

const SkeletonMessage = styled(SkeletonBlock)`
	width: 180px;
	height: 12px;
`;

const SkeletonTime = styled(SkeletonBlock)`
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