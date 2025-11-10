import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type { FC, InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

const inputVariants = cva('w-full rounded-md border px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-300 ease-in focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50', {
    variants: {
        variant: {
            default: 'border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:ring-stone-500 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder-stone-500 dark:focus:border-stone-400 dark:focus:ring-stone-400',
            error: 'border-red-500 bg-white text-stone-900 placeholder-stone-400 focus:border-red-500 focus:ring-red-500 dark:bg-stone-700 dark:text-stone-100 dark:placeholder-stone-500'
        }
    },
    defaultVariants: {
        variant: 'default'
    }
});

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof inputVariants> {
    className?: string;
    error?: boolean;
}

const Input: FC<InputProps> = ({ variant, className, error, ...props }) => {
    const inputVariant = error ? 'error' : variant;

    return <input className={twMerge(clsx(inputVariants({ variant: inputVariant }), className))} {...props} />;
};

export default Input;
