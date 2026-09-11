import type { ButtonHTMLAttributes } from 'react';

const variants = {
  buy: 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400',
  sell: 'bg-rose-500 text-neutral-950 hover:bg-rose-400',
  secondary: 'border border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10',
};

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Button({ variant = 'secondary', size = 'sm', type = 'button', className = '', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
