// Long articles for the writing section.
//
// In Prismic an article is written as one long rich-text field, so an essay of six thousand
// words can be pasted in whole. A few labels, applied in the editor, mark what plain rich text
// cannot say:
//   quote    on a whole paragraph: a quotation set apart from the text
//   caption  on a whole paragraph: the caption and credit of the image (or pair of images) above it
//   note     on a number in the text: a reference to the endnote of that number
//   haw, mi  on words in Hawaiian or Māori, so that screen readers pronounce them as such
// The endnotes are a second field, a numbered list.
//
// Whatever the source, the page is drawn from the plain shape below, so the same template serves
// Prismic articles and the sample used to prove the design.

export interface ArticleImage {
	src: string;
	alt: string;
	width: number;
	height: number;
}

export type ArticleBlock =
	// html is safe to insert: it is built here, with all text escaped.
	| { type: "text"; html: string }
	| { type: "heading"; level: 2 | 3; html: string; id: string }
	| { type: "quote"; html: string }
	| { type: "list"; ordered: boolean; items: string[] }
	| { type: "figure"; images: ArticleImage[]; caption: string };

export interface Article {
	uid: string;
	kind: string;
	title: string;
	authors: string[];
	// ISO date, or empty.
	date: string;
	standfirst: string;
	blocks: ArticleBlock[];
	notes: string[];
	keywords: string[];
	words: number;
	// What search engines and link previews are told, where the editor has set it in Prismic's
	// "SEO & Metadata" tab; otherwise the title, the standfirst and the first image are used.
	meta?: { title?: string; description?: string; image?: string };
}

interface Span {
	start: number;
	end: number;
	type: string;
	data?: { label?: string; url?: string; target?: string };
}
interface RichNode {
	type: string;
	text?: string;
	spans?: Span[];
	url?: string;
	alt?: string | null;
	dimensions?: { width: number; height: number };
}

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Only ordinary web, mail and in-page links are let through.
const safeUrl = (url = "") => (/^(https?:|mailto:|\/|#)/i.test(url) ? url : "#");

// Turns one run of rich text into HTML. Spans may overlap, so tags are closed and reopened as needed.
function inline(text = "", spans: Span[] = []) {
	const open = (span: Span) => {
		if (span.type === "strong") return "<strong>";
		if (span.type === "em") return "<em>";
		if (span.type === "hyperlink") {
			const external = span.data?.target === "_blank";
			return `<a href="${escape(safeUrl(span.data?.url))}"${external ? ' target="_blank" rel="noopener"' : ""}>`;
		}
		const label = span.data?.label;
		if (label === "note") {
			const number = escape(text.slice(span.start, span.end).trim());
			return `<sup><a class="note-ref" id="ref-${number}" href="#note-${number}" aria-label="Note ${number}">`;
		}
		if (label === "haw" || label === "mi") return `<span lang="${label}">`;
		return "<span>";
	};
	const close = (span: Span) => {
		if (span.type === "strong") return "</strong>";
		if (span.type === "em") return "</em>";
		if (span.type === "hyperlink") return "</a>";
		return span.data?.label === "note" ? "</a></sup>" : "</span>";
	};
	const ordered = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
	const stack: Span[] = [];
	let html = "";
	for (let i = 0; i <= text.length; i++) {
		// Close everything that ends here, and anything opened inside it; reopen what has not ended.
		const ending = stack.findIndex((span) => span.end === i);
		if (ending !== -1) {
			const reopen = stack.splice(ending).reverse();
			for (const span of reopen) html += close(span);
			for (const span of reopen.reverse()) {
				if (span.end > i) {
					html += open(span);
					stack.push(span);
				}
			}
		}
		for (const span of ordered) {
			if (span.start === i && span.end > i) {
				html += open(span);
				stack.push(span);
			}
		}
		if (i < text.length) html += text[i] === "\n" ? "<br>" : escape(text[i]!);
	}
	return html;
}

// Whether one label covers the whole of a paragraph.
const labelled = (node: RichNode, label: string) =>
	(node.spans ?? []).some((span) => span.data?.label === label && span.start === 0 && span.end >= (node.text ?? "").trimEnd().length);
const withoutLabel = (node: RichNode, label: string) => (node.spans ?? []).filter((span) => span.data?.label !== label);
const slug = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
const split = (text?: string | null) => (text ?? "").split(/[,\n]/).map((part) => part.trim()).filter(Boolean);

// From a Prismic "article" document to the plain shape.
// Not yet tried against real Prismic content: the article type has to be pushed to Prismic first.
export function articleFromPrismic(document: { uid?: string | null; data: Record<string, any> }): Article {
	const data = document.data;
	const blocks: ArticleBlock[] = [];
	let words = 0;
	for (const node of (data.body ?? []) as RichNode[]) {
		const last = blocks[blocks.length - 1];
		words += (node.text ?? "").split(/\s+/).filter(Boolean).length;
		if (node.type === "image" && node.url) {
			const image = { src: node.url, alt: node.alt ?? "", width: node.dimensions?.width ?? 3, height: node.dimensions?.height ?? 2 };
			// Two images one after the other, with no caption yet between them, stand side by side.
			if (last?.type === "figure" && !last.caption && last.images.length < 2) last.images.push(image);
			else blocks.push({ type: "figure", images: [image], caption: "" });
		} else if (node.type === "paragraph" && labelled(node, "caption") && last?.type === "figure") {
			last.caption = inline(node.text, withoutLabel(node, "caption"));
		} else if (node.type === "paragraph" && labelled(node, "quote")) {
			blocks.push({ type: "quote", html: inline(node.text, withoutLabel(node, "quote")) });
		} else if (node.type === "heading2" || node.type === "heading3") {
			blocks.push({ type: "heading", level: node.type === "heading2" ? 2 : 3, html: inline(node.text, node.spans), id: slug(node.text ?? "") });
		} else if (node.type === "list-item" || node.type === "o-list-item") {
			const orderedList = node.type === "o-list-item";
			if (last?.type === "list" && last.ordered === orderedList) last.items.push(inline(node.text, node.spans));
			else blocks.push({ type: "list", ordered: orderedList, items: [inline(node.text, node.spans)] });
		} else if (node.text?.trim()) {
			blocks.push({ type: "text", html: inline(node.text, node.spans) });
		}
	}
	const plain = (field: RichNode[] | undefined) => (field ?? []).map((node) => node.text ?? "").join(" ");
	return {
		uid: document.uid ?? "",
		kind: data.kind || "Essay",
		title: plain(data.title),
		authors: split(data.authors),
		date: data.date ?? "",
		standfirst: (data.standfirst ?? []).map((node: RichNode) => inline(node.text, node.spans)).join(" "),
		blocks,
		notes: ((data.notes ?? []) as RichNode[]).filter((node) => node.text?.trim()).map((node) => inline(node.text, node.spans)),
		keywords: split(data.keywords),
		words,
		meta: { title: data.meta_title || undefined, description: data.meta_description || undefined, image: data.meta_image?.url || undefined },
	};
}

// A stand-in essay with the proportions of a long art-journal essay: about six thousand words,
// twelve quotations, twelve endnotes and twenty-nine images, some in pairs. The words are filler.
export function sampleArticle(): Article {
	const sentences = [
		"This paragraph is sample text, here only to show how a long essay sits on the page.",
		'It carries words with marks that must not be lost, such as <span lang="haw">Hawaiʻi</span>, <span lang="haw">ʻāina</span>, <span lang="mi">Māori</span> and <span lang="mi">whānau</span>.',
		"A sentence of ordinary length follows, so that the eye can judge the measure and the leading.",
		"Some sentences are short.",
		"Others run on a little further, gathering a clause or two as they go, the way considered prose tends to when it is working something out.",
		"Titles of works are set in italics, as in <em>Out of Darkness</em>, and exhibitions in quotation marks.",
		"Where a claim rests on a source, a small number points to the notes at the end.",
	];
	const picture = (width: number, height: number, n: number): ArticleImage => ({
		src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#c9cfc4"/><path d="M0 ${height} L${width} 0 M0 0 L${width} ${height}" stroke="#aeb7aa" stroke-width="1"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Helvetica, Arial" font-size="${height / 12}" fill="#5a665c">Image ${n}</text></svg>`)}`,
		alt: `Sample image ${n}`,
		width,
		height,
	});
	const blocks: ArticleBlock[] = [];
	let image = 0;
	let note = 0;
	let words = 0;
	const caption = () =>
		'A view of the work described in the text, with the place and the date / Courtesy: the artist / Photograph: the photographer';
	const figure = (pair: boolean) => {
		const images = pair ? [picture(1200, 900, ++image), picture(1200, 900, ++image)] : [picture(1600, image % 3 ? 1000 : 1200, ++image)];
		blocks.push({ type: "figure", images, caption: caption() });
	};
	figure(true);
	for (let paragraph = 0; paragraph < 43; paragraph++) {
		let text = "";
		for (let i = 0; i < 9; i++) text += sentences[(paragraph * 3 + i) % sentences.length] + " ";
		// Twelve notes, spread through the text.
		if ((paragraph % 4 === 1 || paragraph === 42) && note < 12) {
			note++;
			text = text.trimEnd() + `<sup><a class="note-ref" id="ref-${note}" href="#note-${note}" aria-label="Note ${note}">${note}</a></sup>`;
		}
		words += text.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length;
		blocks.push({ type: "text", html: text.trim() });
		if (paragraph % 11 === 5) blocks.push({ type: "heading", level: 2, html: `A section heading, number ${Math.ceil(paragraph / 11)}`, id: `section-${Math.ceil(paragraph / 11)}` });
		// Twelve quotations.
		if (paragraph % 4 === 3 || paragraph === 21 || paragraph === 41) {
			blocks.push({ type: "quote", html: "A quotation set apart from the text. It may run to several sentences, and is given room above and below so that it reads as another voice entering the essay." });
			words += 30;
		}
		// Twenty-nine images in all, some in pairs.
		if (paragraph % 2 === 0 && image < 29) figure(image < 28 && paragraph % 6 === 0);
	}
	const notes = Array.from({ length: 12 }, (_, i) => `Author Name, <em>Title of the work cited in note ${i + 1}</em>, Publisher, Place, 2024, p. ${12 + i}.`);
	return {
		uid: "sample",
		kind: "Essay",
		title: "A sample essay of the length the writing section must hold",
		authors: ["First Author", "Second Author", "Third Author", "Fourth Author"],
		date: "2025-12-25",
		standfirst: "Filler text with the proportions of a long art-journal essay: about six thousand words, with quotations, notes and many captioned images.",
		blocks,
		notes,
		keywords: ["sample", "long-form", "layout"],
		words,
	};
}
