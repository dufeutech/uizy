import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    "index",
    "getting-started",
    {
      type: "category",
      label: "CSS Utilities",
      link: { type: "doc", id: "css-utilities/index" },
      items: [
        "css-utilities/display",
        "css-utilities/spacing",
        "css-utilities/grid",
        "css-utilities/typography",
        "css-utilities/borders",
        "css-utilities/shadows",
        "css-utilities/extras",
      ],
    },
    {
      type: "category",
      label: "JavaScript API",
      link: { type: "doc", id: "javascript-api/index" },
      items: [
        "javascript-api/components",
        "javascript-api/actions",
        "javascript-api/stores",
        "javascript-api/directives",
        "javascript-api/plugins",
        "javascript-api/theme",
        "javascript-api/layout-config",
      ],
    },
    {
      type: "category",
      label: "Layout",
      link: { type: "doc", id: "layout/index" },
      items: [
        "layout/css-classes",
        {
          type: "category",
          label: "Web Components",
          link: { type: "doc", id: "layout/web-components/index" },
          items: [
            "layout/web-components/app",
            "layout/web-components/header",
            "layout/web-components/footer",
            "layout/web-components/drawer",
            "layout/web-components/main",
            "layout/web-components/overlay",
            "layout/web-components/system-bar",
            "layout/web-components/uizy-box",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Guides",
      link: { type: "doc", id: "guides/index" },
      items: [
        "guides/complete-app",
        "guides/responsive-design",
        "guides/customization",
      ],
    },
    {
      type: "category",
      label: "Reference",
      items: ["reference/cheatsheet"],
    },
  ],
};

export default sidebars;
