import _ from "lodash";
import { LocalizedSanityContentSource } from "./lib/content-source";
import { defineStackbitConfig } from "@stackbit/types";

const stackbitConfig = defineStackbitConfig({
  stackbitVersion: "~0.6.0",
  ssgName: "nextjs",
  nodeVersion: "16",
  import: {
    type: "sanity",
    contentFile: "sanity-export/export.tar.gz",
    sanityStudioPath: "studio",
    deployStudio: false,
    deployGraphql: false,
    projectIdEnvVar: "SANITY_PROJECT_ID",
    datasetEnvVar: "SANITY_DATASET",
    tokenEnvVar: "SANITY_TOKEN",
  },
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
        label: "Home",
        urlPath: "/",
        stableId: "home",
      },
      ...require("./studio/config/@sanity/document-internationalization.json").languages.map(
        (lang) => {
          return {
            label: lang.title,
            urlPath: `/${lang.id}`,
            stableId: lang.id,
            locale: lang.id,
          };
        }
      ),
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
});

export default stackbitConfig;
