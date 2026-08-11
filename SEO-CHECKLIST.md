# Mikenium SEO checklist

## Implemented in the application

- [x] One descriptive title and meta description for every public route
- [x] Self-referencing canonical URL on every indexable page
- [x] Open Graph and Twitter sharing metadata
- [x] `Organization`, `WebSite`, and `WebPage` JSON-LD; `BlogPosting` JSON-LD for articles
- [x] Dynamic `/sitemap.xml`, including every published or due scheduled article
- [x] `/robots.txt` with sitemap discovery and blocks for `/admin` and `/api`
- [x] Admin, maintenance, missing pages, and missing articles marked `noindex`
- [x] Unknown static routes return HTTP 404 instead of a soft-404 homepage
- [x] Sitemap and crawler access respect the CMS “Search Indexing” and maintenance switches
- [x] Semantic page headings, crawlable links, descriptive image alternatives, and mobile layouts
- [x] Route-specific title, description, canonical, robots, and status delivered in the initial server HTML

## Performance implemented

- [x] Public pages, admin dashboard, charting library, page JavaScript, and page CSS split into on-demand bundles
- [x] Large photographic PNG assets converted to compressed JPEG assets
- [x] Below-the-fold and CMS images use lazy loading and asynchronous decoding
- [x] Important images include intrinsic dimensions and the primary visual receives high fetch priority
- [x] Google Fonts consolidated into one request with early connection hints
- [x] Fingerprinted production assets receive one-year immutable caching; other static assets receive a 30-day cache
- [x] Brotli/Zstandard or gzip response compression enabled at the production proxy

## Keyword-to-page map

Keep one primary search intent per page. Write useful copy for people and use close variations naturally; do not repeat keyword lists in visible content.

| Page | Primary topic |
| --- | --- |
| `/` | software development company Sri Lanka |
| `/services` | software development services Sri Lanka |
| `/portfolio` | software development portfolio and case studies |
| `/products` | business software products |
| `/pricing` | software development pricing |
| `/about` | software product team Sri Lanka |
| `/blog` | software, AI, and product development insights |
| `/contact` | start a custom software project |
| `/blog/:slug` | the article’s focused topic, supplied through its SEO title and description |

## Required after deployment

- [ ] Confirm the production `CLIENT_URL` uses the single preferred HTTPS hostname.
- [ ] In the CMS SEO settings, keep “Search Indexing” enabled and set a full-size social sharing image.
- [ ] Add the HTTPS domain property in Google Search Console and verify ownership.
- [ ] Submit `https://YOUR-DOMAIN/sitemap.xml` in Search Console.
- [ ] Inspect the homepage, every main service page, and several articles with URL Inspection; request indexing after the production release.
- [ ] Validate one normal page and one article with Google Rich Results Test.
- [ ] Check Page Indexing, Core Web Vitals, HTTPS, and Enhancements reports monthly.
- [ ] Publish substantial, original pages/articles answering a specific customer question; add contextual internal links to relevant services and contact pages.
- [ ] Earn relevant mentions and links from genuine industry, customer, partner, and local-business sites.
- [ ] Review query and landing-page performance after 6–12 weeks, then improve pages with impressions but weak clicks or average positions.

## Content checklist for every new article

- [ ] A distinct SEO title and description in the blog editor
- [ ] One clear H1 (the article title) and logical H2/H3 sections
- [ ] A human-readable slug containing the topic, without dates or filler words
- [ ] An original cover image and descriptive alternative text for every content image
- [ ] Accurate author, publication date, excerpt, category, and tags
- [ ] At least two useful internal links and citations to authoritative sources where claims need support
- [ ] No duplicated, thin, placeholder, or AI-generated-at-scale content

Ranking is not guaranteed by technical SEO. Search engines decide whether to crawl, index, and rank a URL based on technical accessibility, content quality, relevance, reputation, competition, and time.
