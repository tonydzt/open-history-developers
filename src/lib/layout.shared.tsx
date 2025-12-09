import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { i18n } from "@/lib/i18n";
import { BookIcon } from "lucide-react";

// 配置参考：https://fumadocs.dev/docs/ui/layouts/docs#nav
export function baseOptions(locale: string): BaseLayoutProps {
  return {
    i18n,
    nav: {
      title: (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold text-gray-900">developers</span>
        </div>
      ),
      url: `/${locale}`,
    },
    links: [
      {
        icon: <BookIcon />,
        text: "Documentation",
        url: `/${locale}/docs`,
        secondary: false,
      },
    ],
  };
}
