import createClient from "@sanity/client";
import createImageUrlBuilder from "@sanity/image-url";

// const postsDirectory = join(process.cwd(), '_posts')

// export function getPostSlugs() {
//   return fs.readdirSync(postsDirectory)
// }

// export function getPostBySlug(slug: string, fields: string[] = []) {
//   const realSlug = slug.replace(/\.md$/, '')
//   const fullPath = join(postsDirectory, `${realSlug}.md`)
//   const fileContents = fs.readFileSync(fullPath, 'utf8')
//   const { data, content } = matter(fileContents)

//   type Items = {
//     [key: string]: string
//   }

//   const items: Items = {}

//   // Ensure only the minimal needed data is exposed
//   fields.forEach((field) => {
//     if (field === 'slug') {
//       items[field] = realSlug
//     }
//     if (field === 'content') {
//       items[field] = content
//     }

//     if (typeof data[field] !== 'undefined') {
//       items[field] = data[field]
//     }
//   })

//   return items
// }

// export function getAllPosts(fields: string[] = []) {
//   const slugs = getPostSlugs()
//   const posts = slugs
//     .map((slug) => getPostBySlug(slug, fields))
//     // sort posts by date in descending order
//     .sort((post1, post2) => (post1.date > post2.date ? -1 : 1))
//   return posts
// }

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
    return isDraft || !map.has(id) ? map.set(id, doc) : map;
  }, new Map());

  return Array.from(overlayed.values());
}

function convertPost(post) {
  return {
    ...post,
    coverImage: urlForImage(post.coverImage).url(),
    slug: post.slug?.current,
    _id: post._id.startsWith("drafts.") ? post._id.slice(7) : post._id,
  };
}

export async function getAllPosts() {
  const pages = await getSanityClient().fetch("*[_type in $types]", {
    types: ["post"],
  });
  const allPages = overlayDrafts(pages);
  return allPages.map(convertPost);
}

export async function getPostBySlug(slugString): Promise<any> {
  const result = await getSanityClient().fetch<any>(
    "*[slug.current == $slug]",
    { slug: slugString }
  );
  const page = overlayDrafts(result)[0];
  return convertPost(page);
}
