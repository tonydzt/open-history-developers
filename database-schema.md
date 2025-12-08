# 开发者平台文档系统 - 数据库表结构

## 概述

本文档描述了开发者平台文档系统的数据库表结构，包含三个主要表：`doc_categories`（文档分类）、`doc_pages`（文档页面）和`doc_sections`（文档章节）。

## 表结构设计

### 1. 文档分类表 (`doc_categories`)

存储文档的主要分类信息，用于组织和导航。

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| `id` | `VARCHAR(50)` | `PRIMARY KEY` | 分类唯一标识 |
| `name` | `VARCHAR(255)` | `NOT NULL` | 分类名称 |
| `slug` | `VARCHAR(255)` | `NOT NULL UNIQUE` | URL友好的分类标识符 |
| `order` | `INT` | `NOT NULL DEFAULT 0` | 分类显示顺序 |
| `parent_id` | `VARCHAR(50)` | `REFERENCES doc_categories(id)` | 父分类ID（用于嵌套分类） |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 更新时间 |

### 2. 文档页面表 (`doc_pages`)

存储实际的文档内容。

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| `id` | `VARCHAR(50)` | `PRIMARY KEY` | 页面唯一标识 |
| `title` | `VARCHAR(255)` | `NOT NULL` | 页面标题 |
| `slug` | `VARCHAR(255)` | `NOT NULL UNIQUE` | URL友好的页面标识符 |
| `content` | `TEXT` | `NOT NULL` | Markdown格式的页面内容 |
| `category_id` | `VARCHAR(50)` | `NOT NULL REFERENCES doc_categories(id)` | 所属分类ID |
| `order` | `INT` | `NOT NULL DEFAULT 0` | 页面在分类中的显示顺序 |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 更新时间 |

### 3. 文档章节表 (`doc_sections`)

存储文档页面的章节信息，用于生成右侧的当前页目录。

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| `id` | `VARCHAR(50)` | `PRIMARY KEY` | 章节唯一标识 |
| `page_id` | `VARCHAR(50)` | `NOT NULL REFERENCES doc_pages(id) ON DELETE CASCADE` | 所属页面ID |
| `title` | `VARCHAR(255)` | `NOT NULL` | 章节标题 |
| `level` | `INT` | `NOT NULL DEFAULT 1` | 章节层级（1-6对应H1-H6） |
| `order` | `INT` | `NOT NULL DEFAULT 0` | 章节在页面中的显示顺序 |
| `anchor` | `VARCHAR(255)` | `NOT NULL` | 章节对应的HTML锚点 |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 更新时间 |

## 实体关系图

```
+-----------------+        +-----------------+
| doc_categories  |        |   doc_pages     |
+-----------------+        +-----------------+
| id              |<-------| category_id     |
| name            |        | title           |
| slug            |        | slug            |
| order           |        | content         |
| parent_id       |<-------| order           |
| created_at      |        | created_at      |
| updated_at      |        | updated_at      |
+-----------------+        +-----------------+
                                |
                                |
                                v
                        +-----------------+
                        | doc_sections    |
                        +-----------------+
                        | id              |
                        | page_id         |
                        | title           |
                        | level           |
                        | order           |
                        | anchor          |
                        | created_at      |
                        | updated_at      |
                        +-----------------+
```

## 示例数据

### 1. 文档分类示例数据

```sql
INSERT INTO doc_categories (id, name, slug, "order") VALUES
('cat-1', '快速开始', 'getting-started', 1),
('cat-2', 'API参考', 'api-reference', 2),
('cat-3', '使用指南', 'guides', 3);
```

### 2. 文档页面示例数据

```sql
INSERT INTO doc_pages (id, title, slug, content, category_id, "order", created_at, updated_at) VALUES
('page-1', '介绍', 'introduction', '# 开发者平台介绍\n\n欢迎使用我们的开发者平台文档系统！', 'cat-1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('page-2', '快速入门', 'quick-start', '# 快速入门\n\n在几分钟内开始使用我们的平台！', 'cat-1', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('page-3', '认证机制', 'authentication', '# 认证机制\n\n了解如何与我们的API进行认证。', 'cat-2', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

### 3. 文档章节示例数据

```sql
INSERT INTO doc_sections (id, page_id, title, level, "order", anchor, created_at, updated_at) VALUES
('sec-1', 'page-1', '开发者平台介绍', 1, 1, '开发者平台介绍', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sec-2', 'page-1', '平台概述', 2, 2, '平台概述', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sec-3', 'page-2', '快速入门', 1, 1, '快速入门', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sec-4', 'page-2', '步骤1：创建账号', 2, 2, '步骤1：创建账号', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sec-5', 'page-3', '认证机制', 1, 1, '认证机制', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sec-6', 'page-3', 'API密钥', 2, 2, 'api密钥', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

## 部署到Vercel

### 步骤1：准备项目

确保项目已经成功构建，并且`.next`目录存在。

### 步骤2：连接Vercel

1. 访问 [Vercel官网](https://vercel.com/)
2. 登录或注册账号
3. 点击 "Add New" -> "Project"
4. 选择 "Import Git Repository"
5. 连接你的GitHub仓库

### 步骤3：配置部署

1. 选择仓库后，Vercel会自动检测Next.js项目
2. 确保构建命令为：`npm run build`
3. 确保输出目录为：`.next`
4. 点击 "Deploy"

### 步骤4：完成部署

部署完成后，Vercel会提供一个域名，你可以通过该域名访问你的文档网站。

## 项目特点

- **三栏布局**：左侧总目录、中间文档内容、右侧当前页目录
- **动态路由**：支持从数据库动态获取文档内容
- **Mock数据**：包含完整的mock数据，便于开发和测试
- **TypeScript支持**：使用TypeScript开发，类型安全
- **响应式设计**：适配不同屏幕尺寸
- **支持Markdown**：使用Markdown编写文档，简单高效
- **易于部署**：支持直接部署到Vercel

## 后续扩展建议

1. **接入真实数据库**：实现后端API，从数据库动态获取文档内容
2. **添加搜索功能**：集成搜索服务，支持全文搜索
3. **添加版本控制**：支持文档的多版本管理
4. **添加内容管理系统**：实现可视化的文档编辑界面
5. **添加用户反馈功能**：支持用户对文档进行评论和反馈
6. **使用专业Markdown渲染库**：如react-markdown或marked，提供更好的Markdown渲染效果
