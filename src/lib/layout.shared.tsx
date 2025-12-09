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
          {/* tong注释：这里使用bg-blue-600替换了open-history的bg-primary-600，是因为open-history的bg-primary-600需要在tailwind.config.js中配置，这里没有配置tailwind.config.js，而且尝试配置tailwind.config.js也会被global.css里的样式覆盖，所以这里修改了class */}
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
