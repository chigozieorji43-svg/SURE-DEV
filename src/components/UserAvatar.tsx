import React from 'react';

interface UserAvatarProps {
  name?: string;
  email?: string;
  src?: string;
  hasCustomProfileImage?: boolean;
  className?: string;
  sizeClassName?: string;
  roundedClassName?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = '',
  email = '',
  src = '',
  hasCustomProfileImage = false,
  className = '',
  sizeClassName = 'w-10 h-10',
  roundedClassName = 'rounded-full',
}) => {
  const isDefaultUnsplash = (url?: string) => {
    if (!url) return true;
    return (
      url.includes('unsplash.com/photo-1534528741775-53994a69daeb') || // dev default
      url.includes('unsplash.com/photo-1486406146926-c627a92ad1ab') || // emp default
      url.includes('unsplash.com/photo-1618005182384-a83a8bd57fbe')    // cover/logo fallbacks
    );
  };

  const useLetterAvatar = !hasCustomProfileImage && (!src || isDefaultUnsplash(src));

  if (useLetterAvatar) {
    const displayName = name || email.split('@')[0] || '?';
    const firstLetter = displayName.trim().charAt(0).toUpperCase();

    // Stable background colors based on name / email
    const colors = [
      'bg-indigo-600 text-white',
      'bg-emerald-600 text-white',
      'bg-blue-600 text-white',
      'bg-amber-600 text-white',
      'bg-rose-600 text-white',
      'bg-purple-600 text-white',
      'bg-cyan-600 text-white',
      'bg-teal-600 text-white',
      'bg-orange-600 text-white',
      'bg-violet-600 text-white'
    ];

    let hash = 0;
    const str = displayName + (email || '');
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorClass = colors[Math.abs(hash) % colors.length];

    return (
      <div
        className={`${roundedClassName} flex items-center justify-center font-bold tracking-tight select-none border border-black/5 dark:border-white/10 ${sizeClassName} ${colorClass} ${className}`}
        title={displayName}
      >
        {firstLetter}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || 'Avatar'}
      referrerPolicy="no-referrer"
      className={`${roundedClassName} object-cover border border-brand-border/60 ${sizeClassName} ${className}`}
    />
  );
};
