import { errors } from "./constants";
import { LookoutEvent, RequestHeader } from "./types";
import { stringifyJson } from "./utils";

const sendEvent = async (
  eventSinkUrl: string,
  data: LookoutEvent,
  header: RequestHeader
) => {
  console.log(data);
  const response = await fetch(eventSinkUrl, {
    method: "POST",
    body: stringifyJson({ event: { ...data } }),
    headers: { ...header },
  });
  try {
    const responseData = await response.json();
    if (response.status === 401) {
      throw new Error(errors.UNAUTHORIZED);
    }
    if (response.ok) {
      return responseData;
    } else {
      throw new Error("Failed to transmit event.");
    }
  } catch {
    console.log("Failed to parse response data");
  }
};

const sendEvents = async (
  eventSinkUrl: string,
  data: LookoutEvent[],
  header: RequestHeader
) => {
  const response = await fetch(eventSinkUrl, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { ...header },
  });
  const responseData = await response.json();
  if (response.status === 401) {
    throw new Error(errors.UNAUTHORIZED);
  }
  if (response.ok) {
    return responseData;
  } else {
    throw new Error("Failed to transmit event.");
  }
};

export { sendEvent, sendEvents };
