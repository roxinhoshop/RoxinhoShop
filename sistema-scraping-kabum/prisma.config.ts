import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: "mysql://root:neFMagcBhfWUyBoRNMCBBTCZsTeyeBja@switchback.proxy.rlwy.net:46156/railway",
  },
});
