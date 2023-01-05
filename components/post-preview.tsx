import Avatar from './avatar'
import DateFormatter from './date-formatter'
import CoverImage from './cover-image'
import Link from 'next/link'
import type Author from '../interfaces/author'

type Props = {
  postId: string
  title: string
  coverImage: string
  date: string
  excerpt: string
  author: Author
  slug: string
}

const PostPreview = ({
  postId,
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
}: Props) => {
  return (
    <div data-sb-object-id={postId}>
      <div className="mb-5">
        {coverImage && <CoverImage slug={slug} title={title} src={coverImage} />}
      </div>
      <h3 className="text-3xl mb-3 leading-snug">
        <Link as={`/posts/${slug}`} href="/posts/[...slug]">
          <a className="hover:underline" data-sb-field-path="title">{title}</a>
        </Link>
      </h3>
      <div className="text-lg mb-4" data-sb-field-path="date">
        {date && <DateFormatter dateString={date} />}
      </div>
      <p className="text-lg leading-relaxed mb-4" data-sb-field-path="excerpt">{excerpt}</p>
      <div data-sb-field-path="author">{author && <Avatar {...author} />}</div>
    </div>
  )
}

export default PostPreview
