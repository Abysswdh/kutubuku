export type Lang = 'id' | 'en';

export const LANG_COOKIE = 'kutubuku_lang';

export function normalizeLang(raw?: string | null): Lang {
	return raw === 'en' ? 'en' : 'id';
}

export function t(lang: Lang | undefined, idText: string, enText: string): string {
	return lang === 'en' ? enText : idText;
}
