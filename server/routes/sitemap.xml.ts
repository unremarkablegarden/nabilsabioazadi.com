import { createClient } from "@prismicio/client";
import prismicConfig from "../../prismic.config.json";

// The sitemap: every page a search engine should know of, with the date each last changed where
// Prismic knows it. Made afresh when asked for, and kept at the edge for an hour like the pages.
export default defineEventHandler(async (event) => {
	const client = createClient(prismicConfig.repositoryName);
	// The studio page is not in the menu, but is listed here so that its pictures are found.
	const fixed = ["/", "/about", "/contact", "/writing", "/studio"].map((path) => ({ path, lastmod: "" }));
	// The pictures on a page, so that image search knows them and whose they are.
	const images: Record<string, string[]> = {
		"/about": ["/about/nabil-sabio-azadi-by-amelia-j-dowd.jpg", "/about/nabil-sabio-azadi-by-amelia-j-dowd-tall.jpg"],
		"/studio": [
			"/studio/nabil-sabio-azadi-studio-by-ben-clement.jpg",
			"/studio/nabil-sabio-azadi-writing-by-ben-clement.jpg",
			"/studio/nabil-sabio-azadi-pelt-by-ben-clement.jpg",
		],
	};
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
			if (page.uid && !["homepage", "about", "contact", "writing", "studio", "slice-simulator"].includes(page.uid))
				found.push({ path: `/${page.uid}`, lastmod: page.last_publication_date });
		}
	} catch {
		// As above.
	}
	const entries = [...fixed, ...found]
		.map(({ path, lastmod }) => {
			const pictures = (images[path] ?? []).map((src) => `<image:image><image:loc>${SITE.url}${src}</image:loc></image:image>`).join("");
			return `\t<url><loc>${siteUrl(path)}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ""}${pictures}</url>`;
		})
		.join("\n");
	setHeader(event, "content-type", "application/xml; charset=utf-8");
	setHeader(event, "cache-control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=3600");
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries}\n</urlset>\n`;
});
