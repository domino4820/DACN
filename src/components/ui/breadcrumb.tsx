import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FC, ReactNode } from 'react';
import { Link } from 'react-router';

export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: ReactNode;
    isActive?: boolean;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

const Breadcrumb: FC<BreadcrumbProps> = ({ items, className = '' }) => {
    return (
        <nav className={`flex flex-wrap items-center gap-0.5 p-1 ${className}`}>
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const isActive = item.isActive ?? isLast;
                const key = item.href ? `${item.href}-${item.label}` : item.label;

                const content = (
                    <span className={`inline-flex items-center gap-1.5 text-sm transition-colors duration-300 select-none ${isActive ? 'text-stone-900 dark:text-stone-100' : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'}`}>
                        {item.icon && <span className='h-4 w-4'>{item.icon}</span>}
                        <span>{item.label}</span>
                    </span>
                );

                return (
                    <div key={key} className='flex items-center'>
                        {item.href && !isActive ? (
                            <Link to={item.href} className='inline-flex items-center'>
                                {content}
                            </Link>
                        ) : (
                            content
                        )}
                        {!isLast && (
                            <span className='pointer-events-none mx-1 inline-flex items-center text-sm text-stone-400 select-none dark:text-stone-600'>
                                <FontAwesomeIcon icon={faChevronRight} className='h-4 w-4' />
                            </span>
                        )}
                    </div>
                );
            })}
        </nav>
    );
};

export default Breadcrumb;
