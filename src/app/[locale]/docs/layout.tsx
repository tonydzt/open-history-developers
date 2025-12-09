import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import type { ReactNode } from 'react';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const locale = (await params).locale;
  return (
    <DocsLayout tree={source.pageTree[locale]} {...baseOptions(locale)}>
      {children}
    </DocsLayout>
  );
}
