import { InclusionStatus } from "@proto-kit/api";
import { sleep } from "@proto-kit/common";
import { Provable } from "o1js";

export const url = `${process.env.PROTOKIT_GRAPHQL_PROTOCOL}://${process.env.PROTOKIT_GRAPHQL_HOST}:${process.env.PROTOKIT_GRAPHQL_PORT}${process.env.PROTOKIT_GRAPHQL_PATH}`;

export interface TransactionStateResponse {
  data: {
    transactionState: InclusionStatus;
  };
}

// TODO: move this to the SDK
export default async function waitForStatus(
  hash: string,
  status: InclusionStatus,
  interval: number = 1000,
  attempts: number = 30
): Promise<void> {
  let currentStatus = InclusionStatus.UNKNOWN;
  const startTime = Date.now();

  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `{ transactionState(hash: "${hash}") }`,
        }),
      });

      const data = (await response.json()) as TransactionStateResponse;
      currentStatus = data.data.transactionState;

      // TODO: why doesn't the enum mapping work / get capitalized on the gql response?
      if (currentStatus === status.toUpperCase()) {
        Provable.log(
          `Transaction ${hash} status is ${currentStatus} after ~${(Date.now() - startTime) / 1000}s`
        );
        return;
      }
      // eslint-disable-next-line no-empty
    } catch {}

    await sleep(interval);
  }

  throw new Error(
    `Transaction status is ${currentStatus}, instead of ${status} after ~${(Date.now() - startTime) / 1000}s`
  );
}
