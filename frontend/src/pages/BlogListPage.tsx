import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ArrowRight, Search, Flame, Leaf, Gauge, Layers, Mail, Star, Sparkles } from 'lucide-react'
import { useSEO } from '../hooks/useSEO'
import { getAllPosts, getAllCategories, getAllTags, searchPosts } from '../data/blogData'
import BlogCard from '../components/blog/BlogCard'
import BlogSearchBar from '../components/blog/BlogSearchBar'
import CategoryFilter from '../components/blog/CategoryFilter'
import TagPill from '../components/blog/TagPill'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

const SITE_ORIGIN = 'https://burnerdesignpro.com'

export default function BlogListPage() {
  const allPosts = getAllPosts()
  const categories = getAllCategories()
  const tags = getAllTags()

  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  const displayedPosts = useMemo(() => {
    let posts = allPosts

    if (query.trim()) {
      posts = searchPosts(query)
    }

    if (selectedCategory) {
      posts = posts.filter((post) => post.category === selectedCategory)
    }

    if (selectedTag) {
      posts = posts.filter((post) => post.tags.includes(selectedTag))
    }

    return posts.slice(0, 20)
  }, [query, selectedCategory, selectedTag, allPosts])

  const newestPost = allPosts[0]
  const topTags = tags.slice(0, 10)

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Thermal Engineering Blog | BurnerDesignPro',
    url: `${SITE_ORIGIN}/blog`,
    description:
      'Expert thermal engineering blog on combustion calculation, NOx emissions reduction, flame temperature, orifice plate metering, and insulation best practices — ISO 6976, EPA Method 19, ISO 5167 compliant.',
    blogPost: allPosts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: post.date,
      url: `${SITE_ORIGIN}/blog/${post.slug}`,
      keywords: post.keywords || post.tags.join(', '),
      author: {
        '@type': 'Person',
        name: post.author,
      },
    })),
  }

  useSEO({
    title:
      'Thermal Engineering Blog | Combustion, Emissions & Design Guides | BurnerDesignPro',
    description:
      'Expert thermal engineering blog on combustion calculation, NOx emissions reduction, flame temperature, orifice plate metering, and insulation best practices — ISO 6976, EPA Method 19, ISO 5167 compliant.',
    canonicalPath: '/blog',
    keywords:
      'thermal engineering blog, combustion calculation guide, NOx reduction strategies, adiabatic flame temperature, ISO 6976 tutorial',
    jsonLd: blogJsonLd,
  })

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEmail('')
  }

  const handleTagClick = (tagName: string) => {
    if (selectedTag === tagName) {
      setSelectedTag(null)
    } else {
      setSelectedTag(tagName)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(147,197,253,0.15),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/10">
              <BookOpen className="w-8 h-8 text-blue-300" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Thermal Engineering Blog
              </span>
            </h1>

            <p className="text-lg text-blue-100/80 mb-10 leading-relaxed">
              Expert guides on combustion calculation, emissions reduction, flame dynamics, and
              industrial insulation — standards-compliant methodology for real-world engineers.
            </p>

            <div className="max-w-2xl mx-auto">
              <BlogSearchBar value={query} onChange={setQuery} />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent" />
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="lg:w-3/4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Showing{' '}
                <span className="text-slate-900 dark:text-white font-semibold">
                  {displayedPosts.length}
                </span>{' '}
                posts
              </p>
              <CategoryFilter
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </div>

            {displayedPosts.length === 0 ? (
              <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-2xl mb-6">
                  <Search className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  No posts found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  We couldn&apos;t find any articles matching your search or filters. Try
                  adjusting your keywords or clearing the filters.
                </p>
                <button
                  onClick={() => {
                    setQuery('')
                    setSelectedCategory(null)
                    setSelectedTag(null)
                  }}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm"
                >
                  Clear all filters
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedPosts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </div>

          <aside className="lg:w-1/4">
            <div className="sticky top-24 space-y-6">
              {newestPost && (
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(147,197,253,0.25),transparent_60%)]" />
                  <div className="relative">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold mb-4">
                      <Sparkles size={12} />
                      Editor&apos;s Pick
                    </div>
                    <h3 className="text-lg font-bold mb-2 line-clamp-2">
                      {newestPost.title}
                    </h3>
                    <p className="text-sm text-blue-100/80 mb-4 line-clamp-3">
                      {newestPost.excerpt}
                    </p>
                    <Link
                      to={`/blog/${newestPost.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold hover:gap-2.5 transition-all"
                    >
                      Read article
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Star className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Popular Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topTags.map((tag) => (
                    <TagPill
                      key={tag.name}
                      name={tag.name}
                      count={tag.count}
                      selected={selectedTag === tag.name}
                      onClick={() => handleTagClick(tag.name)}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">
                  Looking for Tools?
                </h3>
                <div className="space-y-3">
                  <Link
                    to="/fuel-manager"
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-transparent hover:border-blue-200 dark:hover:border-blue-500/20 transition-all group"
                  >
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Flame className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Fuel Manager
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        ISO 6976 gas properties
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                    />
                  </Link>

                  <Link
                    to="/emission"
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20 transition-all group"
                  >
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Emission Analysis
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        EPA Method 19 & IPCC
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                    />
                  </Link>

                  <Link
                    to="/flame-temperature"
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-orange-500/10 border border-transparent hover:border-orange-200 dark:hover:border-orange-500/20 transition-all group"
                  >
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Gauge className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Flame Temperature
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        NASA GRC thermochemical
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                    />
                  </Link>

                  <Link
                    to="/insulation-calculator"
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-violet-50 dark:hover:bg-violet-500/10 border border-transparent hover:border-violet-200 dark:hover:border-violet-500/20 transition-all group"
                  >
                    <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Layers className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Insulation Calculator
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        ISO 12241 & ASTM C680
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-slate-400 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                    />
                  </Link>
                </div>
              </div>

              <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Newsletter</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Get the latest engineering guides and updates delivered to your inbox.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  )
}
