import { useEffect } from "react";

const FALLBACK_SITE_URL = "https://gen1eco.com";

const ensureAbsoluteUrl = (value, siteUrl) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const normalizedBase = (siteUrl || FALLBACK_SITE_URL).replace(/\/$/, "");
  const normalizedPath = String(value).startsWith("/") ? value : `/${value}`;
  return `${normalizedBase}${normalizedPath}`;
};

export default function SeoMeta({
  title,
  description,
  keywords,
  path = "/",
  image,
  type = "website",
}) {
  const siteName = "GEN1ECO";
  const siteUrl = process.env.REACT_APP_SITE_URL || FALLBACK_SITE_URL;
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const canonical = ensureAbsoluteUrl(path, siteUrl);
  const imageUrl = ensureAbsoluteUrl(image, siteUrl);

  useEffect(() => {
    const upsertMeta = (selector, attributes) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        document.head.appendChild(element);
      }

      Object.entries(attributes).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          element.setAttribute(key, value);
        }
      });
    };

    const upsertLink = (selector, attributes) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement("link");
        document.head.appendChild(element);
      }

      Object.entries(attributes).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          element.setAttribute(key, value);
        }
      });
    };

    document.title = fullTitle;

    upsertMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });

    upsertMeta('meta[name="keywords"]', {
      name: "keywords",
      content: keywords,
    });

    upsertLink('link[rel="canonical"]', {
      rel: "canonical",
      href: canonical,
    });

    upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: siteName });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    if (imageUrl) {
      upsertMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl });
    }

    upsertMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: imageUrl ? "summary_large_image" : "summary",
    });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    if (imageUrl) {
      upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });
    }
  }, [canonical, description, fullTitle, imageUrl, keywords, siteName, type]);

  return null;
}
