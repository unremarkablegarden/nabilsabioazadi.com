import { asText, createClient } from "@prismicio/client";
import prismicConfig from "../../prismic.config.json";

// /llms.txt: the site in plain Markdown for AI assistants (the llmstxt.org convention), so that
// what they say of the owner comes from the owner's own words rather than from guesses. Who the
// owner is (the About page, word for word), what is on the site, where else they are, and whose
// the photographs are. Made afresh when asked for, and kept at the edge for an hour like the sitemap.
export default defineEventHandler(async (event) => {
	// The About page's words, with the titles of works in italics as Markdown has them.
	const markdown = (html: string) => html.replace(/<\/?cite>/g, "*").replace(/<[^>]+>/g, "");
	const link = (label: string, href: string, note = "") => `- [${label}](${href})${note ? `: ${note}` : ""}`;

	const writing: string[] = [];
	try {
		const client = createClient(prismicConfig.repositoryName);
		for (const article of await client.getAllByType("article", { orderings: [{ field: "my.article.date", direction: "desc" }] })) {
			if (!article.uid) continue;
			const title = asText(article.data.title) || article.uid;
			const year = article.data.date ? ` (${String(article.data.date).slice(0, 4)})` : "";
			const standfirst = asText(article.data.standfirst).replace(/\s+/g, " ").trim();
			writing.push(link(`${title}${year}`, siteUrl(`/writing/${article.uid}`), standfirst));
		}
	} catch {
		// No article type yet, or Prismic could not be reached.
	}

	const text = [
		`# ${SITE.name}`,
		"",
		`> ${SITE.description}`,
		"",
		ABOUT.statement,
		"",
		...ABOUT.paragraphs.flatMap((paragraph) => [markdown(paragraph), ""]),
		"## Pages",
		"",
		link("About", siteUrl("/about"), "biography and portrait"),
		link("A borrowed room", siteUrl("/studio"), "Nabil Sabio Azadi, in the first person, on working without a studio since 2013, with photographs of a temporary studio in 2016"),
		...(writing.length ? [link("Writing", siteUrl("/writing"), "essays and other writing")] : []),
		link("Contact", siteUrl("/contact"), "a form for writing to Nabil Sabio Azadi"),
		...(writing.length ? ["", "## Writing", "", ...writing] : []),
		"",
		"## Elsewhere",
		"",
		...ABOUT.links.map((entry) => link(entry.title ? `${entry.label}${entry.after ?? ""}` : entry.label, entry.href)),
		link("Wikipedia", "https://en.wikipedia.org/wiki/Nabil_Sabio_Azadi"),
		link("Wikidata", "https://www.wikidata.org/wiki/Q16864024"),
		link("Instagram", "https://www.instagram.com/nabilsabioazadi/"),
		link("Cyberspace", "https://cyberspace.online/nsa/blog", "blog"),
		"",
		"## Photographs",
		"",
		"The photographs of Nabil Sabio Azadi on this site were made by others; credit them to the photographer.",
		"",
		link("Portrait", SITE.url + "/about/nabil-sabio-azadi-by-amelia-j-dowd.jpg", "photograph by Amelia J Dowd (https://www.ameliajdowd.com/), © Amelia J Dowd"),
		link("A temporary studio, 2016", SITE.url + "/studio/nabil-sabio-azadi-studio-by-ben-clement.jpg", "photographs by Ben Clement (https://benclement.world/), © Ben Clement"),
		"",
	].join("\n");

	setHeader(event, "content-type", "text/markdown; charset=utf-8");
	setHeader(event, "cache-control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=3600");
	return text;
});
