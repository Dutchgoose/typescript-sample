import NodeCache from "node-cache";
import { LookoutEvent, LookoutRequest, LookoutResponse } from "./types";
import { shouldCacheEvent } from "./utils";

class EventCache {
  private static _instance: NodeCache;

  private constructor() {}

  static getInstance() {
    if (this._instance) {
      return this._instance;
    }
    this._instance = new NodeCache({
      stdTTL: 0,
    });
    return this._instance;
  }

  static flushEvents = (): LookoutEvent[] => {
    const eventCacheKeys = this._instance.keys();
    const eventsArray = this.getCompletedRequests(
      Object.values(this._instance.mget(eventCacheKeys))
    ) as Array<LookoutEvent>;

    let data = [...eventsArray];
    return data;
  };

  static getCompletedRequests = (events: Array<LookoutEvent>) => {
    return events.filter((event) => {
      return event.request && event.response;
    });
  };

  static cacheResponse = (requestId: string, responseData: LookoutResponse) => {
    const event = this._instance.get(requestId) as LookoutEvent;
    if (event) {
      event.response = responseData;
      this._instance.set(requestId, event);
    } else {
      return; // throw here in the future
    }
  };

  static cacheRequest = (requestId: string, requestData: LookoutRequest) => {
    this._instance.set(requestId, { request: requestData });
  };
}

export default EventCache;
