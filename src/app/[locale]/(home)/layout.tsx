import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: "[locale]/";
}) {
  const locale = (await params).locale;

  return <HomeLayout {...baseOptions(locale)}>{children}</HomeLayout>;
}
