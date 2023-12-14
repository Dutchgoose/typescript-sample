interface LookoutConfig {
  eventSinkEndpoint: string;
  ignoredDomains: string[];
  cacheFlushInterval: number;
  debug?: boolean;
}

type StringRecord = Record<string, string>;

type RequestBody = string | StringRecord | [StringRecord];

interface RequestHeader {
  "Content-Type": string;
  Authorization: string;
}

interface LookoutRequest {
  id: string;
  headers: StringRecord;
  body?: RequestBody;
  method: string;
  url: string;
  path: string;
  host: string;
  search: string;
  timestamp: Date;
}

interface LookoutResponse {
  requestId: string;
  headers: StringRecord;
  body?: RequestBody;
  status: number;
  statusText: string;
  respondedAt: Date;
}

interface LookoutEvent {
  request?: LookoutRequest;
  response?: LookoutResponse;
}

export type {
  LookoutEvent,
  LookoutConfig,
  LookoutRequest,
  LookoutResponse,
  RequestHeader,
};
