import type { FC, TextareaHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    className?: string;
}

const Textarea: FC<TextareaProps> = ({ className, ...props }) => {
    return <textarea className={twMerge('w-full resize-none rounded border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-stone-500 focus:outline-none', className)} {...props} />;
};

export default Textarea;
