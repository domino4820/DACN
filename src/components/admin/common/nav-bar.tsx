import paths from '@/config/paths.ts';
import type { FC } from 'react';
import { NavLink } from 'react-router';

const NavBar: FC = () => {
    const menuItems = [
        { label: 'Quizzes', path: paths.admin.root },
        { label: 'Config', path: paths.admin.config },
        { label: 'Roadmaps', path: paths.admin.roadmaps },
        { label: 'Topics', path: paths.admin.topics },
        { label: 'Users', path: paths.admin.users }
    ];

    return (
        <nav className='flex w-[200px] flex-col gap-2 border-r border-stone-200 p-4'>
            {menuItems.map((item) => (
                <NavLink key={item.path} to={item.path} end title={item.label} className={({ isActive }) => `inline-flex items-center justify-start truncate rounded-md border border-stone-800 px-4 py-2 text-left align-middle font-sans text-sm font-medium transition-all duration-300 ease-in ${isActive ? 'bg-stone-800 text-stone-50 shadow-sm' : 'border-transparent text-black hover:bg-stone-100'} `}>
                    {item.label}
                </NavLink>
            ))}
        </nav>
    );
};

export default NavBar;
