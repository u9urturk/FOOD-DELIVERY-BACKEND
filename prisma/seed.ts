import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator role',
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: {
      name: 'MANAGER',
      description: 'Manager role',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Default user role',
    },
  });

  const createUserPermission = await prisma.permission.upsert({
    where: { name: 'CREATE_USER' },
    update: {},
    create: {
      name: 'CREATE_USER',
      description: 'Permission to create users',
    },
  });

  const readUserPermission = await prisma.permission.upsert({
    where: { name: 'READ_USER' },
    update: {},
    create: {
      name: 'READ_USER',
      description: 'Permission to read users',
    },
  });

  const updateUserPermission = await prisma.permission.upsert({
    where: { name: 'UPDATE_USER' },
    update: {},
    create: {
      name: 'UPDATE_USER',
      description: 'Permission to update users',
    },
  });

  const deleteUserPermission = await prisma.permission.upsert({
    where: { name: 'DELETE_USER' },
    update: {},
    create: {
      name: 'DELETE_USER',
      description: 'Permission to delete users',
    },
  });

  await prisma.rolePermission.createMany({
    data: [
      { roleId: adminRole.id, permissionId: createUserPermission.id },
      { roleId: adminRole.id, permissionId: readUserPermission.id },
      { roleId: adminRole.id, permissionId: updateUserPermission.id },
      { roleId: adminRole.id, permissionId: deleteUserPermission.id },
      { roleId: managerRole.id, permissionId: readUserPermission.id },
      { roleId: managerRole.id, permissionId: updateUserPermission.id },
      { roleId: userRole.id, permissionId: readUserPermission.id },
    ],
    skipDuplicates: true,
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });