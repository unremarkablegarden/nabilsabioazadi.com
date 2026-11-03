// What search engines and link previews are told about the site. The address is the one the
// site is served from: the bare domain sends visitors on to www.
export const SITE = {
	url: "https://www.nabilsabioazadi.com",
	name: "Nabil Sabio Azadi",
	// The owner's choice (23 October 2026), under 160 characters so that search results show it
	// whole. The name is left out: the result's title already gives it.
	description:
		"Persian-New Zealand artist, poet and editor from Tāmaki Makaurau, and a researcher in anthropology and human rights law. Painting, movement and artist books.",
	// The portrait on Klein Blue, 1200 by 630, the size link previews ask for.
	image: "/og.jpg",
};

// The About page's words: the owner's own (11 October 2026; human rights law added 23 October).
// Kept here so that /llms.txt, which AI assistants read, says what the page says. The paragraphs
// carry a little HTML, for the titles of works, which are set in italics.
export const ABOUT = {
	statement: "Nabil Sabio Azadi is an artist, anthropologist, editor, poet and human rights law researcher.",
	paragraphs: [
		"Nabil was born and raised in Tāmaki Makaurau, Aotearoa. He is a Persian-New Zealand artist and is Tangata Tiriti. He comes from Persian healing lineages in Yazd and Shiraz, Iran. His work moves between painting, poetry, artist books, essays and curatorial practices, with a focus on accessibility, movement and chanting.",
		"He was Acting Editor at the Queensland Art Gallery | Gallery of Modern Art (QAGOMA). His artist book <cite>For You The Traveller</cite> (2012) is held in Special Collections at UC Santa Cruz. From 2025–26, he was Editor of <cite>Asia Pacific Art Papers</cite>. He co-directs Tîr Aho Studio, a creative studio with a focus on accessibility, inclusion and equity.",
	],
	// `title` marks a label that is the title of a work, set in italics; `after` is plain words
	// that follow it in the same entry.
	links: [
		{ label: "Tîr Aho Studio", href: "https://www.tiraho.com.au" },
		{ label: "Asia Pacific Art Papers", href: "https://apap.qagoma.qld.gov.au/", title: true, after: ", Queensland Art Gallery | Gallery of Modern Art (QAGOMA)" },
	] as { label: string; href: string; title?: boolean; after?: string }[],
};

// A full address for a path on the site, with no query: every ?type=, ?about= and the like is
// the same page to a search engine.
export const siteUrl = (path = "/") => SITE.url + (path === "/" ? "/" : path.replace(/\/+$/, ""));

// The owner's portrait by Amelia J Dowd, the picture they would have search engines show of them:
// named, captioned and credited (and the same credit is written inside the file).
export const portrait = {
	"@type": "ImageObject",
	"@id": `${SITE.url}/#portrait`,
	contentUrl: `${SITE.url}/about/nabil-sabio-azadi-by-amelia-j-dowd.jpg`,
	url: `${SITE.url}/about/nabil-sabio-azadi-by-amelia-j-dowd.jpg`,
	width: 1120,
	height: 1120,
	name: "Nabil Sabio Azadi, portrait by Amelia J Dowd",
	caption:
		"Nabil Sabio Azadi in black and white, seated at a table in a dark jacket, hands pressed together upright in front of the face so that one eye looks out past them. Along the edges of the hands are tattooed the words Long heal and Sun bearing.",
	creator: { "@type": "Person", name: "Amelia J Dowd", url: "https://www.ameliajdowd.com/" },
	creditText: "Photograph by Amelia J Dowd",
	copyrightNotice: "© Amelia J Dowd",
	about: { "@id": `${SITE.url}/#person` },
};

// The gallery the owner was Acting Editor at, by its Wikidata item and Wikipedia article, so that
// search engines and AI assistants take it for the gallery they already know, under either name.
export const qagoma = {
	"@type": "Museum",
	"@id": `${SITE.url}/#qagoma`,
	name: "Queensland Art Gallery | Gallery of Modern Art",
	alternateName: "QAGOMA",
	url: "https://www.qagoma.qld.gov.au/",
	sameAs: ["https://www.wikidata.org/wiki/Q19917343", "https://en.wikipedia.org/wiki/QAGOMA"],
};

// The journal the owner edited: its Editor from 2025 to 2026, while their post at the gallery was
// Acting Editor (their word, 24 October 2026). Published by QAGOMA for its
// Australian Centre of Asia Pacific Art since 2021 (https://apap.qagoma.qld.gov.au/acknowledgements/).
export const asiaPacificArtPapers = {
	"@type": "Periodical",
	"@id": `${SITE.url}/#asia-pacific-art-papers`,
	name: "Asia Pacific Art Papers",
	alternateName: "Asia Pacific Art Papers: Contemporary Contexts, Practices, Ideas",
	url: "https://apap.qagoma.qld.gov.au/",
	startDate: "2021",
	publisher: { "@id": qagoma["@id"] },
	editor: { "@type": "Role", roleName: "Editor", startDate: "2025", endDate: "2026", editor: { "@id": `${SITE.url}/#person` } },
};

// The owner, as schema.org describes a person, for search engines' panels about them.
export const person = {
	"@type": "Person",
	"@id": `${SITE.url}/#person`,
	name: SITE.name,
	// The name in Persian, as the owner's Wikipedia article gives it, so that the owner is the same
	// person to anything reading or answering in Persian.
	alternateName: { "@value": "نبیل سابیو آزادی", "@language": "fa" },
	url: SITE.url,
	image: portrait,
	// Longer than the search result's, to say all three places the owner is to be linked with (their
	// word, 24 October 2026): Tāmaki Makaurau, where they were born and raised; Meanjin/Magandjin,
	// where they are based; and Iran, the Persian healing lineages in Yazd and Shiraz they come from.
	description:
		"Persian-New Zealand artist, poet, editor, anthropologist and human rights law researcher. Born and raised in Tāmaki Makaurau (Auckland), Aotearoa New Zealand; based in Meanjin/Magandjin (Brisbane), Australia; from Persian healing lineages in Yazd and Shiraz, Iran.",
	jobTitle: ["Artist", "Poet", "Editor", "Anthropologist", "Human rights law researcher"],
	// Refugees and asylum as Crikey's author page has it: over a decade of humanitarian legal research
	// with refugees and people seeking asylum.
	knowsAbout: ["Painting", "Poetry", "Movement", "Artist books", "Anthropology", "Human rights law", "Humanitarian legal research", "Refugees and people seeking asylum"],
	// Each place also by its Wikidata item, so that there is no doubt which place is meant.
	birthPlace: { "@type": "Place", name: "Tāmaki Makaurau (Auckland), Aotearoa New Zealand", sameAs: "https://www.wikidata.org/wiki/Q37100" },
	homeLocation: { "@type": "Place", name: "Meanjin/Magandjin (Brisbane), Queensland, Australia", sameAs: "https://www.wikidata.org/wiki/Q34932" },
	affiliation: { "@type": "Organization", "@id": "https://www.tiraho.com.au/#organization", name: "Tîr Aho Studio", url: "https://www.tiraho.com.au" },
	// What the biography says the owner has done, in the form search engines and AI assistants
	// read facts from: the studio they co-direct, and the gallery they were Acting Editor at, with
	// the dates its acknowledgements give (September 2025 to March 2026). The editorship of Asia
	// Pacific Art Papers is on the journal, below.
	memberOf: [
		{
			"@type": "OrganizationRole",
			roleName: "Co-director",
			memberOf: { "@id": "https://www.tiraho.com.au/#organization" },
		},
		{
			"@type": "OrganizationRole",
			roleName: "Acting Editor",
			startDate: "2025-09",
			endDate: "2026-03",
			memberOf: qagoma,
		},
	],
	// The journal they edited, the artist book, with its library record (OCLC, as Wikipedia cites
	// it), and writing published elsewhere: Crikey, and Anthropology Now by its DOI.
	workExample: [
		asiaPacificArtPapers,
		{
			"@type": "Book",
			name: "For You The Traveller",
			genre: "Artist book",
			datePublished: "2012",
			author: { "@id": `${SITE.url}/#person` },
			description: "An artist book by Nabil Sabio Azadi, held in Special Collections at UC Santa Cruz.",
			identifier: { "@type": "PropertyValue", propertyID: "OCLC", value: "877008818" },
			sameAs: "https://search.worldcat.org/title/877008818",
		},
		{
			"@type": "NewsArticle",
			headline: "Two photographs of Hatam Yekta tell the story of Australia",
			url: "https://www.crikey.com.au/2026/07/15/hatam-yekta-manus-island-offshore-detention-immigration-medevac/",
			datePublished: "2026-07-15",
			author: { "@id": `${SITE.url}/#person` },
			publisher: { "@type": "Organization", name: "Crikey", url: "https://www.crikey.com.au/" },
		},
		{
			"@type": "ScholarlyArticle",
			headline: "The Meditation on Rasanblaj Questionnaire #11",
			alternativeHeadline: "Rasanblaj: Catalyst. Keyword. Method. Practice. Project.",
			url: "https://doi.org/10.1080/19428200.2026.2716576",
			identifier: { "@type": "PropertyValue", propertyID: "DOI", value: "10.1080/19428200.2026.2716576" },
			datePublished: "2026-10-23",
			author: [{ "@id": `${SITE.url}/#person` }, { "@type": "Person", name: "Gina Athena Ulysse" }],
			isPartOf: { "@type": "Periodical", name: "Anthropology Now", issn: ["1942-8200", "1949-2901"] },
			publisher: { "@type": "Organization", name: "Taylor & Francis" },
		},
	],
	// The ORCID record, as an identifier as well as a page.
	identifier: { "@type": "PropertyValue", propertyID: "ORCID", value: "0009-0000-0173-6886" },
	// The owner's own accounts, as linked from the menu's Elsewhere (Signal is a way to write, not a
	// profile), the Wikipedia article and Wikidata item that Google's panel about them is built on,
	// their ORCID record, and their author's pages at Asia Pacific Art Papers and Crikey.
	sameAs: [
		"https://www.instagram.com/nabilsabioazadi/",
		"https://cyberspace.online/nsa/blog",
		"https://orcid.org/0009-0000-0173-6886",
		"https://apap.qagoma.qld.gov.au/author/nabilsabio-azadiqagoma-qld-gov-au/",
		"https://www.crikey.com.au/author/nabilsabioazadi/",
		"https://en.wikipedia.org/wiki/Nabil_Sabio_Azadi",
		"https://www.wikidata.org/wiki/Q16864024",
	],
};

// Structured data goes in a script tag, so nothing in it may close that tag.
export const jsonLd = (data: object) => ({
	type: "application/ld+json",
	innerHTML: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c"),
});
