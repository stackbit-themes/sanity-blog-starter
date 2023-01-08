import { LocalizedSanityContentSource } from "./content-source";
import { RawConfig } from "@stackbit/sdk";
import _ from "lodash";

const stackbitConfig: RawConfig = {
  stackbitVersion: "~0.6.0",
  ssgName: "nextjs",
  nodeVersion: "16",
  contentSources: [
    new LocalizedSanityContentSource({
      projectId: process.env.SANITY_PROJECT_ID,
      rootPath: __dirname,
      studioPath: "studio",
      studioUrl: "http://localhost:3333",
      token: process.env.SANITY_TOKEN,
      dataset: "production",
      languageFile:
        "./studio/config/@sanity/document-internationalization.json",
    }),
  ],
  models: {
    post: { type: "page", urlPath: "/posts/{slug}" },
  },
  siteMap({ documents }) {
    return [
      {
        urlPath: "/",
        label: "Home",
        stableId: "home",
        locale: null,
      },
      ...documents
        .filter((document) => document.modelName === "post")
        .map((document) => {
          const slugField = document.fields.slug;
          const slugValue =
            slugField?.type === "slug" && slugField.localized !== true
              ? slugField.value
              : "";
          return {
            document,
            urlPath: `/posts/${slugValue}`,
            locale: document.locale,
          };
        }),
    ];
  },
};

export default stackbitConfig;
