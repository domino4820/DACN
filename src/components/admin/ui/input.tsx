import type { FC, InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string;
}

const Input: FC<InputProps> = ({ className, ...props }) => {
    return <input className={twMerge('w-full rounded border border-gray-300 px-3 py-2', className)} {...props} />;
};

export default Input;
