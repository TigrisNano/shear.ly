import { describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import doraRoutes from "../src/routes/dora.routes";

const app = express();
app.use(express.json());
app.use("/dora", doraRoutes);

describe("DORA routes", () => {
  describe("POST /dora/deployments", () => {
    it("registers a successful deployment", async () => {
      const response = await request(app).post("/dora/deployments").send({
        status: "success",
        leadTimeSeconds: 120,
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: "Deployment event registered",
        status: "success",
      });
    });

    it("registers a failed deployment", async () => {
      const response = await request(app).post("/dora/deployments").send({
        status: "failed",
        leadTimeSeconds: 30,
      });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("failed");
    });

    it.each([
      [{ status: "unknown", leadTimeSeconds: 10 }],
      [{ status: "success", leadTimeSeconds: null }],
      [{ status: "success", leadTimeSeconds: -1 }],
    ])("rejects invalid deployment data", async (payload) => {
      const response = await request(app)
        .post("/dora/deployments")
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Invalid deployment data",
      });
    });
  });

  describe("Incidents", () => {
    it("starts and restores an incident", async () => {
      const startResponse = await request(app).post("/dora/incidents/start");

      expect(startResponse.status).toBe(201);
      expect(startResponse.body.message).toBe("Incident started");
      expect(startResponse.body.incidentId).toBeTruthy();

      const { incidentId } = startResponse.body;

      const restoreResponse = await request(app).post(
        `/dora/incidents/${incidentId}/restore`,
      );

      expect(restoreResponse.status).toBe(200);
      expect(restoreResponse.body.message).toBe("Incident restored");
      expect(restoreResponse.body.durationSeconds).toBeGreaterThanOrEqual(0);
    });

    it("returns 404 when restoring an unknown incident", async () => {
      const response = await request(app).post(
        "/dora/incidents/unknown-id/restore",
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "Incident not found",
      });
    });
  });
});
