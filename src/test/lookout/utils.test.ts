import { expect, test, describe } from "@jest/globals";

import { mock } from "jest-mock-extended";

import {
  processRequest,
  processResponse,
  shouldCacheEvent,
} from "../../lib/utils";
import { LookoutResponse } from "../../lib/types";

describe("Lookout Utils tests", () => {
  describe("processRequest & processResponse", () => {
    const mockClone = (): any => {
      return { text: () => mockText() };
    };
    const mockText = () => {
      return '{"name": "john doe"}';
    };

    const makeMockRequest = (
      url: string,
      method: string,
      headers: any,
      body: string
    ) => {
      return mock<Request>({
        url: url,
        method: method,
        headers: {
          entries: () => {
            return headers;
          },
        },
        text: async () => {
          return body;
        },
        clone: mockClone,
      });
    };

    const makeMockResponse = (
      status: number,
      statusText: string,
      headers: any,
      body: string
    ) => {
      return mock<Response>({
        status: status,
        statusText: statusText,
        headers: {
          entries: () => {
            return headers;
          },
        },
        text: async () => {
          return body;
        },
        clone: mockClone,
      });
    };

    const url = "https://test.com";
    const method = "GET";
    const headers = [["content-type", "application/json"]];
    const body = '{"name": "john doe"}';
    const testRequest = makeMockRequest(url, method, headers, body);

    test("processRequest converts an msw request into a LookoutRequest", async () => {
      const testRequestId = "test-request-id";
      const actualEvent = await processRequest(
        testRequest as Request,
        testRequestId
      );

      const expectedEvent = {
        id: testRequestId,
        body: {
          name: "john doe",
        },
        headers: {
          "content-type": "application/json",
        },
        host: "test.com",
        method: "GET",
        path: "/",
        search: "",
        timestamp: expect.any(Date),
        url: "https://test.com/",
      };
      expect(actualEvent.id).toBe(testRequestId);
      expect(actualEvent).toEqual(expectedEvent);
    });

    test("processResponse converts an msw request into a LookoutResponse", async () => {
      const testRequestId = "test-request-id";
      const testResponse = makeMockResponse(200, "OK", headers, body);
      const actualResponse: LookoutResponse = await processResponse(
        testRequest as Request,
        testRequestId,
        testResponse
      );

      const expectedResponse = {
        requestId: testRequestId,
        body: {
          name: "john doe",
        },
        headers: {
          "content-type": "application/json",
        },
        status: 200,
        statusText: "OK",
        respondedAt: expect.any(Date),
      };
      expect(actualResponse.requestId).toBe(testRequestId);
      expect(actualResponse).toEqual(expectedResponse);
    });
  });

  describe("shouldCacheEvent", () => {
    test("should cache event if event url is not in the ignored domains list", () => {
      const actualResult = shouldCacheEvent(
        "https://www.test.com",
        "https://app.lookout.com",
        {
          eventSinkEndpoint: "",
          ignoredDomains: [],
          cacheFlushInterval: 0,
        }
      );
      expect(actualResult).toBe(true);
    });
    test("should not cache event if event url is in the ignored domains list", () => {
      const actualResult = shouldCacheEvent(
        "https://www.test.com",
        "https://app.lookout.com",
        {
          eventSinkEndpoint: "",
          ignoredDomains: ["https://www.test.com"],
          cacheFlushInterval: 0,
        }
      );
      expect(actualResult).toBe(false);
    });

    test("should not cache event if event url is the same as the lookout url", () => {
      const actualResult = shouldCacheEvent(
        "https://app.lookout.com",
        "https://app.lookout.com",
        {
          eventSinkEndpoint: "",
          ignoredDomains: [],
          cacheFlushInterval: 0,
        }
      );
      expect(actualResult).toBe(false);
    });
  });
});
