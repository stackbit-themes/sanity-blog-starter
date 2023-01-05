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

const HeroPost = ({
  postId,
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
}: Props) => {
  return (
    <section data-sb-object-id={postId}>
      <div className="mb-8 md:mb-16">
        <CoverImage title={title} src={coverImage} slug={slug} />
      </div>
      <div className="md:grid md:grid-cols-2 md:gap-x-16 lg:gap-x-8 mb-20 md:mb-28">
        <div>
          <h3 className="mb-4 text-4xl lg:text-5xl leading-tight">
            <Link as={`/posts/${slug}`} href="/posts/[...slug]">
              <a className="hover:underline" data-sb-field-path="title">{title}</a>
            </Link>
          </h3>
          <div className="mb-4 md:mb-0 text-lg" data-sb-field-path="date">
            <DateFormatter dateString={date} />
          </div>
        </div>
        <div data-sb-field-path="author">
          <p className="text-lg leading-relaxed mb-4">{excerpt}</p>
          <Avatar {...author}/>
        </div>
      </div>
    </section>
  )
}

export default HeroPost
