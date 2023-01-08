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
  // mapModels({ models }) {
  //   return models.map((model) => {
  //     if (model.name === "post") {
  //       return {
  //         ...model,
  //         localized: true,
  //         fields: [
  //           ...model.fields,
  //           {
  //             type: "string",
  //             name: "__i18n_lang",
  //             label: "lang",
  //             hidden: true,
  //           },
  //           {
  //             type: "reference",
  //             name: "__i18n_base",
  //             label: "Base translation",
  //             models: ["post"],
  //           },
  //         ],
  //       };
  //     }
  //     return model;
  //   });
  // },
  // mapDocuments({ documents, models }) {
  //   return documents.map((document) => {
  //     if (document.modelName === "post") {
  //       const sanitySourceDocument = document as ContextualDocument;
  //       const sanityDocument = (sanitySourceDocument.context.draftDocument ??
  //         sanitySourceDocument.context.publishedDocument)!;
  //       const result = {
  //         ...document,
  //         locale: sanityDocument.__i18n_lang || "en-US",
  //       };
  //       if (sanityDocument.__i18n_base) {
  //         result.fields.__i18n_base = {
  //           type: "reference",
  //           refId: sanityDocument.__i18n_base._ref,
  //           refType: "document",
  //         };
  //       }
  //       return result;
  //     }
  //     return document;
  //   });
  // },
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
            urlPath: `/post/${slugValue}`,
            locale: document.locale,
          };
        }),
    ];
  },
};

export default stackbitConfig;
