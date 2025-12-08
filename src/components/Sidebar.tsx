'use client';

import React, { useEffect, useState } from 'react';
import { DocCategory, DocPage, fetchCategories, fetchPagesByCategory } from '../data/mockData';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar: React.FC = () => {
  const [categories, setCategories] = useState<DocCategory[]>([]);
  const [pagesByCategory, setPagesByCategory] = useState<Record<string, DocPage[]>>({});
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const loadData = async () => {
      try {
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);

        // 加载每个分类下的页面
        const pagesMap: Record<string, DocPage[]> = {};
        for (const category of categoriesData) {
          const pages = await fetchPagesByCategory(category.id);
          pagesMap[category.id] = pages;
        }
        setPagesByCategory(pagesMap);
      } catch (error) {
        console.error('Failed to load sidebar data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center">加载中...</div>;
  }

  return (
    <div className="h-full overflow-y-auto border-r p-4">
      <h1 className="mb-6 text-2xl font-bold">开发者平台</h1>
      <nav>
        {categories.map((category) => (
          <div key={category.id} className="mb-4">
            <h2 className="mb-2 text-lg font-semibold">{category.name}</h2>
            <ul className="space-y-1 pl-4">
              {pagesByCategory[category.id]?.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/docs/${page.slug}`}
                    className={`block rounded px-2 py-1 text-sm transition-colors ${pathname === `/docs/${page.slug}` ? 'bg-blue-100 text-blue-800 font-medium' : 'hover:bg-gray-100'}`}
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
