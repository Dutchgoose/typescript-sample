import { expect, test, describe } from "@jest/globals";

import Lookout from "../../..";
import { errors } from "../../lib/constants";

describe("Lookout Initialiization tests", () => {
  test("without any credentials will throw and unauthorized error", () => {
    expect(async () => await Lookout.init({})).rejects.toThrow(
      errors.UNAUTHORIZED
    );
  });
});
