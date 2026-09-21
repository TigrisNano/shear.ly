import "dotenv/config";

import { Server, ServerCredentials, status } from "@grpc/grpc-js";

import {
  AnalyticsServiceService,
  AnalyticsServiceServer,
} from "./generated/analytics";

import {
  registerClickService,
  getLinkAnalyticsService,
  getTotalClicksService,
} from "./analytics.service";

const analyticsServer: AnalyticsServiceServer = {
  registerClick: async (call, callback) => {
    try {
      const result = await registerClickService(call.request.shortCode);

      callback(null, {
        success: result !== undefined,
      });
    } catch (error) {
      console.error("registerClick error:", error);

      callback({
        code: status.INTERNAL,
        message: "Failed to register click",
      });
    }
  },

  getLinkAnalytics: async (call, callback) => {
    try {
      const result = await getLinkAnalyticsService(call.request.shortCode);

      if (!result) {
        callback({
          code: status.NOT_FOUND,
          message: "Analytics not found",
        });

        return;
      }

      callback(null, {
        shortCode: result.short_code,
        clickCount: result.click_count,
      });
    } catch (error) {
      console.error("getLinkAnalytics error:", error);

      callback({
        code: status.INTERNAL,
        message: "Failed to get analytics",
      });
    }
  },

  getTotalClicks: async (_call, callback) => {
    try {
      const result = await getTotalClicksService();

      callback(null, {
        totalClicks: result.total_clicks,
      });
    } catch (error) {
      console.error("getTotalClicks error:", error);

      callback({
        code: status.INTERNAL,
        message: "Failed to get total clicks",
      });
    }
  },
};

const server = new Server();

console.log("Registered gRPC methods:", Object.keys(AnalyticsServiceService));

server.addService(AnalyticsServiceService, analyticsServer);

const port = Number(process.env.GRPC_PORT || 50051);

server.bindAsync(
  `0.0.0.0:${port}`,
  ServerCredentials.createInsecure(),
  (error, boundPort) => {
    if (error) {
      console.error("Failed to start gRPC server:", error);
      process.exit(1);
    }

    console.log(`Analytics gRPC server is running on port ${boundPort}`);
  },
);
