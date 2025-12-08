import { redirect } from 'next/navigation';

export default function Home() {
  // 重定向到文档首页
  redirect('/docs');
}
