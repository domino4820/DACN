import Logo from '@/assets/images/favicon/logo-transparent.png';
import ThemeToggle from '@/components/common/theme-toggle';
import Dropdown, { DropdownItem } from '@/components/ui/drop-down';
import Input from '@/components/ui/input';
import LinkBtn from '@/components/ui/link-btn';
import NavLinkGroup from '@/components/ui/nav-link-group';
import paths from '@/config/paths';
import { useAuthStore } from '@/store/auth.store';
import { faMagnifyingGlass, faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { forwardRef, useState } from 'react';
import { useNavigate } from 'react-router';
const Header = forwardRef<HTMLElement>((_props, ref) => {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleLogout = () => {
        logout();
        navigate(paths.login);
    };

    return (
        <header ref={ref} className='sticky top-4 z-20 mx-auto max-w-4xl'>
            <div className='rounded-md border border-white bg-white/10 shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] backdrop-blur-xs dark:border-stone-700 dark:bg-stone-900/50 dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.1),0_0_9px_rgba(0,0,0,0.5),0_3px_8px_rgba(0,0,0,0.3)]'>
                <div className='flex items-center justify-between p-4 font-semibold text-stone-800 dark:text-stone-200'>
                    <div className='mr-4 flex items-start'>
                        <LinkBtn to={paths.root} variant='ghost' className='flex items-center gap-1 p-1'>
                            <div className='h-12 w-12 overflow-hidden'>
                                <img src={Logo} alt='' className='h-full w-full' />
                            </div>
                            <span className='text-sm font-bold text-stone-800 dark:text-stone-200'>E Roadmap</span>
                        </LinkBtn>
                    </div>
                    <div className={`mx-4 transition-all duration-700 ease-in-out origin-left ${isSearchFocused ? 'max-w-2xl flex-1' : 'max-w-md flex-1'}`}>
                        <div className='relative'>
                            <Input type='text' placeholder='Tìm kiếm...' className='bg-white/50 pl-10 backdrop-blur-xs dark:bg-stone-800/50' onFocus={() => setIsSearchFocused(true)} onBlur={() => setIsSearchFocused(false)} />
                            <div className='absolute top-1/2 left-3 -translate-y-1/2 text-stone-500 dark:text-stone-400'>
                                <FontAwesomeIcon icon={faMagnifyingGlass} className='h-4 w-4' />
                            </div>
                        </div>
                    </div>

                    <div className={`transition-all duration-700 ease-in-out ${isSearchFocused ? 'w-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
                        <NavLinkGroup>
                            <LinkBtn to='/roadmaps' variant='gradient'>
                                Roadmaps
                            </LinkBtn>
                            <LinkBtn to='/quizzes' variant='gradient'>
                                Quizzes
                            </LinkBtn>
                            <LinkBtn to='/groups' variant='gradient'>
                                Groups
                            </LinkBtn>
                        </NavLinkGroup>
                    </div>
                    <div className='flex items-center justify-end gap-2'>
                        {isAuthenticated ? (
                            <Dropdown
                                trigger={
                                    <>
                                        {user?.profile?.avatar_url ? (
                                            <img src={user.profile.avatar_url} alt={user.username} className='h-8 w-8 rounded-full border-2 border-stone-300 object-cover dark:border-stone-600' />
                                        ) : (
                                            <div className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-stone-300 bg-stone-100 dark:border-stone-600 dark:bg-stone-700'>
                                                <FontAwesomeIcon icon={faUser} className='text-sm text-stone-600 dark:text-stone-400' />
                                            </div>
                                        )}
                                    </>
                                }
                                triggerVariant='ghost'
                                triggerClassName='p-2'
                                menuClassName='min-w-48'
                            >
                                <DropdownItem onClick={() => navigate(paths.me)} className='flex items-center gap-2'>
                                    <FontAwesomeIcon icon={faUser} className='text-stone-600 dark:text-stone-400' />
                                    <span>Trang cá nhân</span>
                                </DropdownItem>
                                <DropdownItem onClick={handleLogout} variant='danger' className='flex items-center gap-2'>
                                    <FontAwesomeIcon icon={faRightFromBracket} className='text-red-600 dark:text-red-400' />
                                    <span>Đăng xuất</span>
                                </DropdownItem>
                            </Dropdown>
                        ) : (
                            <>
                                <LinkBtn to={paths.login} variant='ghost'>
                                    Đăng nhập
                                </LinkBtn>
                                <LinkBtn to={paths.register} variant='gradient'>
                                    Đăng ký
                                </LinkBtn>
                            </>
                        )}
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
});

Header.displayName = 'Header';

export default Header;
