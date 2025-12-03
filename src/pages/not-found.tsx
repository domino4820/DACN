import NotFoundImage from '@/assets/lottie/404.json';
import Button from '@/components/ui/button';
import paths from '@/config/paths';
import { faArrowLeft, faHome } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { useNavigate } from 'react-router';
const NotFound: FC = () => {
    const navigate = useNavigate();

    return (
        <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white p-4 shadow-lg duration-700 dark:bg-stone-800'>
            <div className='animate-in slide-in-from-right flex w-1/2 flex-col justify-center p-4 duration-1000'>
                <div className='mb-4'>
                    <div className='mb-4 inline-flex items-center justify-center gap-3 rounded-full bg-stone-100 px-4 py-2 dark:bg-stone-700'>
                        <span className='text-5xl font-bold text-stone-800 dark:text-stone-200'>404</span>
                        <div className='h-8 w-px bg-stone-300 dark:bg-stone-600'></div>
                        <span className='text-sm font-medium text-stone-600 dark:text-stone-400'>Không tồn tại</span>
                    </div>
                    <p className='text-3xl font-bold text-stone-900 dark:text-stone-100'>Trang không tồn tại</p>
                    <p className='text-stone-600 dark:text-stone-400'>Trang bạn truy cập không tồn tại hoặc đã bị xoá. Vui lòng kiểm tra lại đường dẫn hoặc quay lại để tiếp tục sử dụng hệ thống.</p>
                </div>

                <div className='flex gap-3'>
                    <Button onClick={() => navigate(-1)} variant='outline' className='flex-1'>
                        <FontAwesomeIcon icon={faArrowLeft} className='mr-2' />
                        Quay lại
                    </Button>
                    <Button onClick={() => navigate(paths.root)} className='flex-1'>
                        <FontAwesomeIcon icon={faHome} className='mr-2' />
                        Trang chủ
                    </Button>
                </div>
            </div>

            <div className='animate-in slide-in-from-left flex w-1/2 items-center justify-center p-4 duration-1000'>
                <div className='relative aspect-square w-full overflow-hidden rounded-lg'>
                    <Lottie animationData={NotFoundImage} loop={true} className='h-full w-full' />
                </div>
            </div>
        </div>
    );
};

export default NotFound;
