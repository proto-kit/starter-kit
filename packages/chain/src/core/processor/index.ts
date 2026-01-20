import { Database } from "@proto-kit/processor";
import { PrismaClient } from "@prisma/client-processor";

export const databaseModule = Database.from(new PrismaClient());
