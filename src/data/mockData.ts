// 文档系统的Mock数据

// 数据库表结构接口
export interface DocCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  parentId?: string;
}

export interface DocPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  categoryId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocSection {
  id: string;
  pageId: string;
  title: string;
  level: number;
  order: number;
  anchor: string;
}

// Mock数据
export const mockCategories: DocCategory[] = [
  {
    id: 'cat-1',
    name: '快速开始',
    slug: 'getting-started',
    order: 1
  },
  {
    id: 'cat-2',
    name: 'API参考',
    slug: 'api-reference',
    order: 2
  },
  {
    id: 'cat-3',
    name: '使用指南',
    slug: 'guides',
    order: 3
  }
];

export const mockPages: DocPage[] = [
  {
    id: 'page-1',
    title: '介绍',
    slug: 'introduction',
    content: `# 开发者平台介绍

欢迎使用我们的开发者平台文档系统！

## 平台概述

我们的平台提供强大的API和工具，帮助开发者构建出色的应用程序。

## 核心功能

- **易于使用**：简单直观的API设计
- **可扩展**：能够处理高流量和大数据集
- **安全可靠**：企业级安全功能
- **文档完善**：全面的文档和示例

## 快速开始

1. [创建账号](#)
2. [生成API密钥](#)
3. [调用第一个API](#)

## 前置条件

- 基本的REST API知识
- 熟悉JSON格式
- 现代Web浏览器或HTTP客户端

## 下一步

查看我们的[快速开始指南](#)，在几分钟内上手！`,
    categoryId: 'cat-1',
    order: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'page-2',
    title: '快速入门',
    slug: 'quick-start',
    content: '# 快速入门\n\n在几分钟内开始使用我们的平台！\n\n## 步骤1：创建账号\n\n访问我们的[注册页面](#)创建免费账号。\n\n## 步骤2：生成API密钥\n\n登录后，在仪表板的API密钥部分生成新的密钥对。\n\n## 步骤3：调用第一个API\n\n```bash\ncurl -X GET \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  https://api.example.com/v1/health\n```\n\n## 步骤4：探索API\n\n现在你可以探索我们全面的API了。查看[API参考](#)部分获取所有端点的详细文档。\n\n## 步骤5：加入社区\n\n加入我们的[Discord社区](#)，与其他开发者交流并获得帮助。',
    categoryId: 'cat-1',
    order: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'page-3',
    title: '认证机制',
    slug: 'authentication',
    content: '# 认证机制\n\n了解如何与我们的API进行认证。\n\n## API密钥\n\n我们的API使用API密钥进行认证。你可以在账号仪表板中生成API密钥。\n\n### 密钥类型\n\n- **公钥**：用于客户端应用程序\n- **私钥**：用于服务器端应用程序\n- **JWT令牌**：用于用户特定的认证\n\n## 认证头部\n\n```bash\n# 使用API密钥\nAuthorization: Bearer YOUR_API_KEY\n\n# 使用JWT令牌\nAuthorization: JWT YOUR_JWT_TOKEN\n```\n\n## 安全最佳实践\n\n- 切勿在客户端代码中暴露私钥\n- 定期轮换密钥\n- 使用环境变量存储密钥\n- 实现适当的访问控制\n\n## 速率限制\n\n我们的API实施速率限制，以确保公平使用。查看[速率限制](#)部分了解更多详情。',
    categoryId: 'cat-2',
    order: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export const mockSections: DocSection[] = [
  {
    id: 'sec-1',
    pageId: 'page-1',
    title: '开发者平台介绍',
    level: 1,
    order: 1,
    anchor: '开发者平台介绍'
  },
  {
    id: 'sec-2',
    pageId: 'page-1',
    title: '平台概述',
    level: 2,
    order: 2,
    anchor: '平台概述'
  },
  {
    id: 'sec-3',
    pageId: 'page-1',
    title: '核心功能',
    level: 2,
    order: 3,
    anchor: '核心功能'
  },
  {
    id: 'sec-4',
    pageId: 'page-1',
    title: '快速开始',
    level: 2,
    order: 4,
    anchor: '快速开始'
  },
  {
    id: 'sec-5',
    pageId: 'page-1',
    title: '前置条件',
    level: 2,
    order: 5,
    anchor: '前置条件'
  },
  {
    id: 'sec-6',
    pageId: 'page-1',
    title: '下一步',
    level: 2,
    order: 6,
    anchor: '下一步'
  },
  {
    id: 'sec-7',
    pageId: 'page-2',
    title: '快速入门',
    level: 1,
    order: 1,
    anchor: '快速入门'
  },
  {
    id: 'sec-8',
    pageId: 'page-2',
    title: '步骤1：创建账号',
    level: 2,
    order: 2,
    anchor: '步骤1：创建账号'
  },
  {
    id: 'sec-9',
    pageId: 'page-2',
    title: '步骤2：生成API密钥',
    level: 2,
    order: 3,
    anchor: '步骤2：生成API密钥'
  },
  {
    id: 'sec-10',
    pageId: 'page-2',
    title: '步骤3：调用第一个API',
    level: 2,
    order: 4,
    anchor: '步骤3：调用第一个API'
  },
  {
    id: 'sec-11',
    pageId: 'page-2',
    title: '步骤4：探索API',
    level: 2,
    order: 5,
    anchor: '步骤4：探索API'
  },
  {
    id: 'sec-12',
    pageId: 'page-2',
    title: '步骤5：加入社区',
    level: 2,
    order: 6,
    anchor: '步骤5：加入社区'
  },
  {
    id: 'sec-13',
    pageId: 'page-3',
    title: '认证机制',
    level: 1,
    order: 1,
    anchor: '认证机制'
  },
  {
    id: 'sec-14',
    pageId: 'page-3',
    title: 'API密钥',
    level: 2,
    order: 2,
    anchor: 'api密钥'
  },
  {
    id: 'sec-15',
    pageId: 'page-3',
    title: '密钥类型',
    level: 3,
    order: 3,
    anchor: '密钥类型'
  },
  {
    id: 'sec-16',
    pageId: 'page-3',
    title: '认证头部',
    level: 2,
    order: 4,
    anchor: '认证头部'
  },
  {
    id: 'sec-17',
    pageId: 'page-3',
    title: '安全最佳实践',
    level: 2,
    order: 5,
    anchor: '安全最佳实践'
  },
  {
    id: 'sec-18',
    pageId: 'page-3',
    title: '速率限制',
    level: 2,
    order: 6,
    anchor: '速率限制'
  }
];

// Mock API函数
export const fetchCategories = async (): Promise<DocCategory[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockCategories;
};

export const fetchPagesByCategory = async (categoryId: string): Promise<DocPage[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockPages.filter(page => page.categoryId === categoryId).sort((a, b) => a.order - b.order);
};

export const fetchPageBySlug = async (slug: string): Promise<DocPage | null> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockPages.find(page => page.slug === slug) || null;
};

export const fetchSectionsByPageId = async (pageId: string): Promise<DocSection[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockSections.filter(section => section.pageId === pageId).sort((a, b) => a.order - b.order);
};

export const fetchAllPages = async (): Promise<DocPage[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockPages;
};
