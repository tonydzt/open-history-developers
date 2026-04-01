# 错误经验库

本文件用于记录“用户指出且确认成立”的可复用错误，目标是把一次犯错转成长期规则。

## 使用方式

1. 开始任务前，先看本页的“高频规则摘要”。
2. 再查看对应 spec 的 `checklist.md` 中“历史错误自查”部分。
3. 当用户指出错误且确认成立后，先修复，再判断是否应收录到本页。

## 收录标准

- 仅收录“用户指出后确认成立”的错误。
- 优先收录重复出现过、影响范围大、容易复发、能提炼成明确规则的问题。
- 不收录一次性拼写、偶发环境问题、无法抽象成规则的个别失误。

## 高频规则摘要

- 浮层类 UI 默认使用共享浮层方案：`Portal + fixed + 统一 z-index`，不要直接写业务级 `absolute + z-index`。
- React Hook 的依赖数组长度和顺序必须稳定，不能因热更新或重构在不同 render 之间变化。
- Prisma schema 改动后，必须核对运行时查询是否仍依赖旧字段、旧可空假设或旧 relation 全字段读取。

## UI 浮层

### 规则 1：业务下拉菜单不得直接依赖父容器层级

- 问题模式：下拉菜单、popover、用户菜单被表格、sticky header、overflow 容器遮挡。
- 触发信号：菜单已经打开，但视觉上被页面内容盖住，只显示一部分，或完全不可见。
- 根因：浮层渲染在局部 stacking context 里，依赖父容器 `absolute + z-index`，被 `sticky`、`overflow-hidden`、局部 z-index 截断。
- 规则：任何需要浮在页面内容之上的菜单，默认使用 `Portal` 渲染到 `document.body`，并使用 `fixed` 定位和统一高层级 token。
- 案例：顶部分类下拉、用户头像菜单都出现过“被内容遮挡”的问题，后续统一改为 `Portal + fixed` 才稳定。
- 适用范围：前端、导航、用户菜单、确认框、Toast、Popover。

## React Hooks

### 规则 2：Hook 依赖数组必须保持形状稳定

- 问题模式：`useEffect` 在热更新或重构后报依赖数组长度变化错误。
- 触发信号：控制台报错 `The final argument passed to useEffect changed size between renders`。
- 根因：把会变化的函数依赖临时加入 effect 依赖数组，导致不同 render 间依赖项数量变化。
- 规则：依赖数组中的项必须固定；若定位/计算逻辑只在 effect 内使用，优先内联到 effect 内部，避免引入多余函数依赖。
- 案例：顶部分类下拉改成 `Portal` 后，曾因 `updateDesktopMenuPosition` 的依赖处理不稳触发该报错。
- 适用范围：React Hooks、交互组件、事件监听、副作用逻辑。

## Prisma / 数据契约

### 规则 3：Schema 变更后必须审计查询和运行时假设

- 问题模式：数据库字段已删或可空性已变，但运行时查询仍按旧 schema 工作，导致 Prisma 报错。
- 触发信号：出现 `PrismaClientKnownRequestError`、`PrismaClientValidationError`，或错误提示指向已不存在字段/非法 where 条件。
- 根因：schema 改动后，只改了模型或迁移，没有同步检查查询条件、`include: true` 全字段读取、旧 nullable 条件。
- 规则：每次 Prisma schema 改动后，必须检查：
  - 查询是否还引用旧字段
  - `where` 条件是否还保留旧 nullable 假设
  - relation 查询是否需要从 `true` 改为显式 `select`
- 案例：移除 `openApiAppId` 后，部分 `author: true` 查询和导航中的 `categoryId: { not: null }` 条件引发运行时错误。
- 适用范围：Prisma schema、迁移、API 路由、服务端组件查询。
