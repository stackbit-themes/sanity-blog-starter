const languageConfig = require("../config/@sanity/document-internationalization.json");
export default {
  title: "Localized string",
  name: "localeString",
  type: "object",
  fieldsets: [
    {
      title: "Translations",
      name: "translations",
      options: { collapsible: true },
    },
  ],
  fields: languageConfig.languages.map((lang, i) => ({
    title: lang.title,
    name: lang.id.replace("-", "_"),
    type: "string",
    fieldset:
      (languageConfig.base && lang.id === languageConfig.base) || i === 0
        ? null
        : "translations",
  })),
};
