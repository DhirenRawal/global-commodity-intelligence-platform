export * from "./generated/api";
export * from "./generated/api.schemas";
export { apiGetJson, getStaticApiResponse, shouldPreferStaticApi } from "./static-api";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
