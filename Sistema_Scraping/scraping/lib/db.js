const { PrismaClient } = require("@prisma/client");

if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient();
}

let prisma = global.cachedPrisma;

if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient();
}

module.exports.db = prisma;
