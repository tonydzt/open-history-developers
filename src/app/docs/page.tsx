import { redirect } from 'next/navigation';

const DocsHomePage = () => {
  // 重定向到介绍页面
  redirect('/docs/introduction');
};

export default DocsHomePage;
