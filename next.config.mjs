import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
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
