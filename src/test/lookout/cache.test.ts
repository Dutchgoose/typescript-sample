import { expect, test, describe, beforeEach } from "@jest/globals";
import EventCache from "../../lib/cache";
import { LookoutEvent, LookoutRequest, LookoutResponse } from "../../lib/types";

const eventCache = EventCache.getInstance();

beforeEach(() => {
  eventCache.flushAll();
});

describe("Event Caching tests", () => {
  test("cacheRequest will cache a request", () => {
    const requestId = "test-request-id";
    const requestUrl = "https://www.google.com";
    const requestData: LookoutRequest = {
      id: requestId,
      url: requestUrl,
      method: "GET",
      host: "www.google.com",
      path: "/",
      search: "",
      headers: {},
      body: {},
      timestamp: new Date(),
    };
    EventCache.cacheRequest(requestId, requestData);
    const actualResult: LookoutEvent = eventCache.get(
      requestId
    ) as LookoutEvent;
    expect(actualResult.request).toEqual(requestData);
  });

  test("cacheResponse will not cache a reponse without a request", () => {
    const requestId = "test-request-id";
    const responseData: LookoutResponse = {
      requestId: requestId,
      status: 200,
      statusText: "OK",
      respondedAt: new Date(),
      headers: {},
      body: {},
    };
    EventCache.cacheResponse(requestId, responseData);
    const actualResult: LookoutEvent = eventCache.get(
      requestId
    ) as LookoutEvent;
    expect(actualResult).toEqual(undefined);
  });

  test("cacheResponse will cache a response if there is a matching request", () => {
    const requestId = "test-request-id";
    const requestUrl = "https://www.google.com";
    const requestData: LookoutRequest = {
      id: requestId,
      url: requestUrl,
      method: "GET",
      host: "www.google.com",
      path: "/",
      search: "",
      headers: {},
      body: {},
      timestamp: new Date(),
    };
    const responseData: LookoutResponse = {
      requestId: requestId,
      status: 200,
      statusText: "OK",
      respondedAt: new Date(),
      headers: {},
      body: {},
    };
    eventCache.set(requestId, { request: requestData });
    EventCache.cacheResponse(requestId, responseData);
    const actualResult: LookoutEvent = eventCache.get(
      requestId
    ) as LookoutEvent;
    expect(actualResult.request).toEqual(requestData);
    expect(actualResult.response).toEqual(responseData);
  });

  test("flushEvents will return an empty array if there are no events", () => {
    const actualResult = EventCache.flushEvents();
    expect(actualResult).toEqual([]);
  });

  test("flushEvents will return an array of events", () => {
    const requestId = "test-request-id";
    const requestUrl = "https://www.google.com";
    const requestData: LookoutRequest = {
      id: requestId,
      url: requestUrl,
      method: "GET",
      host: "www.google.com",
      path: "/",
      search: "",
      headers: {},
      body: {},
      timestamp: new Date(),
    };
    const responseData: LookoutResponse = {
      requestId: requestId,
      status: 200,
      statusText: "OK",
      respondedAt: new Date(),
      headers: {},
      body: {},
    };
    eventCache.set(requestId, { request: requestData, response: responseData });
    const actualResult = EventCache.flushEvents();
    const expectedResult = [
      {
        request: requestData,
        response: responseData,
      },
    ];
    expect(actualResult[0].request).toEqual(expectedResult[0].request);
    expect(actualResult[0].response).toEqual(expectedResult[0].response);
  });

  test("getCompletedRequests will return an empty array if there are no completed requests", () => {
    const requestId = "test-request-id";
    const requestUrl = "https://www.google.com";
    const requestData: LookoutRequest = {
      id: requestId,
      url: requestUrl,
      method: "GET",
      host: "www.google.com",
      path: "/",
      search: "",
      headers: {},
      body: {},
      timestamp: new Date(),
    };
    eventCache.set(requestId, { request: requestData });
    const actualResult = EventCache.getCompletedRequests(
      Object.values(eventCache.mget(eventCache.keys()))
    );
    expect(actualResult).toEqual([]);
  });
});
