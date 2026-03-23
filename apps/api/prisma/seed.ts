import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { Role } from "../src/generated/prisma/enums";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const adminEmail = "admin@vietants.com";
  const testerEmail = "tester@vietants.com";
  const password = "Password123!";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: passwordHash,
      fullName: "Vietants Admin",
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      password: passwordHash,
      fullName: "Vietants Admin",
      role: Role.ADMIN,
    },
  });

  const tester = await prisma.user.upsert({
    where: { email: testerEmail },
    update: {
      password: passwordHash,
      fullName: "Vietants Tester",
      role: Role.TESTER,
    },
    create: {
      email: testerEmail,
      password: passwordHash,
      fullName: "Vietants Tester",
      role: Role.TESTER,
    },
  });

  const projectName = "Demo Vietants Web";
  const project = await prisma.project.findFirst({
    where: { ownerId: admin.id, name: projectName },
  });

  const projectFinal =
    project ??
    (await prisma.project.create({
      data: {
        name: projectName,
        description: "Project demo cho kiểm thử no-code",
        ownerId: admin.id,
      },
    }));

  const scriptName = "Đăng nhập demo";
  const scriptExisting = await prisma.testScript.findFirst({
    where: { projectId: projectFinal.id, createdById: tester.id, name: scriptName },
  });

  const scriptFinal =
    scriptExisting ??
    (await prisma.testScript.create({
      data: {
        name: scriptName,
        description: "Kịch bản kiểm thử chức năng đăng nhập demo",
        projectId: projectFinal.id,
        createdById: tester.id,
      },
    }));

  // Re-create steps for a consistent demo.
  await prisma.testStep.deleteMany({ where: { scriptId: scriptFinal.id } });
  await prisma.testStep.createMany({
    data: [
      {
        order: 0,
        keyword: "navigate",
        scriptId: scriptFinal.id,
        parameters: { url: "https://example.com/login" },
      } as any,
      {
        order: 1,
        keyword: "fill",
        scriptId: scriptFinal.id,
        parameters: { selector: "#email", dataKey: "email" },
      } as any,
      {
        order: 2,
        keyword: "fill",
        scriptId: scriptFinal.id,
        parameters: { selector: "#password", dataKey: "password" },
      } as any,
      {
        order: 3,
        keyword: "click",
        scriptId: scriptFinal.id,
        parameters: { selector: "#login-button" },
      } as any,
      {
        order: 4,
        keyword: "assertText",
        scriptId: scriptFinal.id,
        parameters: { selector: "h1", expected: "Dashboard" },
      } as any,
    ],
  });

  const dsName = "Data đăng nhập hợp lệ";
  const existingDs = await prisma.dataSet.findFirst({
    where: { projectId: projectFinal.id, name: dsName },
  });
  const rows = [
    { email: "user@example.com", password: "Secret123" },
    { email: "another@example.com", password: "Secret456" },
  ];

  if (existingDs) {
    await prisma.dataSet.update({
      where: { id: existingDs.id },
      data: {
        description: "Email/mật khẩu đúng",
        rows: rows as any,
      },
    });
  } else {
    await prisma.dataSet.create({
      data: {
        name: dsName,
        description: "Email/mật khẩu đúng",
        projectId: projectFinal.id,
        rows: rows as any,
      },
    });
  }

  console.log("Seed dữ liệu thành công.");
  console.log("Tài khoản admin:", adminEmail, "mật khẩu:", password);
  console.log("Tài khoản tester:", testerEmail, "mật khẩu:", password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

