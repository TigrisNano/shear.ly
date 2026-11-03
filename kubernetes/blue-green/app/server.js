const http = require("http");

const version = process.env.APP_VERSION || "unknown";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    application: "Shear.ly",
    environment: version,
    message: `Hello from ${version}!`
  }));
});

server.listen(3000, "0.0.0.0", () => {
  console.log(`Shear.ly ${version} is running on port 3000`);
});
