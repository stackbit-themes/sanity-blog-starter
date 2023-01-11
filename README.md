# Stackbit blog starter for Sanity

This example showcases Stackbit with a simple Next.js and Sanity-based blog that implements localization.

Based on Next.js's [blog-starter](https://github.com/vercel/next.js/tree/canary/examples/blog-starter).

# Getting started

## Local

```bash
# Clone the repository
git clone https://github.com/stackbit/sanity-blog-starter

cd sanity blog-starter

# Install dependencies
npm install

# Run Stackbit local dev
stackbit dev
```

## Stackbit

Use this repository with [Stackbit import flow](https://app.stackbit.com/custom).

# Localization

The site implements two types of localization:

## Document-level localization

Using the `@sanity/document-internationalization` plugin.

The language configuration is specified in `studio/config/@sanity/document-internationalization.json`:

```json
{
  "idStructure": "delimiter",
  "referenceBehavior": "strong",
  "base": "en-US",
  "languages": [
    { "id": "en-US", "title": "English" },
    { "id": "es", "title": "Spanish" },
    { "id": "fr", "title": "French" }
  ]
}
```

Each translation document gets 2 new fields:

* `__i18n_lang` the locale
* `__i18n_base` a reference to the "base" translation

## Field-level localization

Using the `@sanity/language-filter` plugin.

Shares the same language configuration file as document-level localization.

Uses a custom-defined type `localeString` (`studio/schema/localeString.js`) to define a string field that can contain multiple translations.

# Stackbit Content Source

We define a custom Stackbit Content Source (`lib/content-source.ts`) that is referenced in our `stackbit.config.js`. 

This content source inherits from a basic Sanity content source (available through `@stackbit/cms-sanity`) and adds additional handling for localization based on its implementation for this project.

Mainly, it performs the following -

1. Marks documents with the appropriate `locale` based on `__i18n_lang`
2. Maintains the relationship to the base translation using `__i18n_base`
3. Translates custom `localeString` into a native Stackbit localized string field.


# Stackbit Studio integration

To support a tight integration with the Stackbit Studio, we've also implemented the following - 


1. `stackbitLocaleChanged` event handler to detect when a user changes the locale in the Stackbit Studio:

```javascript
window.addEventListener("stackbitLocaleChanged", (event) => {
    const locale = event.detail.locale;
    // ...
    // redirect to appropriate page
}
```

2. Tell Stackbit that the locale was changed in language selector:

```jsx
<select
    onChange={(e) => {
        const locale = e.target.value;
        window.location.href = props.translations[locale];
        // update Stackbit Studio
        window.stackbit.setLocale(locale);
    }}
>
```