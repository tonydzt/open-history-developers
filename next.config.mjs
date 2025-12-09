import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // tong注释：这里配置了重定向，当访问根路径时，会重定向到默认的语言路径（例如：'/en'），防止直接访问根目录404
  async redirects() {
    return [
      {
        source: '/',  // 当访问根路径时
        destination: '/en',  // 重定向到默认的语言路径（例如：'/en'）
        permanent: true,  // 永久重定向
      },
    ];
  },
};

export default withMDX(config);
