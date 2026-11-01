import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'blue' | 'purple' | 'green' | 'none';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glow = 'none',
  interactive = false,
  className = '',
  ...props
}) => {
  const glowStyles = {
    none: '',
    blue: 'border-[#397BFF]/30 hover:border-[#397BFF]/70 shadow-lg shadow-[#397BFF]/5',
    purple: 'border-[#8B5CF6]/30 hover:border-[#8B5CF6]/70 shadow-lg shadow-[#8B5CF6]/5',
    green: 'border-[#10B981]/30 hover:border-[#10B981]/70 shadow-lg shadow-[#10B981]/5',
  };

  const interactiveStyles = interactive
    ? 'hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 cursor-pointer'
    : '';

  return (
    <div
      className={`bg-[#0F121C] border border-[#1E2538] rounded-xl p-6 ${glowStyles[glow]} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

