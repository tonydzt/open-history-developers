// 'use client';

// import { useSession, signIn, signOut } from 'next-auth/react';
// import Link from 'next/link';
// import Image from 'next/image';
// import { useState, useRef, useEffect } from 'react';
// import { useTranslations, useLocale } from 'next-intl';
// import { useRouter } from 'next/navigation';
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './DropdownMenu';

// export default function Navbar() {
//   const { data: session, status } = useSession();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
//   const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
//   const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
//   const userMenuTimerRef = useRef<NodeJS.Timeout | null>(null);
//   const userMenuRef = useRef<HTMLDivElement>(null);
//   const languageMenuTimerRef = useRef<NodeJS.Timeout | null>(null);
//   const languageMenuRef = useRef<HTMLDivElement>(null);
//   const t = useTranslations('Navbar');
//   const locale = useLocale();
//   const router = useRouter();

//   // 切换语言
//   const changeLanguage = (newLocale: string) => {
//     if (newLocale !== locale) {
//       // 获取当前路径并替换语言部分
//       const currentPath = window.location.pathname;
//       const newPath = currentPath.startsWith(`/${locale}`)
//         ? currentPath.replace(`/${locale}`, `/${newLocale}`)
//         : `/${newLocale}${currentPath}`;
      
//       window.location.href = newPath;
//     }
//     setIsLanguageMenuOpen(false);
//   };

//   // 语言菜单进入
//   const handleLanguageMenuEnter = () => {
//     if (languageMenuTimerRef.current) {
//       clearTimeout(languageMenuTimerRef.current);
//     }
//     setIsLanguageMenuOpen(true);
//   };

//   // 语言菜单离开
//   const handleLanguageMenuLeave = () => {
//     languageMenuTimerRef.current = setTimeout(() => {
//       setIsLanguageMenuOpen(false);
//     }, 300); // 300ms延迟关闭
//   };

//   // 清理定时器
//   useEffect(() => {
//     return () => {
//       if (userMenuTimerRef.current) {
//         clearTimeout(userMenuTimerRef.current);
//       }
//       if (languageMenuTimerRef.current) {
//         clearTimeout(languageMenuTimerRef.current);
//       }
//     };
//   }, []);

//   const handleUserMenuEnter = () => {
//     if (userMenuTimerRef.current) {
//       clearTimeout(userMenuTimerRef.current);
//     }
//     setIsUserMenuOpen(true);
//   };

//   const handleUserMenuLeave = () => {
//     userMenuTimerRef.current = setTimeout(() => {
//       setIsUserMenuOpen(false);
//     }, 300); // 300ms延迟关闭
//   };

//   return (
//     <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo */}
//           <Link href="/" className="flex items-center space-x-2">
//             <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
//               <span className="text-white font-bold text-lg">C</span>
//             </div>
//             <span className="text-xl font-bold text-gray-900">Chronicle</span>
//           </Link>

//           {/* Desktop Navigation */}
//           <div className="hidden md:flex items-center">
//             <Link href="/" className="text-gray-700 hover:text-primary-600 transition-colors">
              
//             </Link>
//           </div>

//           {/* User Menu */}
//           <div className="hidden md:flex items-center space-x-4">
//             {/* Language Switcher */}
//             <div className="relative" ref={languageMenuRef}>
//               <button
//                 onMouseEnter={handleLanguageMenuEnter}
//                 onMouseLeave={handleLanguageMenuLeave}
//                 className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
//                 aria-label={t('languageSwitch')}
//                 aria-expanded={isLanguageMenuOpen}
//               >
//                 <div className="flex items-center space-x-1">
//                   <span className="text-sm font-medium">{locale === 'zh' ? t('chinese') : t('english')}</span>
//                   <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                   </svg>
//                 </div>
//               </button>
//               {isLanguageMenuOpen && (
//                 <div 
//                   className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
//                   onMouseEnter={handleLanguageMenuEnter}
//                   onMouseLeave={handleLanguageMenuLeave}
//                 >
//                   {locale !== 'en' && (
//                     <button
//                       onClick={() => changeLanguage('en')}
//                       className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
//                     >
//                       {t('english')}
//                     </button>
//                   )}
//                   {locale !== 'zh' && (
//                     <button
//                       onClick={() => changeLanguage('zh')}
//                       className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
//                     >
//                       {t('chinese')}
//                     </button>
//                   )}
//                 </div>
//               )}
//             </div>
            
//             {session && (
//               <DropdownMenu>
//                 <DropdownMenuTrigger className="relative z-10">
//                   <button 
//                     onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
//                     className="w-8 h-8 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm hover:shadow flex items-center justify-center"
//                     aria-label="创建菜单"
//                     aria-expanded={isCreateMenuOpen}
//                   >
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                     </svg>
//                   </button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent 
//                   open={isCreateMenuOpen} 
//                   onOpenChange={setIsCreateMenuOpen}
//                   align="right"
//                 >
//                   <DropdownMenuItem onClick={() => {
//                     setIsCreateMenuOpen(false);
//                     router.push('/create');
//                   }}>
//                     <div className="flex items-center gap-2 w-full">
//                       <span>{t('createEvent')}</span>
//                     </div>
//                   </DropdownMenuItem>
//                   <DropdownMenuItem onClick={() => {
//                     setIsCreateMenuOpen(false);
//                     router.push('/timeline/create');
//                   }}>
//                     <div className="flex items-center gap-2 w-full">
//                       <span>{t('createTimeline') || '创建时间轴'}</span>
//                     </div>
//                   </DropdownMenuItem>
//                   <DropdownMenuItem onClick={() => {
//                     setIsCreateMenuOpen(false);
//                     router.push(`/${locale}/storymap/create`);
//                   }}>
//                     <div className="flex items-center gap-2 w-full">
//                       <span>{t('createStorymap') || '创建故事地图'}</span>
//                     </div>
//                   </DropdownMenuItem>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             )}
//             {status === 'loading' ? (
//               <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
//             ) : session ? (
//               <div className="relative" ref={userMenuRef}>
//                 <button
//                   onMouseEnter={handleUserMenuEnter}
//                   onMouseLeave={handleUserMenuLeave}
//                   className="w-8 h-8 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
//                   aria-label={t('userMenu')}
//                   aria-expanded={isUserMenuOpen}
//                 >
//                   {session.user?.image ? (
//                     <Image
//                       src={session.user.image.includes('googleusercontent.com') && session.user.image.includes('=s96-c') 
//                     ? session.user.image.replace('=s96-c', '') 
//                     : session.user.image}
//                       alt={session.user.name || t('userAvatar')}
//                       width={32}
//                       height={32}
//                       className="w-full h-full object-cover"
//                     />
//                   ) : (
//                     <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
//                       {session.user?.name?.charAt(0) || '?'}
//                     </div>
//                   )}
//                 </button>
//                 {isUserMenuOpen && (
//                   <div 
//                     className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
//                     onMouseEnter={handleUserMenuEnter}
//                     onMouseLeave={handleUserMenuLeave}
//                   >
//                     <Link 
//                       href={`/${locale}/home`} 
//                       className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
//                       onClick={() => setIsUserMenuOpen(false)}
//                     >
//                       {t('homePage')}
//                     </Link>
//                     <button
//                       onClick={() => {
//                         signOut();
//                         setIsUserMenuOpen(false);
//                       }}
//                       className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
//                     >
//                       {t('signOut')}
//                     </button>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <button
//                 onClick={() => signIn()}
//                 className="btn-primary"
//               >
//                 登录
//               </button>
//             )}
//           </div>

//           {/* Mobile menu button */}
//           <div className="md:hidden">
//             <button
//               onClick={() => setIsMenuOpen(!isMenuOpen)}
//               className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200"
//               aria-label={isMenuOpen ? "关闭菜单" : "打开菜单"}
//             >
//               <svg className={`h-6 w-6 transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 {isMenuOpen ? (
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 ) : (
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                 )}
//               </svg>
//             </button>
//           </div>
//         </div>

//         {/* Mobile Navigation */}
//         {isMenuOpen && (
//           <div className="md:hidden py-3 border-t border-gray-100 bg-white animate-in fade-in slide-in-from-top-5 duration-200">
//             <div className="flex flex-col space-y-2 px-4">
//               <Link 
//                 href="/" 
//                 className="py-3 px-4 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-all duration-200"
//               >
                
//               </Link>
//               {session && (
//                 <Link 
//                   href="/create" 
//                   className="py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 text-center"
//                 >
//                   创建事件
//                 </Link>
//               )}
//               {session ? (
//                 <div className="space-y-2">
//                   <Link 
//                     href={`/${locale}/home`} 
//                     className="block py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200"
//                   >
//                     {t('homePage')}
//                   </Link>
//                   <div className="py-3 px-4 bg-gray-50 rounded-lg flex items-center justify-between">
//                     <div className="flex items-center">
//                       {session.user?.image ? (
//                         <Image
//                           src={session.user.image.includes('googleusercontent.com') && session.user.image.includes('=s96-c') 
//                           ? session.user.image.replace('=s96-c', '') 
//                           : session.user.image}
//                           alt={session.user.name || '用户头像'}
//                           width={32}
//                           height={32}
//                           className="w-8 h-8 rounded-full object-cover"
//                         />
//                       ) : (
//                         <div className="w-8 h-8 bg-gray-200 flex items-center justify-center text-gray-500 rounded-full">
//                           {session.user?.name?.charAt(0) || '?'}
//                         </div>
//                       )}
//                     </div>
//                     <button
//                       onClick={() => signOut()}
//                       className="py-2 px-4 text-sm text-gray-600 hover:bg-gray-200 rounded-full transition-all duration-200"
//                     >
//                       {t('signOut')}
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <button
//                   onClick={() => signIn()}
//                   className="btn-primary text-center py-3 rounded-lg mt-2 transition-all duration-200 hover:shadow-md"
//                 >
//                   登录
//                 </button>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// }