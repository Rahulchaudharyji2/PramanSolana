import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'purple' | 'green' | 'amber' | 'red' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  const variantStyles = {
    blue: 'bg-[#397BFF]/10 text-[#397BFF] border border-[#397BFF]/30',
    purple: 'bg-[#8B5CF6]/10 text-[#A78BFA] border border-[#8B5CF6]/30',
    green: 'bg-[#10B981]/10 text-[#34D399] border border-[#10B981]/30',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    red: 'bg-red-500/10 text-red-400 border border-red-500/30',
    neutral: 'bg-[#1E2538] text-[#94A3B8] border border-[#2A344D]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

