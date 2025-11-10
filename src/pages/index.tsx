import LogoImage from '@/assets/lottie/logo.json';
import Button from '@/components/ui/button';
import paths from '@/config/paths';
import { useAuthStore } from '@/store/auth.store';
import { faArrowRight, faBookOpen, faBrain, faLightbulb, faRocket, faTrophy, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { Link } from 'react-router';
const Index: FC = () => {
    const user = useAuthStore((state) => state.user);
    return (
        <div className='animate-in slide-in-from-bottom-4 w-full max-w-4xl duration-700'>
            <div className='flex flex-row gap-12 rounded-lg bg-white p-4 shadow-lg dark:bg-stone-800'>
                <div className='flex w-1/2 flex-col justify-center space-y-6'>
                    <div className='space-y-4'>
                        <div className='inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 dark:bg-stone-700 dark:text-stone-300'>
                            <FontAwesomeIcon icon={faRocket} className='text-stone-600 dark:text-stone-400' />
                            <span>Nền tảng quản lý lộ trình học tập</span>
                        </div>
                        <p className='text-3xl leading-tight font-bold text-stone-900 dark:text-stone-100'>
                            Xây dựng và theo dõi
                            <br />
                            <span className='bg-linear-to-r from-stone-600 to-stone-800 bg-clip-text text-transparent dark:from-stone-300 dark:to-stone-100'>lộ trình học tập</span>
                        </p>
                        <p className='text-stone-600 dark:text-stone-400'>Hệ thống quản lý roadmap với sơ đồ trực quan, tích hợp đánh giá kiến thức qua quiz, hỗ trợ học tập nhóm và theo dõi tiến độ cá nhân hóa.</p>
                    </div>

                    <div className='flex flex-row gap-3'>
                        {user ? (
                            <Link to={paths.root} className='w-auto'>
                                <Button className='group'>
                                    Khám phá ngay
                                    <FontAwesomeIcon icon={faArrowRight} className='ml-2 transition-transform group-hover:translate-x-1' />
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link to={paths.register} className='w-auto'>
                                    <Button className='group'>
                                        Tham gia ngay
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
                            <div className='text-xs text-stone-600 dark:text-stone-400'>Miễn phí hoàn toàn</div>
                        </div>
                        <div className='space-y-1'>
                            <div className='text-2xl font-bold text-stone-900 dark:text-stone-100'>∞</div>
                            <div className='text-xs text-stone-600 dark:text-stone-400'>Không giới hạn nội dung</div>
                        </div>
                        <div className='space-y-1'>
                            <div className='text-2xl font-bold text-stone-900 dark:text-stone-100'>24/7</div>
                            <div className='text-xs text-stone-600 dark:text-stone-400'>Hỗ trợ cộng đồng</div>
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
                    <p className='mb-2 text-lg font-bold text-stone-900 dark:text-stone-100'>Quản lý Roadmap</p>
                    <p className='text-sm text-stone-600 dark:text-stone-400'>Tạo và tùy chỉnh lộ trình học tập với sơ đồ node. Thiết lập độ ưu tiên, thời gian dự kiến và đánh dấu các kỹ năng bắt buộc cho từng giai đoạn.</p>
                </div>

                <div className='rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-800'>
                    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                        <FontAwesomeIcon icon={faBrain} className='text-xl text-stone-600 dark:text-stone-400' />
                    </div>
                    <p className='mb-2 text-lg font-bold text-stone-900 dark:text-stone-100'>Hệ thống Quiz</p>
                    <p className='text-sm text-stone-600 dark:text-stone-400'>Tạo và thực hiện bài kiểm tra kiến thức với hệ thống câu hỏi đa dạng. Tích hợp quy trình phê duyệt để đảm bảo chất lượng nội dung.</p>
                </div>

                <div className='rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-800'>
                    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                        <FontAwesomeIcon icon={faUsers} className='text-xl text-stone-600 dark:text-stone-400' />
                    </div>
                    <p className='mb-2 text-lg font-bold text-stone-900 dark:text-stone-100'>Nhóm học tập</p>
                    <p className='text-sm text-stone-600 dark:text-stone-400'>Tạo và tham gia nhóm học tập với khả năng chia sẻ roadmap, trao đổi qua tin nhắn và đăng bài viết. Hỗ trợ học tập cộng tác hiệu quả.</p>
                </div>

                <div className='rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-800'>
                    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                        <FontAwesomeIcon icon={faTrophy} className='text-xl text-stone-600 dark:text-stone-400' />
                    </div>
                    <p className='mb-2 text-lg font-bold text-stone-900 dark:text-stone-100'>Hệ thống Gamification</p>
                    <p className='text-sm text-stone-600 dark:text-stone-400'>Tích lũy điểm kinh nghiệm khi hoàn thành roadmap, thăng cấp và mở khóa huy hiệu thành tích. Tạo động lực học tập bền vững.</p>
                </div>

                <div className='rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-800'>
                    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                        <FontAwesomeIcon icon={faLightbulb} className='text-xl text-stone-600 dark:text-stone-400' />
                    </div>
                    <p className='mb-2 text-lg font-bold text-stone-900 dark:text-stone-100'>Phân loại chủ đề</p>
                    <p className='text-sm text-stone-600 dark:text-stone-400'>Tổ chức roadmap theo chủ đề như Frontend, Backend, DevOps, UI/UX. Tìm kiếm và lọc nội dung theo topic phù hợp với nhu cầu học tập.</p>
                </div>

                <div className='rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-800'>
                    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                        <FontAwesomeIcon icon={faRocket} className='text-xl text-stone-600 dark:text-stone-400' />
                    </div>
                    <p className='mb-2 text-lg font-bold text-stone-900 dark:text-stone-100'>Thông báo tự động</p>
                    <p className='text-sm text-stone-600 dark:text-stone-400'>Nhận thông báo khi roadmap được cập nhật, quiz được phê duyệt hoặc có lời mời tham gia nhóm. Theo dõi hoạt động một cách kịp thời.</p>
                </div>
            </div>
        </div>
    );
};

export default Index;
