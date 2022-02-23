import dotenv from 'dotenv';
dotenv.config();
import PrismicDOM from 'prismic-dom';
const { PRISMIC_API_ENDPOINT } = process.env;
import { linkResolver } from '$lib/js/utils'

export async function handle({ event, resolve }) {
	event.locals.ctx = {
		endpoint: PRISMIC_API_ENDPOINT,
    linkResolver: linkResolver
  };

	event.locals.DOM = PrismicDOM;

	const response = await resolve(event);

  return response

	// return {
	// 	...response,
	// 	headers: {
	// 		...response.headers
	// 	}
	// };
}
