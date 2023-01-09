import _ from "lodash";
import path from "path";
import crypto from "crypto";
import {
  ContentSourceOptions,
  SanityContentSource,
} from "@stackbit/cms-sanity";
import * as ContentSourceTypes from "@stackbit/types";
import { Model } from "@stackbit/types";
import { ContextualDocument } from "@stackbit/cms-sanity/dist/sanity-document-converter";

export class LocalizedSanityContentSource extends SanityContentSource {
  private languageFile: string;
  private localizedModels: string[];

  constructor(options: ContentSourceOptions & { languageFile: string }) {
    super(options);
    this.languageFile = path.join(options.rootPath, options.languageFile);
  }

  async init(options) {
    this.logger = options.logger;
    return super.init(options);
  }

  async reset(): Promise<void> {
    await super.reset();

    const sanitySchema = await this.getSanitySchema();
    this.localizedModels =
      sanitySchema.models
        ?.filter((model) => model.i18n)
        .map((model) => model.name) ?? [];
  }

  async getLocales(): Promise<ContentSourceTypes.Locale[]> {
    const languageConfig = require(this.languageFile);
    const languages = languageConfig.languages;
    return languages.map((lang, i) => {
      return {
        default:
          (languageConfig.base && languageConfig.base === lang.id) || i === 0,
        code: lang.id,
      };
    });
  }

  async getModels(): Promise<Model[]> {
    const models = await super.getModels();
    return models.map((model) => {
      if (this.localizedModels.includes(model.name)) {
        return {
          ...model,
          localized: true,
          fields: [
            ...model.fields,
            {
              type: "string",
              name: "__i18n_lang",
              label: "lang",
              hidden: true,
            },
            {
              type: "reference",
              name: "__i18n_base",
              label: "Base translation",
              models: [model.name],
            },
          ],
        };
      }
      return model;
    });
  }

  convertDocuments(options) {
    const documents = super.convertDocuments(options);
    return documents.map((document) => {
      if (this.localizedModels.includes(document.modelName)) {
        const sanitySourceDocument = document as ContextualDocument;
        const sanityDocument = (sanitySourceDocument.context.draftDocument ??
          sanitySourceDocument.context.publishedDocument)!;
        return {
          ...document,
          locale: sanityDocument.__i18n_lang || "en-US",
        };
      }
      return document;
    });
  }

  async updateDocument(options): Promise<ContextualDocument> {
    const { document, operations, userContext } = options;
    if (
      this.localizedModels.includes(document.modelName) &&
      operations.length === 1 &&
      (operations[0].opType === "set" || operations[0].opType === "unset") &&
      operations[0].fieldPath[0] === "__i18n_base"
    ) {
      const op = operations[0];
      const opField = op.field;

      const userClient = this.getApiClientForUser({ userContext });
      const sanitySourceDocument = document as ContextualDocument;
      const sanityDocument = (sanitySourceDocument.context.draftDocument ??
        sanitySourceDocument.context.publishedDocument)!;

      let updatedDocument;
      if (op.opType === "set") {
        updatedDocument = {
          ...sanityDocument,
          __i18n_base: {
            _ref: opField.refId,
            _strengthenOnPublish: {},
            _type: "reference",
            _weak: true,
          },
          _id:
            "drafts." + opField.refId + "__i18n_" + sanityDocument.__i18n_lang,
        };
      } else {
        updatedDocument = {
          ...sanityDocument,
          __i18n_base: null,
          _id: crypto.randomBytes(16).toString("hex"),
        };
      }
      if (sanityDocument._id !== updatedDocument._id) {
        const transaction = userClient
          .transaction()
          .createIfNotExists(updatedDocument)
          .delete(sanityDocument._id);

        await transaction.commit({ visibility: "async" });
      }
      return {
        ...sanitySourceDocument,
        id: updatedDocument._id,
      };
    }
    return super.updateDocument(options);
  }

  async createDocument(options) {
    if (this.localizedModels.includes(options.model.name) && options.locale) {
      this.logger.debug("create document with locale", options.locale);
      return super.createDocument({
        ...options,
        updateOperationFields: {
          ...options.updateOperationFields,
          __i18n_lang: {
            opType: "set",
            type: "string",
            value: options.locale,
          },
        },
      });
    }
    return super.createDocument(options);
  }
}
