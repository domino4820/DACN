import Button from '@/components/ui/button';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FC } from 'react';
type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPrevPage: () => void;
    onNextPage: () => void;
    hasPrevPage: boolean;
    hasNextPage: boolean;
};

const Pagination: FC<PaginationProps> = ({ currentPage, totalPages, onPrevPage, onNextPage, hasPrevPage, hasNextPage }) => {
    return (
        <div className='flex items-center gap-2'>
            <Button onClick={onPrevPage} disabled={!hasPrevPage} variant='outline' className='min-h-[34px] min-w-[34px] p-0'>
                <FontAwesomeIcon icon={faChevronLeft} className='h-4 w-4' />
            </Button>
            <p className='flex items-center gap-1 font-sans text-base text-stone-600 antialiased dark:text-stone-400'>
                Trang <span className='font-sans text-base font-semibold text-stone-800 antialiased dark:text-stone-100'>{currentPage}</span> / <span className='font-sans text-base font-semibold text-stone-800 antialiased dark:text-stone-100'>{totalPages}</span>
            </p>
            <Button onClick={onNextPage} disabled={!hasNextPage} variant='outline' className='min-h-[34px] min-w-[34px] p-0'>
                <FontAwesomeIcon icon={faChevronRight} className='h-4 w-4' />
            </Button>
        </div>
    );
};

export default Pagination;
