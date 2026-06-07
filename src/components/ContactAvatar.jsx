import React from 'react';

const getInitials = (name) => {
  if (!name) return 'C';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
};

export default function ContactAvatar({ name, className = '' }) {
  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white ${className}`}>
      {getInitials(name)}
    </div>
  );
}
