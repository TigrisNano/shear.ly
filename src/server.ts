import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`Shear.ly server is running on port ${env.port}`);
});
