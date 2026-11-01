import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[#94A3B8]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-[#080A0F] border ${
          error ? 'border-red-500 focus:border-red-500' : 'border-[#1E2538] focus:border-[#397BFF]'
        } rounded-lg px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none transition-colors duration-150 focus:ring-1 focus:ring-[#397BFF]/30 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
      {!error && helperText && <span className="text-xs text-[#64748B]">{helperText}</span>}
    </div>
  );
};

