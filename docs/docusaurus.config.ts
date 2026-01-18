import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "U-izy",
  tagline: "Tiny footprint, limitless possibilities",
  favicon: "img/logo.png",

  future: {
    v4: true,
  },

  url: "https://dufeutech.github.io",
  baseUrl: "/uizy/",

  organizationName: "dufeutech",
  projectName: "uizy",
  trailingSlash: false,

  onBrokenLinks: "throw",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/dufeutech/uizy/tree/main/docs/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: "/",
        highlightSearchTermsOnTargetPage: true,
        searchResultLimits: 8,
        searchBarShortcutHint: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  themeConfig: {
    image: "img/uizy-social-card.jpg",
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "U-izy",
      logo: {
        alt: "Uizy Logo",
        src: "img/logo.png",
      },
      items: [
        {
          href: "https://github.com/dufeutech/uizy",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Learn",
          items: [
            {
              label: "Getting Started",
              to: "/getting-started",
            },
            {
              label: "CSS Utilities",
              to: "/css-utilities",
            },
            {
              label: "JavaScript API",
              to: "/javascript-api",
            },
          ],
        },
        {
          title: "Reference",
          items: [
            {
              label: "Cheatsheet",
              to: "/reference/cheatsheet",
            },
            {
              label: "Layout",
              to: "/layout",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/dufeutech/uizy",
            },
            {
              label: "NPM",
              href: "https://www.npmjs.com/package/@dufeut/uizy",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Uizy. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "css"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
