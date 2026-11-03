const http = require("node:http");
const fs = require("node:fs");

const CONFIG_PATH = "/app/config/flags.json";

function getFlags() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    return { newFeature: false };
  }
}

const server = http.createServer((req, res) => {
  const flags = getFlags();

  res.writeHead(200, { "Content-Type": "application/json" });

  if (req.url === "/feature-flags") {
    return res.end(JSON.stringify(flags));
  }

  if (req.url === "/feature") {
    return res.end(JSON.stringify({
      feature: "newFeature",
      enabled: flags.newFeature,
      message: flags.newFeature
        ? "New feature is enabled!"
        : "New feature is disabled."
    }));
  }

  res.end(JSON.stringify({ application: "Shear.ly Feature Flags" }));
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Feature Flags service running on port 3000");
});
