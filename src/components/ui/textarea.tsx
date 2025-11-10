import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type { FC, TextareaHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

const textareaVariants = cva('w-full rounded-md border px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-300 ease-in focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50', {
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

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>, VariantProps<typeof textareaVariants> {
    className?: string;
    error?: boolean;
}

const Textarea: FC<TextareaProps> = ({ variant, className, error, ...props }) => {
    const textareaVariant = error ? 'error' : variant;

    return <textarea className={twMerge(clsx(textareaVariants({ variant: textareaVariant }), className))} {...props} />;
};

export default Textarea;
