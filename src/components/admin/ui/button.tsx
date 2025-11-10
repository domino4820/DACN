import type { ButtonHTMLAttributes, FC, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    className?: string;
}

const Button: FC<ButtonProps> = ({ children, className, ...props }) => {
    return (
        <button className={twMerge('inline-flex items-center justify-center rounded-md border border-stone-800 bg-stone-800 px-4 py-2 text-center align-middle font-sans text-sm font-medium text-stone-50 shadow-sm transition-all duration-300 ease-in hover:bg-stone-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50', className)} {...props}>
            {children}
        </button>
    );
};

export default Button;
