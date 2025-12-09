import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: "[locale]/docs";
}) {
  const locale = (await params).locale;
  return (
    <DocsLayout tree={source.pageTree[locale]} {...baseOptions(locale)}>
      {children}
    </DocsLayout>
  );
}
