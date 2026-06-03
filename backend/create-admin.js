const bcrypt = require("bcryptjs");
const prisma = require("./src/config/prisma");

async function main() {
  const email = "tamirespessoa.jbimoveis@gmail.com";
  const password = "123456";

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "ADMIN",
      active: true
    },
    create: {
      name: "Tamires Pessoa",
      email,
      password: hashedPassword,
      role: "ADMIN",
      active: true
    }
  });

  console.log("Admin criado/atualizado:", user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());