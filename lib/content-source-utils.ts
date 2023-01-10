import _ from "lodash";
import crypto from "crypto";
import {
  Field,
  UpdateOperationUnset,
  UpdateOperationSet,
  DocumentField,
  Model,
} from "@stackbit/types";
import { ContextualDocument } from "@stackbit/cms-sanity/dist/sanity-document-converter";

export function localeFieldNameToLocale(localeFieldName: string) {
  return localeFieldName.replace("_", "-");
}

export function localeToLocaleFieldName(locale: string) {
  return locale.replace("-", "_");
}

export function localizeModelFields(fields: Field[]): Field[] {
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

export function localizeFields(
  fields: Record<string, DocumentField>,
  model: Model
): Record<string, DocumentField> {
  const modelFieldByName = _.keyBy(model.fields, modelField => modelField.name);
  const result = _.reduce(
    fields,
    (accum, field, fieldName) => {
      const modelField = modelFieldByName[fieldName];
      if (modelField.type === "string" && modelField.localized) {
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
              if (locale !== "_type") {
                accum[localeFieldNameToLocale(locale)] = { value };
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
  // TODO handle nested objects if needed
  return result;
}

export async function updateBaseTranslation(
  sanitySourceDocument: ContextualDocument,
  op: UpdateOperationSet | UpdateOperationUnset,
  userClient: any
) {
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
        _id: "drafts." + opField.refId + "__i18n_" + sanityDocument.__i18n_lang,
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
