// The words of the contact letter, one set for each language the site speaks.
//
// The letter is a sentence with blanks in it, and languages put the blanks in different places,
// so the sentence is written whole with {name} and {email} standing where the blanks go. A
// translator moves them wherever the language wants them. `lang` is the language's code, which
// tells screen readers how to pronounce it; `dir` is "rtl" for languages written right to left.
//
// ONLY THE ENGLISH IS THE OWNER'S. The French and Japanese are Claude's drafts, put in to prove
// that the letter re-forms itself; they must be checked by a speaker before they are shown.
export interface LetterWords {
	lang: string;
	dir: "ltr" | "rtl";
	// What the language calls itself, for a list of languages.
	name: string;
	greeting: string;
	sentence: string;
	// Read out for each blank, since the blanks have no label of their own in the sentence.
	nameLabel: string;
	emailLabel: string;
	messageLabel: string;
	signoff: string;
	send: string;
	close: string;
	notConnected: string;
}

export const LETTER_WORDS: Record<string, LetterWords> = {
	en: {
		lang: "en-GB",
		dir: "ltr",
		name: "English",
		greeting: "Dear Nabil,",
		sentence: "My name is {name} and you can write back to me at {email}.",
		nameLabel: "Your name",
		emailLabel: "Your email address",
		messageLabel: "Your message",
		signoff: "With thanks,",
		send: "Send",
		close: "Close",
		notConnected: "This form is not connected yet, so your message was not sent anywhere.",
	},
	fr: {
		lang: "fr",
		dir: "ltr",
		name: "Français",
		greeting: "Cher Nabil,",
		sentence: "Je m’appelle {name} et vous pouvez me répondre à l’adresse {email}.",
		nameLabel: "Votre nom",
		emailLabel: "Votre adresse e-mail",
		messageLabel: "Votre message",
		signoff: "Avec mes remerciements,",
		send: "Envoyer",
		close: "Fermer",
		notConnected: "Ce formulaire n’est pas encore relié : votre message n’a été envoyé nulle part.",
	},
	ja: {
		lang: "ja",
		dir: "ltr",
		name: "日本語",
		greeting: "ナビル様",
		sentence: "{name} と申します。お返事は {email} までお願いいたします。",
		nameLabel: "お名前",
		emailLabel: "メールアドレス",
		messageLabel: "メッセージ",
		signoff: "よろしくお願いいたします。",
		send: "送信",
		close: "閉じる",
		notConnected: "このフォームはまだ接続されていないため、メッセージは送信されていません。",
	},
};

// The sentence cut at its blanks: pieces of text, and "name" or "email" where a blank goes.
export function letterSentence(words: LetterWords) {
	return words.sentence
		.split(/(\{name\}|\{email\})/)
		.filter(Boolean)
		.map((piece) => (piece === "{name}" ? { blank: "name" as const } : piece === "{email}" ? { blank: "email" as const } : { text: piece }));
}
