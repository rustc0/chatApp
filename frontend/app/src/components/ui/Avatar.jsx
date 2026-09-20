import styled from "styled-components";

export const AvatarRoot = styled.div`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: ${({ $size = 36 }) => `${$size}px`};
  height: ${({ $size = 36 }) => `${$size}px`};
  border-radius: 50%;
  overflow: hidden;
  background: var(--accent-600);
  color: var(--accent-fg);
  font-size: ${({ $size = 36 }) => `${Math.max(11, Math.round($size * 0.42))}px`};
  font-weight: 600;
  line-height: 1;
  user-select: none;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

function initialOf(name) {
  return name?.charAt(0)?.toUpperCase() || "?";
}

/** Avatar circle: shows `src` when available, otherwise the first letter of `name`. */
function Avatar({ src, name, $size = 36, ...rest }) {
  return (
    <AvatarRoot $size={$size} {...rest}>
      {src ? <img src={src} alt="" /> : initialOf(name)}
    </AvatarRoot>
  );
}

export default Avatar;
