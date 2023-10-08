import axios from "axios";

// get request
async function get(url, additionalHeaders) {
	const controller = new AbortController();
	const timeout = setTimeout(() => {
		controller.abort();
	}, 30 * 1000);
	const { data } = await axios({
		method: "get",
		url: url,
		headers: {
			"content-type": "application/json",
			Accept: "application/json",
			...additionalHeaders,
		},
		signal: controller.signal,
	});

	clearTimeout(timeout);
	if (data.errorMessage) throw new Error(data.errorMessage);
	return data;
}

// post request
async function post(url, payload, additionalHeaders) {
	const controller = new AbortController();
	const timeout = setTimeout(() => {
		controller.abort();
	}, 30 * 1000);
	const { data } = await axios({
		method: "post",
		url: url,
		headers: {
			"content-type": "application/json",
			Accept: "application/json",
			...additionalHeaders,
		},
		data: {
			...payload,
		},
		signal: controller.signal,
	});
	clearTimeout(timeout);
	if (data.error) {
		throw new Error(data.error);
	}
	return data;
}

// generate grant token
async function generateGrantToken(
	app_key,
	app_secret,
	username,
	password,
	baseURL
) {
	const payload = {
		app_key,
		app_secret,
	};
	const headers = {
		username,
		password,
	};

	return await post(`${baseURL}/token/grant`, payload, headers);
}

// refresh token
async function renewToken(
	app_key,
	app_secret,
	refresh_token,
	username,
	password,
	baseURL
) {
	return post(
		`${baseURL}/token/refresh`,
		{
			app_key,
			app_secret,
			refresh_token,
		},
		{
			username,
			password,
		}
	);
}

export { get, post, generateGrantToken, renewToken };
