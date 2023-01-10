import _ from "lodash";
import path from "path";
import crypto from "crypto";
import {
  ContentSourceOptions,
  SanityContentSource,
} from "@stackbit/cms-sanity";
import * as ContentSourceTypes from "@stackbit/types";
import {
  Model,
  Field,
  UpdateOperation,
  UpdateOperationUnset,
  UpdateOperationSet,
} from "@stackbit/types";
import { ContextualDocument } from "@stackbit/cms-sanity/dist/sanity-document-converter";

export class LocalizedSanityContentSource extends SanityContentSource {
  private languageFile: string;
  private localizedModels: string[];
  private defaultLocale?: Locale;

  constructor(options: ContentSourceOptions & { languageFile: string }) {
    super(options);
    this.languageFile = path.join(options.rootPath, options.languageFile);
  }

  async reset(): Promise<void> {
    await super.reset();

    const sanitySchema = await this.getSanitySchema();
    this.localizedModels =
      sanitySchema.models
        ?.filter((model) => model.i18n)
        .map((model) => model.name) ?? [];
    const locales = await this.getLocales();
    this.defaultLocale = locales.find((locale) => locale.default);
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

  localizeModelFields(fields: Field[]): Field[] {
    return fields.map((field) => {
      if (
        field.type === "model" &&
        field.models?.length === 1 &&
        field.models[0] === "localeString"
      ) {
        return {
          ..._.omit(field, ["models"]),
          type: "string",
          localized: true,
        };
      }
      return field;
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
            ...this.localizeModelFields(model.fields),
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
      return {
        ...model,
        fields: this.localizeModelFields(model.fields),
      };
    });
  }

  localizeFields(
    fields: Record<string, ContentSourceTypes.DocumentField>
  ): Record<string, ContentSourceTypes.DocumentField> {
    const result = _.reduce(
      fields,
      (accum, field, fieldName) => {
        if (field.type === "string" && field.localized) {
          const fieldValue: any = _.get(field, "value");
          if (!fieldValue) {
            return accum;
          }
          accum[fieldName] = {
            type: "string",
            localized: true,
            locales: _.reduce(
              fieldValue,
              (accum, value, locale) => {
                console.log(locale)
                if (locale !== "_type") {
                  accum[locale.replace("_", "-")] = { value };
                }
                return accum;
              },
              {}
            ),
          };
        } else {
          accum[fieldName] = field;
        }
        return accum;
      },
      {}
    );
    return result;
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
          fields: this.localizeFields(document.fields),
          locale: sanityDocument.__i18n_lang,
        };
      }
      return {
        ...document,
        fields: this.localizeFields(document.fields),
      };
    });
  }

  async updateBaseTranslation(
    sanitySourceDocument: ContextualDocument,
    op: UpdateOperationSet | UpdateOperationUnset,
    userContext: any
  ) {
    const userClient = this.getApiClientForUser({ userContext });
    const sanityDocument = (sanitySourceDocument.context.draftDocument ??
      sanitySourceDocument.context.publishedDocument)!;

    let updatedDocument;
    if (op.opType === "set") {
      const opField = op.field;
      if (opField.type == "reference") {
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
      }
    } else {
      updatedDocument = {
        ...sanityDocument,
        __i18n_base: null,
        _id: crypto.randomBytes(16).toString("hex"),
      };
    }
    if (updatedDocument && sanityDocument._id !== updatedDocument._id) {
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

  async updateDocument(options): Promise<ContextualDocument> {
    const { document, operations, userContext } = options;
    if (
      this.localizedModels.includes(document.modelName) &&
      operations.length === 1 &&
      (operations[0].opType === "set" || operations[0].opType === "unset") &&
      operations[0].fieldPath[0] === "__i18n_base"
    ) {
      const op = operations[0];
      return this.updateBaseTranslation(document, op, userContext);
    }
    return super.updateDocument({
      ...options,
      operations: operations.map((op) => {
        if (
          op.opType === "set" &&
          op.modelField?.type === "string" &&
          op.modelField.localized
        ) {
          return {
            ...op,
            fieldPath: [
              ...op.fieldPath,
              (op.locale ?? this.defaultLocale?.code ?? "en-US").replace(
                "-",
                "_"
              ),
            ],
          };
        }
        return op;
      }),
    });
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
