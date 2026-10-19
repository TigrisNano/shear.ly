
import { createServer } from "node:http";
import app from "./app";
import { env } from "./config/env";

const server = createServer(app);

server.headersTimeout = 10_000;
server.requestTimeout = 15_000;
server.timeout = 20_000;
server.keepAliveTimeout = 5_000;

server.listen(env.port);
