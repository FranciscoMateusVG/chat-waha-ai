import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@chatwaha.com";

  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("Admin user already exists:", email);
    return;
  }

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);

  const user = await prisma.user.create({
    data: {
      email,
      name: "Administrador",
      passwordHash,
    },
  });

  console.log("Created admin user:", user.email);
  console.log("Password: admin123");
  console.log("\nPlease change the password after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
