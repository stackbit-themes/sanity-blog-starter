import { LocalizedSanityContentSource } from "./content-source";
import { RawConfig } from "@stackbit/sdk";
import { ContextualDocument } from "@stackbit/cms-sanity/dist/sanity-document-converter";

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
  mapModels({ models }) {
    return models.map((model) => {
      if (model.name === "post") {
        return {
          ...model,
          localized: true,
        };
      }
      return model;
    });
  },
  mapDocuments({ documents, models }) {
    return documents.map((document) => {
      if (document.modelName === "post") {
        const sanitySourceDocument = document as ContextualDocument;
        const sanityDocument = (sanitySourceDocument.context.draftDocument ??
          sanitySourceDocument.context.publishedDocument)!;
        console.log(sanityDocument);
        return {
          ...document,
          locale: sanityDocument.__i18n_lang || "en-US",
        };
      }
      return document;
    });
  },
  siteMap({ documents }) {
    return [
      {
        urlPath: "/",
        label: "Home",
        stableId: "home",
        locale: null
      },
      ...documents
        .filter((document) => document.modelName === "post")
        .map((document) => {
          const slugField = document.fields.slug;
          const slugValue =
            slugField.type === "slug" && slugField.localized !== true
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
