// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			lang: 'id' | 'en';
			user: {
				userId: string;
				userName: string;
				userEmail: string;
				role: 'user' | 'admin';
				timezone: string;
				maxConcurrentBooks: number;
				onboarded: boolean;
			} | null;
		}
		interface PageData {
			lang?: 'id' | 'en';
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
