import Button from '@/components/ui/button.tsx';
import { useThemeStore } from '@/store/theme.store';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FC } from 'react';

const ThemeToggle: FC = () => {
    const { toggleTheme } = useThemeStore();

    return (
        <Button onClick={toggleTheme} variant='outline' className='aspect-square p-2'>
            <FontAwesomeIcon icon={faLightbulb} className='w-1 transition-colors' />
        </Button>
    );
};

export default ThemeToggle;
