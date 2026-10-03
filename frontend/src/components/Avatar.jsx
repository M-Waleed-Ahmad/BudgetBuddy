import { useState } from 'react';

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}

/**
 * Circular avatar that shows `src` when it loads and falls back to the person's initials.
 * Pass `decorative` when the surrounding control already names the person.
 */
const Avatar = ({ src, name, size = 36, className = '', decorative = false }) => {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = Boolean(src) && failedSrc !== src;
  const label = name ? `${name}'s profile picture` : 'Profile picture';

  return (
    <span
      className={`avatar ${className}`.trim()}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.4)) }}
      aria-hidden={decorative || undefined}
      role={!decorative && !showImage ? 'img' : undefined}
      aria-label={!decorative && !showImage ? label : undefined}
    >
      {showImage ? (
        <img src={src} alt={decorative ? '' : label} onError={() => setFailedSrc(src)} />
      ) : (
        getInitials(name)
      )}
    </span>
  );
};

export default Avatar;
