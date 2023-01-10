import createClient from "@sanity/client";
import createImageUrlBuilder from "@sanity/image-url";
import _ from "lodash";
import PostType from "../interfaces/post";

function getSanityClient() {
  return createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: "production",
    token: process.env.SANITY_TOKEN,
    useCdn: false,
    apiVersion: "2021-08-31",
  });
}

const imageBuilder = createImageUrlBuilder(getSanityClient());

export const urlForImage = (source) =>
  imageBuilder.image(source).auto("format").fit("max");

function overlayDrafts(docs): any {
  const documents = docs || [];
  const overlayed = documents.reduce((map, doc) => {
    if (!doc._id) {
      return map;
    }
    const isDraft = doc._id.startsWith("drafts.");
    const id = isDraft ? doc._id.slice(7) : doc._id;
    return isDraft || !map.has(id) ? map.set(id, {
      ...doc,
      id: doc._id,
      locale: doc.__i18n_lang
    }) : map;
  }, new Map());

  return Array.from(overlayed.values());
}

const fieldsQuery = `{
  _id,
  date,
  content,
  title,
  excerpt,
  __i18n_lang,
  __i18n_base,
  "slug": slug.current,
  "author": {
    "name": author->name,
    "picture": author->picture.asset->url,
    "bio": author->bio
  },
  "coverImage": coverImage.asset->url
}`;

export async function getAllPosts(
  locale?: string,
  isDefaultLocale?: boolean
): Promise<PostType[]> {
  let localeQuery = "";
  if (locale) {
    localeQuery = ` && (__i18n_lang == "${locale}"`;
    if (isDefaultLocale) {
      localeQuery += `|| __i18n_lang == null`;
    }
    localeQuery += ")";
  }
  const pages = await getSanityClient().fetch(
    `*[_type == "post"${localeQuery}]${fieldsQuery}`
  );
  const allPages = overlayDrafts(pages);
  return allPages;
}

export async function getPostBySlug(slugString): Promise<PostType> {
  const result = await getSanityClient().fetch<any>(
    `*[slug.current == $slug]${fieldsQuery}`,
    { slug: slugString }
  );
  const page = overlayDrafts(result)[0];
  return page;
}

export async function getTranslations(post) {
  let basePostId = post.__i18n_base?._ref || post._id;
  if (basePostId.startsWith("drafts.")) {
    basePostId = basePostId.slice(7);
  }
  const ids = [basePostId, "drafts." + basePostId];
  const result = await getSanityClient().fetch<any>(
    `*[_id in $ids || __i18n_base._ref in $ids]${fieldsQuery}`,
    { ids }
  );
  const allPages = overlayDrafts(result);
  return allPages.reduce((accum, curr) => {
    accum[curr.__i18n_lang || "en-US"] = "/posts/" + curr.slug;
    return accum;
  }, {});
}
