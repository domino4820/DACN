import LogoImage from '@/assets/lottie/logo.json';
import Button from '@/components/ui/button';
import paths from '@/config/paths';
import { useAuthStore } from '@/store/auth.store';
import { faArrowRight, faBookOpen, faBrain, faComments, faRocket, faTags, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { Link } from 'react-router';

const Index: FC = () => {
    const user = useAuthStore((state) => state.user);
    return (
        <div className='animate-in slide-in-from-bottom-4 w-full max-w-4xl duration-700'>
            <div className='flex flex-row gap-12 rounded-lg bg-white p-4 shadow-lg dark:bg-stone-800'>
                <div className='flex w-1/2 flex-col justify-center space-y-4'>
                    <div className='space-y-4'>
                        <div className='inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 dark:bg-stone-700 dark:text-stone-300'>
                            <FontAwesomeIcon icon={faRocket} className='text-stone-600 dark:text-stone-400' />
                            <span>Học tập thông minh</span>
                        </div>
                        <p className='text-3xl leading-tight font-bold text-stone-900 dark:text-stone-100'>
                            Học tập hiệu quả,
                            <br />
                            <span className='bg-linear-to-r from-stone-600 to-stone-800 bg-clip-text text-transparent dark:from-stone-300 dark:to-stone-100'>theo lộ trình</span>
                        </p>
                        <p className='text-stone-600 dark:text-stone-400'>Khám phá các lộ trình học tập được thiết kế kỹ lưỡng. Theo dõi tiến trình, kiểm tra kiến thức và kết nối với cộng đồng. Biến việc học thành hành trình thú vị!</p>
                    </div>

                    <div className='flex flex-row gap-3'>
                        {user ? (
                            <Link to={paths.roadmaps} className='w-auto'>
                                <Button className='group'>
                                    Bắt đầu học ngay
                                    <FontAwesomeIcon icon={faArrowRight} className='ml-2 transition-transform group-hover:translate-x-1' />
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link to={paths.register} className='w-auto'>
                                    <Button className='group'>
                                        Đăng ký miễn phí
                                        <FontAwesomeIcon icon={faArrowRight} className='ml-2 transition-transform group-hover:translate-x-1' />
                                    </Button>
                                </Link>
                                <Link to={paths.login} className='w-auto'>
                                    <Button variant='outline'>Đăng nhập</Button>
                                </Link>
                            </>
                        )}
                    </div>

                    <div className='flex flex-wrap gap-4 border-t border-stone-200 pt-4 dark:border-stone-700'>
                        <div className='space-y-1'>
                            <div className='text-2xl font-bold text-stone-900 dark:text-stone-100'>100%</div>
                            <div className='text-xs text-stone-600 dark:text-stone-400'>Miễn phí</div>
                        </div>
                        <div className='space-y-1'>
                            <div className='text-2xl font-bold text-stone-900 dark:text-stone-100'>∞</div>
                            <div className='text-xs text-stone-600 dark:text-stone-400'>Không giới hạn</div>
                        </div>
                        <div className='space-y-1'>
                            <div className='text-2xl font-bold text-stone-900 dark:text-stone-100'>24/7</div>
                            <div className='text-xs text-stone-600 dark:text-stone-400'>Cộng đồng</div>
                        </div>
                    </div>
                </div>

                <div className='flex w-1/2 items-center justify-center'>
                    <div className='relative aspect-square w-full overflow-hidden rounded-lg'>
                        <Lottie animationData={LogoImage} loop={true} className='h-full w-full' />
                    </div>
                </div>
            </div>

            <div className='mt-4 grid grid-cols-3 gap-4'>
                <div className='rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-800'>
                    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                        <FontAwesomeIcon icon={faBookOpen} className='text-xl text-stone-600 dark:text-stone-400' />
                    </div>
                    <p className='text-lg font-bold text-stone-900 dark:text-stone-100'>Lộ trình chất lượng</p>
                    <p className='text-sm text-stone-600 dark:text-stone-400'>Khám phá các lộ trình được thiết kế kỹ lưỡng. Theo dõi tiến độ dễ dàng và hoàn thành các mục tiêu theo trình độ.</p>
                </div>

                <div className='rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-800'>
                    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                        <FontAwesomeIcon icon={faBrain} className='text-xl text-stone-600 dark:text-stone-400' />
                    </div>
                    <p className='text-lg font-bold text-stone-900 dark:text-stone-100'>Kiểm tra kiến thức</p>
                    <p className='text-sm text-stone-600 dark:text-stone-400'>Làm quiz đa dạng để kiểm tra kiến thức. Quiz được tạo bởi cộng đồng và được duyệt để đảm bảo chất lượng.</p>
                </div>

                <div className='rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-800'>
                    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                        <FontAwesomeIcon icon={faRocket} className='text-xl text-stone-600 dark:text-stone-400' />
                    </div>
                    <p className='text-lg font-bold text-stone-900 dark:text-stone-100'>Cập nhật liên tục</p>
                    <p className='text-sm text-stone-600 dark:text-stone-400'>Nội dung và lộ trình luôn được cập nhật mới. Luôn có kiến thức tiên tiến và phù hợp với xu hướng hiện tại.</p>
                </div>

                <div className='rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-800'>
                    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                        <FontAwesomeIcon icon={faComments} className='text-xl text-stone-600 dark:text-stone-400' />
                    </div>
                    <p className='text-lg font-bold text-stone-900 dark:text-stone-100'>Chia sẻ kiến thức</p>
                    <p className='text-sm text-stone-600 dark:text-stone-400'>Viết bài chia sẻ kiến thức, nhận lượt thích và bình luận. Xây dựng hồ sơ chuyên môn và kết nối với cộng đồng học tập.</p>
                </div>

                <div className='rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-800'>
                    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                        <FontAwesomeIcon icon={faTags} className='text-xl text-stone-600 dark:text-stone-400' />
                    </div>
                    <p className='text-lg font-bold text-stone-900 dark:text-stone-100'>Nhiều chủ đề học</p>
                    <p className='text-sm text-stone-600 dark:text-stone-400'>Tìm hiểu các chủ đề từ lập trình, thiết kế đến marketing. Luôn có nội dung phù hợp với mục tiêu và sở thích của bạn.</p>
                </div>

                <div className='rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-800'>
                    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                        <FontAwesomeIcon icon={faUsers} className='text-xl text-stone-600 dark:text-stone-400' />
                    </div>
                    <p className='text-lg font-bold text-stone-900 dark:text-stone-100'>Kết nối cộng đồng</p>
                    <p className='text-sm text-stone-600 dark:text-stone-400'>Tham gia thảo luận, đặt câu hỏi và nhận phản hồi từ cộng đồng. Mở rộng mạng lưới và học hỏi từ người khác.</p>
                </div>
            </div>
        </div>
    );
};

export default Index;
