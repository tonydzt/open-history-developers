'use client';

import React, { useState, use } from 'react';
import Sidebar from '@/components/Sidebar';
import DocContent from '@/components/DocContent';
import TableOfContents from '@/components/TableOfContents';
import { DocPage } from '@/data/mockData';

interface DocumentPageProps {
  params: Promise<{ slug: string }>;
}

const DocumentPage: React.FC<DocumentPageProps> = ({ params }) => {
  // 在Next.js 16中，params是一个Promise，需要使用React.use()来解包
  const resolvedParams = use(params);
  const [currentPage, setCurrentPage] = useState<DocPage | null>(null);

  const handlePageLoaded = (page: DocPage | null) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左侧总目录 - 250px宽度 */}
      <aside className="w-64 shrink-0">
        <Sidebar />
      </aside>
      
      {/* 中间文档内容 - 自适应宽度 */}
      <main className="flex-1">
        <DocContent slug={resolvedParams.slug} onPageLoaded={handlePageLoaded} />
      </main>
      
      {/* 右侧当前页目录 - 250px宽度 */}
      <aside className="w-64 shrink-0">
        {currentPage ? <TableOfContents pageId={currentPage.id} /> : null}
      </aside>
    </div>
  );
};

export default DocumentPage;
