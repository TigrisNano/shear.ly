import * as client from "@prometheus-io/client";
import { register } from "./metrics";

// Кількість розгортань за статусом
export const deploymentsTotal = new client.Counter({
  name: "dora_deployments_total",
  help: "Total number of deployments",
  labelNames: ["status"] as const,
  registers: [register],
});

// Час від коміту до розгортання
export const leadTime = new client.Histogram({
  name: "dora_lead_time_seconds",
  help: "Time from commit to deployment in seconds",
  buckets: [60, 300, 900, 1800, 3600, 7200, 14400, 86400],
  registers: [register],
});

// Кількість невдалих розгортань
export const failedDeploymentsTotal = new client.Counter({
  name: "dora_failed_deployments_total",
  help: "Total number of failed deployments",
  registers: [register],
});

// Кількість усіх завершених розгортань
export const completedDeploymentsTotal = new client.Counter({
  name: "dora_completed_deployments_total",
  help: "Total number of completed deployments",
  registers: [register],
});

// Кількість активних інцидентів
export const activeIncidents = new client.Gauge({
  name: "dora_active_incidents",
  help: "Number of currently active incidents",
  registers: [register],
});

// Час відновлення сервісу після інциденту
export const restoreTime = new client.Histogram({
  name: "dora_restore_time_seconds",
  help: "Time to restore service after an incident in seconds",
  buckets: [60, 300, 900, 1800, 3600, 7200, 14400, 86400],
  registers: [register],
});
