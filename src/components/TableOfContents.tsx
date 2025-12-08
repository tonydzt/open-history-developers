'use client';

import React, { useEffect, useState } from 'react';
import { DocSection, fetchSectionsByPageId } from '../data/mockData';

interface TableOfContentsProps {
  pageId: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ pageId }) => {
  const [sections, setSections] = useState<DocSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSections = async () => {
      try {
        const sectionsData = await fetchSectionsByPageId(pageId);
        setSections(sectionsData);
      } catch (error) {
        console.error('Failed to load table of contents:', error);
      } finally {
        setLoading(false);
      }
    };

    if (pageId) {
      loadSections();
    }
  }, [pageId]);

  if (loading) {
    return <div className="flex h-full items-center justify-center">加载中...</div>;
  }

  if (sections.length === 0) {
    return <div className="h-full p-4">无目录</div>;
  }

  const scrollToSection = (anchor: string) => {
    const element = document.getElementById(anchor);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="h-full overflow-y-auto border-l p-4">
      <h2 className="mb-4 text-lg font-semibold">目录</h2>
      <nav>
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => scrollToSection(section.anchor)}
                className={`block rounded px-2 py-1 text-sm transition-colors hover:bg-gray-100 ${section.level === 1 ? 'font-medium' : ''}`}
                style={{ paddingLeft: `${(section.level - 1) * 12}px` }}
              >
                {section.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default TableOfContents;
