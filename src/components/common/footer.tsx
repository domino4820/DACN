import Logo from '@/assets/images/favicon/logo-transparent.png';
import LinkBtn from '@/components/ui/link-btn';
import paths from '@/config/paths.ts';
import { faFacebook, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faHeart } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FC } from 'react';
import { Link } from 'react-router';

const Footer: FC = () => {
    return (
        <footer className='mx-auto max-w-4xl'>
            <div className='relative w-full rounded-md border border-white bg-white/10 shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] backdrop-blur-xs dark:border-stone-700 dark:bg-stone-900/50 dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.1),0_0_9px_rgba(0,0,0,0.5),0_3px_8px_rgba(0,0,0,0.3)]'>
                <div className='relative flex items-start justify-between gap-4 p-4 font-semibold text-stone-800 dark:text-stone-200'>
                    <div className='flex flex-1 flex-col gap-2'>
                        <LinkBtn to={paths.root} variant='ghost' className='flex w-fit items-center gap-1 p-1'>
                            <div className='h-12 w-12 overflow-hidden'>
                                <img src={Logo} alt='' className='h-full w-full' />
                            </div>
                            <span className='text-sm font-bold text-stone-800 dark:text-stone-200'>E Roadmap</span>
                        </LinkBtn>
                        <p className='text-xs text-stone-600 dark:text-stone-400'>Xây dựng lộ trình học tập, chinh phục thử thách quiz và kết nối cộng đồng!</p>
                    </div>

                    <div className='flex flex-1 justify-between gap-4'>
                        <div className='flex flex-col gap-2'>
                            <p className='text-xs font-semibold text-stone-800 uppercase dark:text-stone-200'>Khám phá</p>
                            <div className='flex flex-col gap-1'>
                                <Link to={paths.roadmaps} className='text-sm text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'>
                                    Roadmaps
                                </Link>
                                <Link to={paths.quizzes} className='text-sm text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'>
                                    Quizzes
                                </Link>
                                <Link to={paths.groups} className='text-sm text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'>
                                    Groups
                                </Link>
                            </div>
                        </div>

                        <div className='flex flex-col gap-2'>
                            <p className='text-xs font-semibold text-stone-800 uppercase dark:text-stone-200'>Tài nguyên</p>
                            <div className='flex flex-col gap-1'>
                                <Link to={paths.guides} className='text-sm text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'>
                                    Hướng dẫn
                                </Link>
                                <Link to={paths.faq} className='text-sm text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'>
                                    FAQ
                                </Link>
                            </div>
                        </div>

                        <div className='flex flex-col items-end justify-between gap-2'>
                            <div className='flex items-center gap-2'>
                                <a href='https://github.com/domino4820/DACN' target='_blank' rel='noopener noreferrer' className='after:box-shadow relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-900 bg-stone-800 bg-linear-to-b from-stone-700 to-stone-800 text-stone-50 antialiased shadow-sm transition-all duration-300 ease-in after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_1px_0px_rgba(255,255,255,0.25),inset_0_-2px_0px_rgba(0,0,0,0.35)] hover:border-stone-900 hover:bg-stone-700 hover:bg-linear-to-b hover:from-stone-800 hover:to-stone-800 hover:shadow-md dark:border-stone-600 dark:bg-stone-600 dark:from-stone-500 dark:to-stone-600 dark:text-white dark:hover:border-stone-500 dark:hover:bg-stone-500 dark:hover:from-stone-600 dark:hover:to-stone-600' aria-label='GitHub'>
                                    <FontAwesomeIcon icon={faGithub} className='text-sm' />
                                </a>
                                <a href='https://www.facebook.com/thai.than.3133/' target='_blank' rel='noopener noreferrer' className='after:box-shadow relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-900 bg-stone-800 bg-linear-to-b from-stone-700 to-stone-800 text-stone-50 antialiased shadow-sm transition-all duration-300 ease-in after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_1px_0px_rgba(255,255,255,0.25),inset_0_-2px_0px_rgba(0,0,0,0.35)] hover:border-stone-900 hover:bg-stone-700 hover:bg-linear-to-b hover:from-stone-800 hover:to-stone-800 hover:shadow-md dark:border-stone-600 dark:bg-stone-600 dark:from-stone-500 dark:to-stone-600 dark:text-white dark:hover:border-stone-500 dark:hover:bg-stone-500 dark:hover:from-stone-600 dark:hover:to-stone-600' aria-label='Facebook'>
                                    <FontAwesomeIcon icon={faFacebook} className='text-sm' />
                                </a>
                                <a href='https://mail.google.com/mail/?view=cm&fs=1&to=contact@eroadmap.tech' target='_blank' rel='noopener noreferrer' className='after:box-shadow relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-900 bg-stone-800 bg-linear-to-b from-stone-700 to-stone-800 text-stone-50 antialiased shadow-sm transition-all duration-300 ease-in after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_1px_0px_rgba(255,255,255,0.25),inset_0_-2px_0px_rgba(0,0,0,0.35)] hover:border-stone-900 hover:bg-stone-700 hover:bg-linear-to-b hover:from-stone-800 hover:to-stone-800 hover:shadow-md dark:border-stone-600 dark:bg-stone-600 dark:from-stone-500 dark:to-stone-600 dark:text-white dark:hover:border-stone-500 dark:hover:bg-stone-500 dark:hover:from-stone-600 dark:hover:to-stone-600' aria-label='Email'>
                                    <FontAwesomeIcon icon={faEnvelope} className='text-sm' />
                                </a>
                            </div>
                            <div className='flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400'>
                                <span>Made with</span>
                                <FontAwesomeIcon icon={faHeart} className='text-xs text-red-500' />
                                <span>by domino4820</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
