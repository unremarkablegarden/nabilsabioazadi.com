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

// The owner, as schema.org describes a person, for search engines' panels about them.
export const person = {
	"@type": "Person",
	"@id": `${SITE.url}/#person`,
	name: SITE.name,
	url: SITE.url,
	image: portrait,
	description: SITE.description,
	jobTitle: ["Artist", "Poet", "Editor", "Anthropologist", "Human rights law researcher"],
	knowsAbout: ["Painting", "Poetry", "Movement", "Artist books", "Anthropology", "Human rights law"],
	// Born and raised there (the About page); Wikipedia has the owner based in Brisbane now, so it is
	// given as where they are from, not where they live.
	birthPlace: { "@type": "Place", name: "Tāmaki Makaurau, Aotearoa New Zealand" },
	affiliation: { "@type": "Organization", name: "Tîr Aho Studio", url: "https://www.tiraho.com.au" },
	// The owner's own accounts, as linked from the menu's Elsewhere (Signal is a way to write, not a
	// profile), and the Wikipedia article and Wikidata item that Google's panel about them is built on.
	sameAs: [
		"https://www.instagram.com/nabilsabioazadi/",
		"https://cyberspace.online/nsa/blog",
		"https://en.wikipedia.org/wiki/Nabil_Sabio_Azadi",
		"https://www.wikidata.org/wiki/Q16864024",
	],
};

// Structured data goes in a script tag, so nothing in it may close that tag.
export const jsonLd = (data: object) => ({
	type: "application/ld+json",
	innerHTML: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c"),
});
