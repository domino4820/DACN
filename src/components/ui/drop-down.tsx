import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

const dropdownTriggerVariants = cva('inline-flex items-center justify-center rounded-md border px-4 py-2 text-center align-middle font-sans text-sm font-medium shadow-none transition-all duration-300 ease-in select-none focus:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none', {
    variants: {
        variant: {
            gradient: 'after:box-shadow relative border-stone-900 bg-stone-800 bg-linear-to-b from-stone-700 to-stone-800 text-stone-50 antialiased shadow-sm after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_1px_0px_rgba(255,255,255,0.25),inset_0_-2px_0px_rgba(0,0,0,0.35)] hover:border-stone-900 hover:bg-stone-700 hover:bg-linear-to-b hover:from-stone-800 hover:to-stone-800 hover:shadow-md dark:border-stone-600 dark:bg-stone-600 dark:from-stone-500 dark:to-stone-600 dark:text-white dark:hover:border-stone-500 dark:hover:bg-stone-500 dark:hover:from-stone-600 dark:hover:to-stone-600',
            outline: 'border-stone-800 bg-transparent text-stone-800 hover:bg-stone-800 hover:text-stone-50 hover:shadow-sm dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700 dark:hover:text-white',
            ghost: 'border-transparent bg-transparent text-stone-800 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
        }
    },
    defaultVariants: {
        variant: 'gradient'
    }
});

const dropdownMenuVariants = cva('absolute z-50 mt-2 rounded-lg border shadow-lg p-1 w-full', {
    variants: {
        variant: {
            default: 'bg-white border-stone-200 dark:bg-stone-800 dark:border-stone-700'
        }
    },
    defaultVariants: {
        variant: 'default'
    }
});

const dropdownItemVariants = cva('block w-full rounded-md px-4 py-2 text-left text-sm transition-colors duration-200', {
    variants: {
        variant: {
            default: 'text-stone-800 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700',
            danger: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
        }
    },
    defaultVariants: {
        variant: 'default'
    }
});

interface DropdownItemProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: 'default' | 'danger';
    className?: string;
    closeDropdown?: () => void;
}

interface DropdownProps {
    trigger: ReactNode;
    children: ReactNode;
    triggerVariant?: VariantProps<typeof dropdownTriggerVariants>['variant'];
    triggerClassName?: string;
    menuClassName?: string;
}

export const DropdownItem: FC<DropdownItemProps> = ({ children, onClick, variant = 'default', className, closeDropdown }) => {
    const handleClick = () => {
        onClick?.();
        closeDropdown?.();
    };

    return (
        <button type='button' onClick={handleClick} className={twMerge(clsx(dropdownItemVariants({ variant }), className))}>
            {children}
        </button>
    );
};

const Dropdown: FC<DropdownProps> = ({ trigger, children, triggerVariant = 'gradient', triggerClassName, menuClassName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const closeDropdown = () => {
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const childrenWithProps = typeof children === 'object' && children !== null && 'type' in children ? children : typeof children === 'string' ? children : Array.isArray(children) ? children.map((child, index) => (typeof child === 'object' && child !== null && 'type' in child && child.type === DropdownItem ? { ...child, props: { ...child.props, closeDropdown, key: index } } : child)) : children;

    return (
        <div ref={dropdownRef} className='relative inline-block'>
            <button type='button' onClick={toggleDropdown} aria-expanded={isOpen} className={twMerge(clsx(dropdownTriggerVariants({ variant: triggerVariant }), triggerClassName))}>
                {trigger}
            </button>

            {isOpen && <div className={twMerge(clsx(dropdownMenuVariants({ variant: 'default' }), 'top-full right-0', menuClassName))}>{childrenWithProps}</div>}
        </div>
    );
};

export default Dropdown;
