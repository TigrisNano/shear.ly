import { randomUUID } from "node:crypto";
import { Router } from "express";
import {
  deploymentsTotal,
  failedDeploymentsTotal,
  completedDeploymentsTotal,
  leadTime,
  activeIncidents,
  restoreTime,
} from "../monitoring/dora-metrics";

const router = Router();

const incidents = new Map<string, number>();

router.post("/deployments", (req, res) => {
  const { status, leadTimeSeconds } = req.body;

  if (
    !["success", "failed"].includes(status) ||
    typeof leadTimeSeconds !== "number" ||
    !Number.isFinite(leadTimeSeconds) ||
    leadTimeSeconds < 0
  ) {
    res.status(400).json({
      error: "Invalid deployment data",
    });
    return;
  }

  deploymentsTotal.inc({ status });
  completedDeploymentsTotal.inc();

  if (status === "failed") {
    failedDeploymentsTotal.inc();
  } else {
    leadTime.observe(leadTimeSeconds);
  }

  res.status(201).json({
    message: "Deployment event registered",
    status,
  });
});

router.post("/incidents/start", (_req, res) => {
  const incidentId = randomUUID();

  incidents.set(incidentId, Date.now());
  activeIncidents.inc();

  res.status(201).json({
    message: "Incident started",
    incidentId,
  });
});

router.post("/incidents/:incidentId/restore", (req, res) => {
  const { incidentId } = req.params;
  const startedAt = incidents.get(incidentId);

  if (startedAt === undefined) {
    res.status(404).json({
      error: "Incident not found",
    });
    return;
  }

  const durationSeconds = (Date.now() - startedAt) / 1000;

  incidents.delete(incidentId);
  activeIncidents.dec();
  restoreTime.observe(durationSeconds);

  res.status(200).json({
    message: "Incident restored",
    durationSeconds,
  });
});

export default router;
