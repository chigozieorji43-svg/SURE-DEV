import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  name?: string;
  email?: string;
  src?: string;
  hasCustomProfileImage?: boolean;
  className?: string;
  sizeClassName?: string;
  roundedClassName?: string;
  onClick?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = '',
  email = '',
  src = '',
  className = '',
  sizeClassName = 'w-10 h-10',
  roundedClassName = 'rounded-full',
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state immediately whenever src prop updates
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const showImage = Boolean(src) && !imgError;

  if (!showImage) {
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
        onClick={onClick}
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
      onError={() => setImgError(true)}
      onClick={onClick}
      className={`${roundedClassName} object-cover border border-brand-border/60 ${sizeClassName} ${className}`}
    />
  );
};

