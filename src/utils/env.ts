
const defaults: {[name: string]: string} = {
	'TECHNITIUM_EXPORTER_REQUIRE_AUTHENTICATION': 'false',
	'TECHNITIUM_EXPORTER_PORT': '8080'
}

function get_env(name: string): string {
	if(name in process.env) {
		return process.env[name] as string;
	}
	if(name in defaults) {
		return defaults[name];
	}
	throw Error("No value provided for environment variable " + name);
}

function get_env_uint(name: string): number {
	let repr = get_env(name);
	let res = Number(repr);
	if(Number.isNaN(res) || !Number.isFinite(res) || !Number.isInteger(res) || res < 0) {
		throw Error("Bad unsigned integer provided for environment variable " + name);
	}
	return res;
}


export const REQUIRE_AUTHENTICATION = (get_env('TECHNITIUM_EXPORTER_REQUIRE_AUTHENTICATION') === 'true');
export const PORT                   = get_env_uint('TECHNITIUM_EXPORTER_PORT');
export const TECHNITIUM_BASE_URL    = get_env('TECHNITIUM_API_BASE_URL');
export const TECHNITIUM_TOKEN       = get_env('TECHNITIUM_API_TOKEN');
