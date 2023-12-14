import { BatchInterceptor } from "@mswjs/interceptors";
import { ClientRequestInterceptor } from "@mswjs/interceptors/ClientRequest";
import { XMLHttpRequestInterceptor } from "@mswjs/interceptors/XMLHttpRequest";
import { FetchInterceptor } from "@mswjs/interceptors/fetch";

import NodeCache from "node-cache";

import { LookoutConfig, LookoutRequest, RequestHeader } from "./types";
import { processRequest, processResponse, shouldCacheEvent } from "./utils";
import { errors } from "./constants";
import { sendEvent } from "./api";
import EventCache from "./cache";

const interceptor = new BatchInterceptor({
  name: "lookout-interceptor",
  interceptors: [
    new FetchInterceptor(),
    new XMLHttpRequestInterceptor(),
    new ClientRequestInterceptor(),
  ],
});

const defaultConfig: LookoutConfig = {
  eventSinkEndpoint: "/api/new_event",
  cacheFlushInterval: 2000,
  ignoredDomains: [
    "http://localhost:3000/api/new_event",
    "https://app.withlookout.com/api/new_event",
  ],
};

const getRequestHeader = (apiKey: string): RequestHeader => {
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${apiKey}`,
  };
};

const Lookout = () => {
  let apiKey: string;
  let eventSinkUrl: string;
  let lookoutConfig: LookoutConfig;
  let debug: boolean = true;

  const LOG = debug ? console.log.bind(console) : function () {};

  let eventCache: NodeCache;
  let cacheFlushInterval: NodeJS.Timeout;

  const init = async (
    {
      apiKey,
      config,
    }: {
      apiKey?: string;
      config?: Partial<LookoutConfig>;
    } = {
      apiKey: process.env.LOOKOUT_API_KEY as string,
      config: {} as Partial<LookoutConfig>,
    },
    baseUrl = process.env.LOOKOUT_BASE_URL || "https://app.withlookout.com"
  ) => {
    if (!apiKey) {
      throw new Error(errors.UNAUTHORIZED);
    }
    lookoutConfig = {
      ...defaultConfig,
      ...config,
      eventSinkEndpoint: config?.eventSinkEndpoint || "/api/new_event",
    };

    eventCache = EventCache.getInstance();
    // Change this to false later on
    debug = config?.debug ?? true;

    eventSinkUrl = `${baseUrl}${lookoutConfig.eventSinkEndpoint}`;

    LOG("[Initialization] Initializing lookout with config: ", config);
    interceptor.apply();
    interceptor.on("request", async ({ request, requestId }) => {
      LOG("[Request] Received requestId:", requestId);
      const requestData: LookoutRequest = await processRequest(
        request,
        requestId
      );
      if (requestData) {
        if (shouldCacheEvent(request.url, eventSinkUrl, lookoutConfig)) {
          sendEvent(
            eventSinkUrl,
            { request: requestData },
            getRequestHeader(apiKey!)
          );
          EventCache.cacheRequest(requestId, requestData);
          LOG("[Request] Received request: ", requestId, requestData);
        }
      }
    });

    interceptor.on("response", async ({ request, requestId, response }) => {
      const responseData = await processResponse(request, requestId, response);
      if (responseData) {
        if (shouldCacheEvent(request.url, eventSinkUrl, lookoutConfig)) {
          sendEvent(
            eventSinkUrl,
            { response: responseData },
            getRequestHeader(apiKey!)
          );
          EventCache.cacheResponse(requestId, responseData);
          LOG("[Response] Received response: ", requestId, responseData);
        }
      }
    });

    cacheFlushInterval = setInterval(
      flushCache,
      lookoutConfig.cacheFlushInterval
    );
    cacheFlushInterval.unref();
  };

  const flushCache = async () => {
    const data = EventCache.flushEvents();

    if (data.length === 0) {
      console.log("No events to send.");
      return;
    } else {
      console.log("events to send but skipping");
      return;
    }
  };

  const close = async () => {
    clearInterval(cacheFlushInterval);
    await flushCache();
    interceptor.dispose();
  };

  return { init, close };
};

export default Lookout();
