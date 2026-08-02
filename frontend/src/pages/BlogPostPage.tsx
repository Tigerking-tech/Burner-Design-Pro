import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useSEO } from '../hooks/useSEO'
import { getPostBySlug, getAllPosts, BlogPost } from '../data/blogData'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import TagPill, { categoryColorMap } from '../components/blog/TagPill'
import Breadcrumb from '../components/blog/Breadcrumb'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ArrowLeft, Clock, Calendar, User, ArrowRight, Share2, Copy, Check } from 'lucide-react'
import { useState } from 'react'

const SITE_ORIGIN = 'https://burnerdesignpro.com'

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function getRelatedPosts(currentPost: BlogPost, count: number = 3): BlogPost[] {
  const allPosts = getAllPosts().filter((p) => p.slug !== currentPost.slug)
  const scored = allPosts.map((post) => {
    let score = 0
    if (post.category && currentPost.category && post.category === currentPost.category) {
      score += 5
    }
    const currentTags = new Set(currentPost.tags || [])
    for (const tag of post.tags || []) {
      if (currentTags.has(tag)) score += 2
    }
    return { post, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, count).map((s) => s.post)
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const post = useMemo(() => getPostBySlug(slug ?? ''), [slug])

  const [copied, setCopied] = useState(false)

  const relatedPosts = useMemo(() => {
    if (!post) return []
    return getRelatedPosts(post, 3)
  }, [post])

  const categoryColor = post?.category ? categoryColorMap[post.category] || 'slate' : 'slate'

  const canonicalPath = `/blog/${slug}`
  const ogImage = post?.coverImage || '/og-image.png'
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${SITE_ORIGIN}${ogImage}`
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`

  useSEO({
    title: `${post?.title || 'Article'} | BurnerDesignPro Blog`,
    description: post?.description,
    keywords: post?.keywords || (post?.tags ? post.tags.join(', ') : undefined),
    canonicalPath,
    ogTitle: post?.title,
    ogDescription: post?.description,
    ogImage: fullOgImage,
    jsonLd: post
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.date,
          author: {
            '@type': 'Organization',
            name: 'BurnerDesignPro',
          },
          publisher: {
            '@type': 'Organization',
            name: 'BurnerDesignPro',
            logo: {
              '@type': 'ImageObject',
              url: `${SITE_ORIGIN}/og-image.png`,
            },
          },
          keywords: (post.tags || []).join(', '),
          image: [fullOgImage],
          url: canonicalUrl,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl,
          },
        }
      : undefined,
  })

  useEffect(() => {
    if (slug === undefined || post === undefined) {
      const t = setTimeout(() => {
        navigate('/blog', { replace: false })
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [slug, post, navigate])

  const handleCopyLink = () => {
    const url = window.location.href
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    } else {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-4xl mx-auto px-4 py-16 md:px-8">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-black/20 p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowLeft className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Post Not Found
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              The article you&apos;re looking for doesn&apos;t exist or has been moved.
              Redirecting you to the blog shortly...
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/30"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const truncatedTitle =
    post.title.length > 40 ? post.title.slice(0, 40) + '...' : post.title

  return (
    <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50 min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 md:px-8">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all articles
        </Link>

        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: truncatedTitle },
          ]}
          className="mb-8"
        />

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <TagPill label={post.category || 'General'} color={categoryColor} />
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTime}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-5 leading-tight">
            {post.title}
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            {post.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(post.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {post.author}
            </span>
          </div>
        </header>

        <hr className="border-slate-200 dark:border-slate-800 mb-2" />

        <div className="prose prose-slate dark:prose-invert max-w-none mt-8 prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white prose-h2:text-2xl md:prose-h2:text-3xl prose-h3:text-xl md:prose-h3:text-2xl prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 dark:prose-strong:text-white prose-code:text-[0.9em] prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:text-slate-800 dark:prose-code:text-slate-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl prose-pre:p-5 prose-pre:text-sm prose-pre:overflow-x-auto prose-img:rounded-xl prose-img:border prose-img:border-slate-200 dark:prose-img:border-slate-800 prose-img:shadow-lg prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-500/5 prose-blockquote:text-slate-700 dark:prose-blockquote:text-slate-300 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:pr-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkFrontmatter]}
            components={{
              img: ({ src, alt }) => (
                <img
                  src={src}
                  alt={alt || ''}
                  loading="lazy"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg"
                />
              ),
              code: ({ className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '')
                const isInline = !match && !className
                if (isInline) {
                  return (
                    <code className="text-[0.9em] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded-md font-mono">
                      {children}
                    </code>
                  )
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              },
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/blog?tag=${encodeURIComponent(tag)}`}
                >
                  <TagPill label={tag} color="slate" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              Share this article
            </h3>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 text-sm text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-2.5 truncate border border-slate-200 dark:border-slate-800">
              {canonicalUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                copied
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy link
                </>
              )}
            </button>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              Related Articles
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                you might also enjoy
              </span>
            </h3>
            <div className="grid gap-5 md:grid-cols-3">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  to={`/blog/${rp.slug}`}
                  className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/30 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col"
                >
                  <div className="mb-3">
                    <TagPill
                      label={rp.category || 'General'}
                      color={categoryColorMap[rp.category || ''] || 'slate'}
                      className="text-[10px] px-2 py-0.5"
                    />
                  </div>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-2 line-clamp-3 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {rp.title}
                  </h4>
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(rp.date)}
                    </span>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                      Read
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 mb-8" />
      </div>
      <Footer />
    </div>
  )
}
