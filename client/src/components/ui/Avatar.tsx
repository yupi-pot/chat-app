interface Props {
  username: string;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-2xl',
};

export function Avatar({ username, avatar, size = 'sm' }: Props) {
  const sizeClass = sizeMap[size];

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={username}
        className={`${sizeClass} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gray-600 flex items-center justify-center font-bold text-white shrink-0`}
    >
      {username[0].toUpperCase()}
    </div>
  );
}
