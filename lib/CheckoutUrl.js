import { post, generateGrantToken, renewToken } from "./utils.js";

export default class CheckoutUrl {
	// private member
	#mode = "0011";
	#currency = "BDT";
	#token;
	#refreshToken;
	#tokenIssueTime;
	//constructor
	constructor(userName, password, appKey, appSecret, baseURL) {
		this.username = userName;
		this.password = password;
		this.app_key = appKey;
		this.app_secret = appSecret;
		this.baseURL = baseURL;
	}

	// get token
	async #getToken() {
		if (!this.#token) {
			const { id_token, refresh_token, msg, status } = await generateGrantToken(
				this.app_key,
				this.app_secret,
				this.username,
				this.password,
				this.baseURL
			);
			if (status && msg) throw new Error(msg);
			this.#token = id_token;
			this.#refreshToken = refresh_token;
			this.#tokenIssueTime = Date.now();
			return this.#token;
		}

		const timeDifference = (Date.now() - this.#tokenIssueTime) / 1000;

		if (timeDifference < 3500) {
			return this.#token;
		} else {
			//token is expired, refresh it
			const { id_token, refresh_token, msg, status } = await renewToken(
				this.app_key,
				this.app_secret,
				this.#refreshToken,
				this.username,
				this.password,
				this.baseURL
			);
			if (status && msg) throw new Error(msg);
			this.#token = id_token;
			this.#refreshToken = refresh_token;
			this.#tokenIssueTime = Date.now();
			return this.#token;
		}
	}

	// create payment
	async createPayment(
		amount,
		callbackURL,
		payerReference,
		intent,
		orderID,
		merchantAssociationInfo
	) {
		const token = await this.#getToken();
		const payload = {
			mode: this.#mode,
			amount,
			callbackURL,
			payerReference,
			intent,
			currency: this.#currency,
			merchantInvoiceNumber: orderID,
			merchantAssociationInfo: merchantAssociationInfo ?? "",
		};

		const headers = {
			authorization: token,
			"x-app-key": this.app_key,
		};
		return await post(`${this.baseURL}/create`, payload, headers);
	}

	// execute payment
	async executePayment(paymentID) {
		const token = await this.#getToken();
		return await post(
			`${this.baseURL}/execute`,
			{ paymentID },
			{
				Authorization: token,
				"x-app-key": this.app_key,
			}
		);
	}

	// get payment status
	async getPaymentStatus(paymentID) {
		const token = await this.#getToken();
		return await post(
			`${this.baseURL}/payment/status`,
			{ paymentID },
			{
				Authorization: token,
				"x-app-key": this.app_key,
			}
		);
	}

	// search by transaction
	async searchTransaction(trxID) {
		const token = await this.#getToken();
		return await post(
			`${this.baseURL}/general/searchTransaction`,
			{ trxID },
			{ Authorization: token, "x-app-key": this.app_key }
		);
	}
}
