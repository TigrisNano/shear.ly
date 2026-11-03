import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const ENDPOINT = __ENV.ENDPOINT || "/links";

export const options = {
  scenarios: {
    load_test: {
      executor: "ramping-vus",
      startVUs: 10,
      stages: [{ duration: "5m", target: 100 }],
      gracefulRampDown: "30s",
    },
  },

  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function loadTest() {
  const response = http.get(`${BASE_URL}${ENDPOINT}`, {
    redirects: 0,
  });

  let checks;

  if (ENDPOINT === "/health") {
    checks = {
      "health status is 200": (r) => r.status === 200,
      "health status is ok": (r) => r.json("status") === "ok",
    };
  } else if (ENDPOINT === "/links") {
    checks = {
      "links status is 200": (r) => r.status === 200,
      "links response is an array": (r) => Array.isArray(r.json()),
    };
  } else if (ENDPOINT.startsWith("/links/r/")) {
    checks = {
      "redirect status is 302": (r) => r.status === 302,
      "redirect location is correct": (r) =>
        r.headers.Location === "https://example.com",
    };
  } else {
    checks = {
      "link status is 200": (r) => r.status === 200,
      "link ID is 15": (r) => Number(r.json("id")) === 15,
    };
  }

  check(response, checks);

  sleep(1);
}
