import dotenv from 'dotenv';
dotenv.config();
import PrismicDOM from 'prismic-dom';
const { PRISMIC_API_ENDPOINT } = process.env;
import { linkResolver } from '$lib/js/utils'

export async function handle({ request, resolve }) {
	request.locals.ctx = {
		endpoint: PRISMIC_API_ENDPOINT,
    linkResolver: linkResolver
  };

	request.locals.DOM = PrismicDOM;

	const response = await resolve(request);

	return {
		...response,
		headers: {
			...response.headers
		}
	};
}
