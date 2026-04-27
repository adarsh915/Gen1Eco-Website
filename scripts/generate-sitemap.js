const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'sitemap.xml');
const SITE_URL = (process.env.REACT_APP_SITE_URL || 'https://gen1eco.com').replace(/\/$/, '');
const API_BASE_URL = process.env.REACT_APP_API_URL || '';
const TODAY = new Date().toISOString().slice(0, 10);

const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/products', priority: '0.9', changefreq: 'daily' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms-and-conditions', priority: '0.3', changefreq: 'yearly' },
  { path: '/shipping', priority: '0.3', changefreq: 'yearly' },
  { path: '/return-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/refund-policy', priority: '0.3', changefreq: 'yearly' },
];

const normalizeSlug = (value) => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
};

const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const absoluteUrl = (pathname) => {
  if (/^https?:\/\//i.test(pathname)) return pathname;
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${SITE_URL}${normalizedPath}`;
};

const getArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [value];
  return [];
};

const collectCategoryUrls = (categories) => {
  const urls = [];

  const visitSubCategories = (categorySlug, subCategories) => {
    subCategories.forEach((subCategory) => {
      const subCategorySlug = normalizeSlug(subCategory?.slug || subCategory?.sub_category_slug || subCategory?.name || subCategory?.sub_category_name);
      if (subCategorySlug) {
        urls.push({
          path: `/products/category/${categorySlug}/${subCategorySlug}`,
          priority: '0.7',
          changefreq: 'weekly',
        });
      }

      const subSubCategories = getArray(
        subCategory?.subSubCategories
        || subCategory?.sub_sub_categories
        || subCategory?.sub_subcategories
        || subCategory?.children
      );

      subSubCategories.forEach((subSubCategory) => {
        const subSubCategorySlug = normalizeSlug(
          subSubCategory?.slug
          || subSubCategory?.sub_sub_category_slug
          || subSubCategory?.name
          || subSubCategory?.sub_sub_category_name
        );

        if (subSubCategorySlug && categorySlug && subCategorySlug) {
          urls.push({
            path: `/products/category/${categorySlug}/${subCategorySlug}?subsubcategory=${encodeURIComponent(subSubCategorySlug)}`,
            priority: '0.6',
            changefreq: 'weekly',
          });
        }
      });
    });
  };

  categories.forEach((category) => {
    const categorySlug = normalizeSlug(category?.slug || category?.category_slug || category?.name || category?.category_name);
    if (!categorySlug) return;

    urls.push({
      path: `/products/category/${categorySlug}`,
      priority: '0.8',
      changefreq: 'weekly',
    });

    const subCategories = getArray(
      category?.subCategories
      || category?.sub_categories
      || category?.subcategories
      || category?.children
    );

    visitSubCategories(categorySlug, subCategories);
  });

  return urls;
};

const collectProductUrls = (products) => {
  return products
    .map((product) => {
      const productSlug = normalizeSlug(product?.product_slug || product?.slug || product?.name || product?.product_name);
      if (!productSlug) return null;

      const lastModified = product?.updated_at || product?.updatedAt || product?.modified_at || product?.modifiedAt || product?.created_at || product?.createdAt || TODAY;

      return {
        path: `/${productSlug}`,
        priority: '0.7',
        changefreq: 'weekly',
        lastmod: String(lastModified).slice(0, 10) || TODAY,
      };
    })
    .filter(Boolean);
};

const buildUrlEntry = ({ path: routePath, priority, changefreq, lastmod }) => {
  const lines = [
    '  <url>',
    `    <loc>${escapeXml(absoluteUrl(routePath))}</loc>`,
  ];

  if (lastmod) {
    lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  }

  if (changefreq) {
    lines.push(`    <changefreq>${escapeXml(changefreq)}</changefreq>`);
  }

  if (priority) {
    lines.push(`    <priority>${escapeXml(priority)}</priority>`);
  }

  lines.push('  </url>');
  return lines.join('\n');
};

const buildSitemapXml = (urlEntries) => {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlEntries.map(buildUrlEntry),
    '</urlset>',
    '',
  ].join('\n');
};

const dedupeByPath = (entries) => {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = entry.path;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fetchProducts = async () => {
  if (!API_BASE_URL) {
    console.warn('[sitemap] REACT_APP_API_URL is not set. Generating static routes only.');
    return [];
  }

  try {
    const response = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/users/products`, { timeout: 30000 });
    const data = response?.data;
    return Array.isArray(data?.products) ? data.products : Array.isArray(data?.data) ? data.data : [];
  } catch (error) {
    console.warn('[sitemap] Failed to fetch products. Generating static routes only.', error?.message || error);
    return [];
  }
};

const fetchCategories = async () => {
  if (!API_BASE_URL) return [];

  try {
    const response = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/category/nav`, { timeout: 30000 });
    const data = response?.data;
    return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('[sitemap] Failed to fetch categories. Generating static routes only.', error?.message || error);
    return [];
  }
};

const main = async () => {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });

  const [products, categories] = await Promise.all([
    fetchProducts(),
    fetchCategories(),
  ]);

  const sitemapEntries = dedupeByPath([
    ...staticRoutes.map((route) => ({ ...route, lastmod: TODAY })),
    ...collectCategoryUrls(categories).map((route) => ({ ...route, lastmod: TODAY })),
    ...collectProductUrls(products),
  ]);

  const xml = buildSitemapXml(sitemapEntries);
  await fs.writeFile(OUTPUT_FILE, xml, 'utf8');

  console.log(`[sitemap] Wrote ${sitemapEntries.length} URLs to ${path.relative(ROOT_DIR, OUTPUT_FILE)}`);
};

main().catch((error) => {
  console.error('[sitemap] Generation failed:', error);
  process.exitCode = 1;
});