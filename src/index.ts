import Base64 from "./Base64";
import fav from "./fav";
import UTF8 from "./UTF8";

const cache = await caches.open("NettleWeb\u2122");
const favicon = Base64.decode(fav);
const robotstxt = UTF8.encode("User-agent: *\nDisallow: /\n");

const MSG_301 = UTF8.encode("301 Moved Permanently");
const MSG_400 = UTF8.encode("400 Bad Request");
const MSG_500 = UTF8.encode("500 Internal Server Error");

async function handleFetch(req: Request): Promise<Response> {
	const url = new URL(req.url);

	if (url.protocol !== "https:")
		return new Response(MSG_400, { status: 400, headers: { "Content-Type": "text/plain" }, encodeBody: "manual" });
	if (url.host !== "git.nettleweb.com")
		return new Response(MSG_301, { status: 301, headers: { "Content-Type": "text/plain", "Location": "https://nettleweb.com/" }, encodeBody: "manual" });

	const path = url.pathname;
	switch (path) {
		case "/robots.txt":
			return new Response(robotstxt, { status: 200, headers: { "Content-Type": "text/plain" }, encodeBody: "manual" });
		case "/favicon.ico":
			return new Response(favicon, { status: 200, headers: { "Content-Type": "image/x-icon" }, encodeBody: "manual" });
		default:
			url.hash = "";
			url.host = "github.com";
			url.pathname = "/nettleweb" + path;
			break;
	}

	{
		const res = await cache.match(req);
		if (res != null)
			return res;
	}

	const res = await self.fetch(url, {
		body: req.body,
		method: req.method,
		headers: req.headers,
		redirect: "follow"
	});

	if (!res.ok) {
		const code = res.status;
		const text = res.statusText;

		if (code < 200 || (code >= 300 && code < 400))
			return new Response(MSG_500, { status: 500, headers: { "Content-Type": "text/plain" }, encodeBody: "manual" });

		return new Response(UTF8.encode(text.length > 0 ? code.toString(10) + " " + text : code.toString(10)), {
			status: code,
			headers: { "Content-Type": "text/plain" },
			encodeBody: "manual"
		});
	}

	if (req.method === "GET") {
		try {
			await cache.put(req, res.clone());
		} catch (err) {
			console.error("Failed to add response to cache: ", err);
		}
	}

	return res;
}

export default {
	async fetch(req: Request): Promise<Response> {
		let res: Response;

		try {
			res = await handleFetch(req);
		} catch (err) {
			console.error("Error while handling fetch request: ", err);
			res = new Response(MSG_500, { status: 500, headers: { "Content-Type": "text/plain" }, encodeBody: "manual" });
		}

		const headers = new Headers(res.headers);
		headers.delete("vary");
		headers.delete("set-cookie");
		headers.delete("x-frame-options");
		headers.delete("x-xss-protection");
		headers.delete("Content-Encoding");

		headers.set("Referrer-Policy", "no-referrer");
		headers.set("Permissions-Policy", "camera=(), gyroscope=(), microphone=(), geolocation=(), local-fonts=(), accelerometer=(), browsing-topics=(), display-capture=(), screen-wake-lock=()");
		headers.set("X-Content-Type-Options", "nosniff");
		headers.set("Content-Security-Policy", "img-src 'self'; base-uri 'self'; font-src 'self'; child-src 'self'; frame-src 'self'; media-src 'self'; style-src 'self'; object-src 'self'; script-src 'self'; worker-src 'self'; connect-src 'self'; default-src 'self'; manifest-src 'self'; style-src-attr 'self'; style-src-elem 'self'; script-src-attr 'self'; script-src-elem 'self'; fenced-frame-src 'self'; sandbox allow-scripts allow-same-origin; upgrade-insecure-requests; ");
		headers.set("strict-transport-security", "max-age=31536000; includeSubDomains; preload");
		headers.set("Cross-Origin-Opener-Policy", "same-origin");
		headers.set("Cross-Origin-Embedder-Policy", "require-corp");
		headers.set("Cross-Origin-Resource-Policy", "same-origin");

		return new Response(res.body, {
			status: res.status,
			headers: headers,
			encodeBody: "manual"
		});
	}
};
