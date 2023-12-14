import NodeCache from "node-cache";
import {
  LookoutConfig,
  LookoutEvent,
  LookoutRequest,
  LookoutResponse,
} from "./types";

const parseJson = (json: string) => {
  if (json) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return json;
    }
  }
  return {};
};

const stringifyJson = (json: any): string => {
  if (json) {
    try {
      return JSON.stringify(json);
    } catch (e) {
      return json;
    }
  }
  return "";
};

const shouldCacheEvent = (
  url: string,
  lookoutUrl: string,
  config: LookoutConfig
) => {
  const eventUrl = new URL(url);
  const lookoutEventUrl = new URL(lookoutUrl);
  if (eventUrl.hostname === lookoutEventUrl.hostname) {
    return false;
  }
  if (config.ignoredDomains.length > 0) {
    return !config.ignoredDomains.some((domain) => {
      const ignoredDomain = new URL(domain);
      return eventUrl.hostname === ignoredDomain.hostname;
    });
  }
  return true;
};

const processRequest = async (request: Request, requestId: string) => {
  const url = new URL(request.url);
  const body = await request.clone().text();
  const requestData = {
    id: requestId,
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method,
    url: url.href,
    path: url.pathname,
    host: url.host,
    search: url.search,
    body: parseJson(body),
    timestamp: new Date(),
  } as LookoutRequest;
  return requestData;
};

const processResponse = async (
  request: Request,
  requestId: string,
  response: Response
) => {
  const body = await response.clone().text();
  const responseData: LookoutResponse = {
    requestId: requestId,
    headers: Object.fromEntries(response.headers.entries()),
    status: response.status,
    statusText: response.statusText,
    body: response.body && parseJson(body),
    respondedAt: new Date(),
  };
  return responseData;
};

export {
  parseJson,
  stringifyJson,
  shouldCacheEvent,
  processRequest,
  processResponse,
};
