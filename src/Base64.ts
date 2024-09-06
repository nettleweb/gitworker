const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const base64Lookup = new Uint8Array(new ArrayBuffer(256), 0, 256);
for (let i = 0; i < base64Chars.length; i++) {
	base64Lookup[base64Chars.charCodeAt(i)] = i;
}

function encode(data: ArrayBuffer): string {
	let result = "";
	let padding = "";

	const byteLen = data.byteLength;
	const buf = new Uint8Array(data, 0, byteLen);

	for (let i = 0; i < byteLen; i += 3) {
		const group = (buf[i] << 16) | (buf[i + 1] << 8) | buf[i + 2];
		result +=
			base64Chars[(group >> 18) & 63] +
			base64Chars[(group >> 12) & 63] +
			base64Chars[(group >> 6) & 63] +
			base64Chars[group & 63];
	}

	const remainder = byteLen % 3;
	if (remainder === 1) {
		padding = "==";
		result = result.slice(0, -2);
	} else if (remainder === 2) {
		padding = "=";
		result = result.slice(0, -1);
	}

	return result + padding;
}

function decode(base64: string): ArrayBuffer {
	const bufLen = base64.length * 0.75 - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
	const buffer = new ArrayBuffer(bufLen);
	const bytes = new Uint8Array(buffer, 0, bufLen);

	let index = 0;

	for (let i = 0; i < base64.length; i += 4) {
		const group =
			(base64Lookup[base64.charCodeAt(i)] << 18) |
			(base64Lookup[base64.charCodeAt(i + 1)] << 12) |
			(base64Lookup[base64.charCodeAt(i + 2)] << 6) |
			base64Lookup[base64.charCodeAt(i + 3)];

		bytes[index++] = (group >> 16) & 255;
		bytes[index++] = (group >> 8) & 255;
		bytes[index++] = group & 255;
	}

	return buffer;
}

const Base64 = { encode, decode };
Object.setPrototypeOf(Base64, null);
Object.freeze(Base64);
export default Base64;