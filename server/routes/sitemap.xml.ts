import { createClient } from "@prismicio/client";
import prismicConfig from "../../prismic.config.json";

// The sitemap: every page a search engine should know of, with the date each last changed where
// Prismic knows it. Made afresh when asked for, and kept at the edge for an hour like the pages.
export default defineEventHandler(async (event) => {
	const client = createClient(prismicConfig.repositoryName);
	const fixed = ["/", "/about", "/contact", "/writing"].map((path) => ({ path, lastmod: "" }));
	const found: { path: string; lastmod: string }[] = [];
	try {
		for (const article of await client.getAllByType("article")) {
			if (article.uid) found.push({ path: `/writing/${article.uid}`, lastmod: article.last_publication_date });
		}
	} catch {
		// No article type yet, or Prismic could not be reached.
	}
	try {
		for (const page of await client.getAllByType("page")) {
			// The homepage's Prismic page is the homepage, already listed; About and Contact are pages of their own.
			if (page.uid && !["homepage", "about", "contact", "writing", "slice-simulator"].includes(page.uid))
				found.push({ path: `/${page.uid}`, lastmod: page.last_publication_date });
		}
	} catch {
		// As above.
	}
	const entries = [...fixed, ...found]
		.map(({ path, lastmod }) => `\t<url><loc>${siteUrl(path)}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ""}</url>`)
		.join("\n");
	setHeader(event, "content-type", "application/xml; charset=utf-8");
	setHeader(event, "cache-control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=3600");
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
});
