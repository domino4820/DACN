import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, FC, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

const buttonVariants = cva('inline-flex items-center justify-center rounded-md border px-4 py-2 text-center align-middle font-sans text-sm font-medium shadow-none transition-all duration-300 ease-in select-none focus:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none', {
    variants: {
        variant: {
            gradient: 'after:box-shadow relative border-stone-900 bg-stone-800 bg-linear-to-b from-stone-700 to-stone-800 text-stone-50 antialiased shadow-sm after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_1px_0px_rgba(255,255,255,0.25),inset_0_-2px_0px_rgba(0,0,0,0.35)] hover:border-stone-900 hover:bg-stone-700 hover:bg-linear-to-b hover:from-stone-800 hover:to-stone-800 hover:shadow-md dark:border-stone-600 dark:bg-stone-600 dark:from-stone-500 dark:to-stone-600 dark:text-white dark:hover:border-stone-500 dark:hover:bg-stone-500 dark:hover:from-stone-600 dark:hover:to-stone-600',
            outline: 'border-stone-800 bg-transparent text-stone-800 hover:bg-stone-800 hover:text-stone-50 hover:shadow-sm dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700 dark:hover:text-white'
        }
    },
    defaultVariants: {
        variant: 'gradient'
    }
});

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    children: ReactNode;
    className?: string;
}

const Button: FC<ButtonProps> = ({ children, variant, className, ...props }) => {
    return (
        <button className={twMerge(clsx(buttonVariants({ variant }), className))} {...props}>
            {children}
        </button>
    );
};

export default Button;
