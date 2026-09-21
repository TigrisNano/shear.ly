import { AnalyticsServiceClient } from "../generated/analytics";

import {
  credentials,
  Metadata,
  ServiceError,
  CallOptions,
} from "@grpc/grpc-js";

const client = new AnalyticsServiceClient(
  "localhost:50051",
  credentials.createInsecure(),
);

export function registerClick(shortCode: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = new Date(Date.now() + 1000);

    const options: CallOptions = {
      deadline,
    };

    const metadata = new Metadata();

    client.registerClick(
      { shortCode },
      metadata,
      options,
      (error: ServiceError | null) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      },
    );
  });
}
