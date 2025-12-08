'use client';

import React, { useEffect, useState } from 'react';
import { DocPage, fetchPageBySlug } from '../data/mockData';

interface DocContentProps {
  slug: string;
  onPageLoaded: (page: DocPage | null) => void;
}

const DocContent: React.FC<DocContentProps> = ({ slug, onPageLoaded }) => {
  const [page, setPage] = useState<DocPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const pageData = await fetchPageBySlug(slug);
        setPage(pageData);
        onPageLoaded(pageData);
      } catch (error) {
        console.error('Failed to load page content:', error);
        onPageLoaded(null);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [slug, onPageLoaded]);

  if (loading) {
    return <div className="flex h-full items-center justify-center">加载中...</div>;
  }

  if (!page) {
    return <div className="flex h-full items-center justify-center">页面不存在</div>;
  }

  // 简单的Markdown渲染（实际项目中应使用专门的Markdown渲染库）
  const renderMarkdown = (content: string) => {
    // 将Markdown转换为HTML
    const html = content
      // 标题
      .replace(/^# (.*$)/gm, '<h1 id="$1" class="text-3xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 id="$1" class="text-2xl font-bold mb-3 mt-8">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 id="$1" class="text-xl font-semibold mb-2 mt-6">$1</h3>')
      // 代码块
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4"><code>$1</code></pre>')
      // 段落
      .replace(/^(?!<h|<ul|<pre)(.*$)/gm, '<p class="mb-4">$1</p>')
      // 链接
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // 列表（简化处理）
      .replace(/(?:^- (.*$)\n?)+/gm, '<ul class="list-disc pl-6 mb-4">$&</ul>')
      .replace(/^- (.*$)/gm, '<li class="mb-1">$1</li>');

    return { __html: html };
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <article>
        <h1 className="mb-2 text-3xl font-bold">{page.title}</h1>
        <div className="mb-6 text-sm text-gray-500">
          更新于 {new Date(page.updatedAt).toLocaleDateString()}
        </div>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={renderMarkdown(page.content)}
        />
      </article>
    </div>
  );
};

export default DocContent;
