import Button from '@/components/ui/button';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState, type FC } from 'react';

const ScrollToTop: FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className='fixed right-8 bottom-8 z-50'>
            <Button variant='gradient' onClick={scrollToTop} className='h-12 w-12 rounded-full p-0 hover:shadow-xl'>
                <FontAwesomeIcon icon={faArrowUp} className='h-6 w-6' />
            </Button>
        </div>
    );
};

export default ScrollToTop;
