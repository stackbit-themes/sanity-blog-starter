import _ from "lodash";
import path from "path";
import {
  ContentSourceOptions,
  SanityContentSource,
} from "@stackbit/cms-sanity";
import { Locale, Model } from "@stackbit/types";
import { ContextualDocument } from "@stackbit/cms-sanity/dist/sanity-document-converter";
import {
  localeToLocaleFieldName,
  localizeFields,
  localizeModelFields,
  updateBaseTranslation,
} from "./content-source-utils";

export class LocalizedSanityContentSource extends SanityContentSource {
  private languageFile: string;
  private localizedModels: string[];
  private defaultLocale?: Locale;
  private originalModels: Model[];

  constructor(options: ContentSourceOptions & { languageFile: string }) {
    super(options);
    this.languageFile = path.join(options.rootPath, options.languageFile);
  }

  async reset(): Promise<void> {
    await super.reset();

    // find all localizable models based on the `i18n` mark
    const sanitySchema = await this.getSanitySchema();
    this.localizedModels =
      sanitySchema.models
        ?.filter((model) => model.i18n)
        .map((model) => model.name) ?? [];
    const locales = await this.getLocales();
    this.defaultLocale = locales.find((locale) => locale.default);
  }

  // convert @sanity/document-internationalization configuration file to Locale types
  async getLocales(): Promise<Locale[]> {
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

  // retrieve all models from Sanity
  // mark needed fields as localized and add plugin internal fields to schema
  async getModels(): Promise<Model[]> {
    this.originalModels = await super.getModels();
    return this.originalModels.map((model) => {
      if (this.localizedModels.includes(model.name)) {
        return {
          ...model,
          localized: true,
          fields: [
            ...localizeModelFields(model.fields),
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
        fields: localizeModelFields(model.fields),
      };
    });
  }

  // convert Sanity documents to Stackbit documents
  // and mark appropriate locales
  convertDocuments(options) {
    const documents = super.convertDocuments({
      ...options,
      modelMap: _.keyBy(this.originalModels, (model) => model.name),
    });
    return documents.map((document) => {
      if (this.localizedModels.includes(document.modelName)) {
        const sanitySourceDocument = document as ContextualDocument;
        const sanityDocument = (sanitySourceDocument.context.draftDocument ??
          sanitySourceDocument.context.publishedDocument)!;
        const localizedFields = localizeFields(document.fields);
        if (sanityDocument.__i18n_base?._ref) {
          localizedFields.__i18n_base = {
            type: "reference",
            refId: sanityDocument.__i18n_base._ref,
            refType: "document",
            localized: false
          }
        }
        return {
          ...document,
          fields: localizedFields,
          locale: sanityDocument.__i18n_lang,
        };
      }
      return {
        ...document,
        fields: localizeFields(document.fields),
      };
    });
  }

  // override behavior of updating reference to base translation.
  // when updating the reference, we change the _id of the document as well.
  async updateDocument(options): Promise<ContextualDocument> {
    const { document, operations, userContext } = options;
    if (
      this.localizedModels.includes(document.modelName) &&
      operations.length === 1 &&
      (operations[0].opType === "set" || operations[0].opType === "unset") &&
      operations[0].fieldPath[0] === "__i18n_base"
    ) {
      const op = operations[0];
      const userClient = this.getApiClientForUser({ userContext });
      return updateBaseTranslation(document, op, userClient);
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
              localeToLocaleFieldName(
                op.locale ?? this.defaultLocale?.code ?? "en-US"
              ),
            ],
          };
        }
        return op;
      }),
    });
  }

  // override document creation to support reference to base translation
  // and other internal locale fields
  async createDocument(options) {
    const { updateOperationFields, model, locale, defaultLocaleDocumentId } =
      options;
    if (this.localizedModels.includes(model.name) && locale) {
      this.logger.debug(
        `create document with locale ${locale} (base: ${defaultLocaleDocumentId})`
      );
      return super.createDocument({
        ...options,
        updateOperationFields: {
          ...updateOperationFields,
          __i18n_lang: {
            opType: "set",
            type: "string",
            value: options.locale,
          },
          ...(locale && defaultLocaleDocumentId
            ? {
                __i18n_base: {
                  opType: "set",
                  type: "reference",
                  refType: "document",
                  refId: defaultLocaleDocumentId,
                },
                _id: {
                  opType: "set",
                  type: "string",
                  value:
                    "drafts." + defaultLocaleDocumentId + "__i18n_" + locale,
                },
              }
            : {}),
        },
      });
    }
    return super.createDocument(options);
  }
}
