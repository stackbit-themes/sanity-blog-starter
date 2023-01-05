
export default {
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Name",
      validation: (Rule) => Rule.required(),
      type: "string",
    },
    {
      name: "picture",
      title: "Picture",
      type: "image",
      options: {
        hotspot: true,
      },
    },
    {
      name: "bio",
      title: "Bio",
      type: "localeString"
    }
  ],
  preview: {
    select: {
      title: "name",
      media: "image",
    },
  },
};
