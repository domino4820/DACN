import { clsx } from 'clsx';
import type { FC, ReactElement } from 'react';
import { Children, cloneElement, isValidElement } from 'react';
import { useLocation } from 'react-router';
import { twMerge } from 'tailwind-merge';

interface NavLinkGroupProps {
    children: ReactElement | ReactElement[];
    className?: string;
}

const NavLinkGroup: FC<NavLinkGroupProps> = ({ children, className }) => {
    const location = useLocation();
    const childrenArray = Children.toArray(children);
    const totalChildren = childrenArray.length;

    return (
        <nav className={twMerge(clsx('inline-flex rounded-lg', className))}>
            {Children.map(children, (child, index) => {
                if (!isValidElement(child)) return child;

                const to = (child.props as { to?: string }).to;
                const isActive = to === location.pathname;
                const childClassName = (child.props as { className?: string }).className || '';

                if (totalChildren === 1) {
                    return cloneElement(child, {
                        ...(child.props as Record<string, unknown>),
                        variant: isActive ? 'gradient' : 'ghost'
                    } as Partial<unknown>);
                }

                if (index === 0) {
                    return cloneElement(child, {
                        ...(child.props as Record<string, unknown>),
                        variant: isActive ? 'gradient' : 'ghost',
                        className: twMerge(clsx(childClassName, 'rounded-l-lg rounded-r-none'))
                    } as Partial<unknown>);
                }

                if (index === totalChildren - 1) {
                    return cloneElement(child, {
                        ...(child.props as Record<string, unknown>),
                        variant: isActive ? 'gradient' : 'ghost',
                        className: twMerge(clsx(childClassName, 'rounded-r-lg rounded-l-none'))
                    } as Partial<unknown>);
                }

                return cloneElement(child, {
                    ...(child.props as Record<string, unknown>),
                    variant: isActive ? 'gradient' : 'ghost',
                    className: twMerge(clsx(childClassName, 'rounded-none'))
                } as Partial<unknown>);
            })}
        </nav>
    );
};

export default NavLinkGroup;
