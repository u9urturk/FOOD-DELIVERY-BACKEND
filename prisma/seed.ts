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

  // Seed BaseUnits
  const kgUnit = await prisma.baseUnit.upsert({
    where: { name: 'Kilogram' },
    update: {},
    create: {
      name: 'Kilogram',
      shortName: 'kg',
      symbol: 'kg',
      desc: 'Weight measurement unit',
      conversionFactor: 1,
      baseUnit: 'kg',
      isActive: true,
    },
  });

  const literUnit = await prisma.baseUnit.upsert({
    where: { name: 'Liter' },
    update: {},
    create: {
      name: 'Liter',
      shortName: 'L',
      symbol: 'L',
      desc: 'Volume measurement unit',
      conversionFactor: 1,
      baseUnit: 'L',
      isActive: true,
    },
  });

  const pieceUnit = await prisma.baseUnit.upsert({
    where: { name: 'Piece' },
    update: {},
    create: {
      name: 'Piece',
      shortName: 'pcs',
      symbol: 'pcs',
      desc: 'Count-based measurement unit',
      conversionFactor: 1,
      baseUnit: 'pcs',
      isActive: true,
    },
  });

  const gramUnit = await prisma.baseUnit.upsert({
    where: { name: 'Gram' },
    update: {},
    create: {
      name: 'Gram',
      shortName: 'g',
      symbol: 'g',
      desc: 'Weight measurement unit',
      conversionFactor: 0.001,
      baseUnit: 'kg',
      isActive: true,
    },
  });

  const mlUnit = await prisma.baseUnit.upsert({
    where: { name: 'Milliliter' },
    update: {},
    create: {
      name: 'Milliliter',
      shortName: 'ml',
      symbol: 'ml',
      desc: 'Volume measurement unit',
      conversionFactor: 0.001,
      baseUnit: 'L',
      isActive: true,
    },
  });

  console.log('✓ Base units seeded');

  // Seed StockTypes
  const freshStockType = await prisma.stockType.upsert({
    where: { name: 'Fresh Products' },
    update: {},
    create: {
      name: 'Fresh Products',
      description: 'Fresh fruits, vegetables, and perishable items',
      color: 'from-green-500 to-green-600',
      icon: '🥬',
      examples: ['Fruits', 'Vegetables', 'Fresh Herbs'],
      isActive: true,
    },
  });

  const frozenStockType = await prisma.stockType.upsert({
    where: { name: 'Frozen Products' },
    update: {},
    create: {
      name: 'Frozen Products',
      description: 'Frozen foods requiring cold storage',
      color: 'from-blue-500 to-blue-600',
      icon: '❄️',
      examples: ['Frozen Vegetables', 'Ice Cream', 'Frozen Meat'],
      isActive: true,
    },
  });

  const dryStockType = await prisma.stockType.upsert({
    where: { name: 'Dry Goods' },
    update: {},
    create: {
      name: 'Dry Goods',
      description: 'Non-perishable dry products',
      color: 'from-amber-500 to-amber-600',
      icon: '📦',
      examples: ['Rice', 'Pasta', 'Flour', 'Spices'],
      isActive: true,
    },
  });

  const beverageStockType = await prisma.stockType.upsert({
    where: { name: 'Beverages' },
    update: {},
    create: {
      name: 'Beverages',
      description: 'Drinks and liquid refreshments',
      color: 'from-purple-500 to-purple-600',
      icon: '🥤',
      examples: ['Soft Drinks', 'Juices', 'Water'],
      isActive: true,
    },
  });

  const dairyStockType = await prisma.stockType.upsert({
    where: { name: 'Dairy Products' },
    update: {},
    create: {
      name: 'Dairy Products',
      description: 'Milk and dairy-based products',
      color: 'from-yellow-500 to-yellow-600',
      icon: '🥛',
      examples: ['Milk', 'Cheese', 'Yogurt', 'Butter'],
      isActive: true,
    },
  });

  console.log('✓ Stock types seeded');

  // Seed Categories
  const vegetablesCategory = await prisma.category.upsert({
    where: { name: 'Vegetables' },
    update: {},
    create: {
      name: 'Vegetables',
      desc: 'Fresh vegetables and greens',
    },
  });

  const fruitsCategory = await prisma.category.upsert({
    where: { name: 'Fruits' },
    update: {},
    create: {
      name: 'Fruits',
      desc: 'Fresh fruits',
    },
  });

  const meatCategory = await prisma.category.upsert({
    where: { name: 'Meat & Poultry' },
    update: {},
    create: {
      name: 'Meat & Poultry',
      desc: 'Meat, chicken, and poultry products',
    },
  });

  const seafoodCategory = await prisma.category.upsert({
    where: { name: 'Seafood' },
    update: {},
    create: {
      name: 'Seafood',
      desc: 'Fish and seafood products',
    },
  });

  const dairyCategory = await prisma.category.upsert({
    where: { name: 'Dairy' },
    update: {},
    create: {
      name: 'Dairy',
      desc: 'Milk, cheese, yogurt and dairy products',
    },
  });

  const grainsCategory = await prisma.category.upsert({
    where: { name: 'Grains & Pasta' },
    update: {},
    create: {
      name: 'Grains & Pasta',
      desc: 'Rice, pasta, flour and grain products',
    },
  });

  const beveragesCategory = await prisma.category.upsert({
    where: { name: 'Beverages' },
    update: {},
    create: {
      name: 'Beverages',
      desc: 'Drinks, juices and beverages',
    },
  });

  const spicesCategory = await prisma.category.upsert({
    where: { name: 'Spices & Seasonings' },
    update: {},
    create: {
      name: 'Spices & Seasonings',
      desc: 'Spices, herbs and seasonings',
    },
  });

  console.log('✓ Categories seeded');

  // Seed Suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { id: 'supplier-fresh-produce' },
    update: {},
    create: {
      id: 'supplier-fresh-produce',
      name: 'Fresh Produce Ltd.',
      category: 'Vegetables & Fruits',
      phone: '+90 212 555 0101',
      email: 'info@freshproduce.com',
      rating: 4.5,
      status: 'ACTIVE',
      address: 'Istanbul, Turkey',
      contactPerson: 'Ahmet Yılmaz',
      taxNumber: '1234567890',
      paymentTerms: 'Net 30',
      deliveryTime: 2,
      minimumOrder: 500,
      products: ['Tomatoes', 'Lettuce', 'Onions', 'Potatoes'],
      contractStartDate: new Date('2024-01-01'),
      contractEndDate: new Date('2025-12-31'),
      totalOrders: 150,
      monthlyDeliveries: 12,
      isActive: true,
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { id: 'supplier-meat-supply' },
    update: {},
    create: {
      id: 'supplier-meat-supply',
      name: 'Prime Meat Supply',
      category: 'Meat & Poultry',
      phone: '+90 212 555 0202',
      email: 'sales@meatsupply.com',
      rating: 4.8,
      status: 'ACTIVE',
      address: 'Ankara, Turkey',
      contactPerson: 'Mehmet Demir',
      taxNumber: '0987654321',
      paymentTerms: 'Net 15',
      deliveryTime: 1,
      minimumOrder: 1000,
      products: ['Beef', 'Chicken', 'Lamb'],
      contractStartDate: new Date('2024-01-01'),
      contractEndDate: new Date('2025-12-31'),
      totalOrders: 200,
      monthlyDeliveries: 16,
      isActive: true,
    },
  });

  const supplier3 = await prisma.supplier.upsert({
    where: { id: 'supplier-dairy-world' },
    update: {},
    create: {
      id: 'supplier-dairy-world',
      name: 'Dairy World Co.',
      category: 'Dairy Products',
      phone: '+90 212 555 0303',
      email: 'contact@dairyworld.com',
      rating: 4.6,
      status: 'ACTIVE',
      address: 'Izmir, Turkey',
      contactPerson: 'Ayşe Kaya',
      taxNumber: '1122334455',
      paymentTerms: 'Net 20',
      deliveryTime: 1,
      minimumOrder: 750,
      products: ['Milk', 'Cheese', 'Yogurt', 'Butter'],
      contractStartDate: new Date('2024-01-01'),
      contractEndDate: new Date('2025-12-31'),
      totalOrders: 180,
      monthlyDeliveries: 15,
      isActive: true,
    },
  });

  const supplier4 = await prisma.supplier.upsert({
    where: { id: 'supplier-grain-traders' },
    update: {},
    create: {
      id: 'supplier-grain-traders',
      name: 'Golden Grain Traders',
      category: 'Grains & Dry Goods',
      phone: '+90 212 555 0404',
      email: 'orders@graintraders.com',
      rating: 4.3,
      status: 'ACTIVE',
      address: 'Bursa, Turkey',
      contactPerson: 'Fatma Şahin',
      taxNumber: '5566778899',
      paymentTerms: 'Net 45',
      deliveryTime: 3,
      minimumOrder: 2000,
      products: ['Rice', 'Flour', 'Pasta', 'Bulgur'],
      contractStartDate: new Date('2024-01-01'),
      contractEndDate: new Date('2025-12-31'),
      totalOrders: 100,
      monthlyDeliveries: 8,
      isActive: true,
    },
  });

  console.log('✓ Suppliers seeded');

  // Seed Warehouses
  const mainWarehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-001' },
    update: {},
    create: {
      name: 'Main Warehouse',
      code: 'WH-001',
      location: 'Istanbul, Pendik',
      capacity: '5000 m³',
      capacityPercentage: 65,
      status: 'ACTIVE',
      manager: 'Mehmet Öztürk',
      staffCount: 15,
      area: 5000,
      temperature: 18,
      warehouseType: 'NORMAL',
      isActive: true,
    },
  });

  const coldWarehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-002' },
    update: {},
    create: {
      name: 'Cold Storage Warehouse',
      code: 'WH-002',
      location: 'Istanbul, Beylikdüzü',
      capacity: '2000 m³',
      capacityPercentage: 45,
      status: 'ACTIVE',
      manager: 'Zeynep Yıldız',
      staffCount: 8,
      area: 2000,
      temperature: 4,
      warehouseType: 'COLD',
      isActive: true,
    },
  });

  const frozenWarehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-003' },
    update: {},
    create: {
      name: 'Frozen Storage Warehouse',
      code: 'WH-003',
      location: 'Ankara, Keçiören',
      capacity: '1500 m³',
      capacityPercentage: 30,
      status: 'ACTIVE',
      manager: 'Can Aydın',
      staffCount: 6,
      area: 1500,
      temperature: -18,
      warehouseType: 'FROZEN',
      isActive: true,
    },
  });

  const dryWarehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-004' },
    update: {},
    create: {
      name: 'Dry Goods Warehouse',
      code: 'WH-004',
      location: 'Izmir, Bornova',
      capacity: '3000 m³',
      capacityPercentage: 55,
      status: 'ACTIVE',
      manager: 'Elif Çelik',
      staffCount: 10,
      area: 3000,
      temperature: 20,
      warehouseType: 'NORMAL',
      isActive: true,
    },
  });

  console.log('✓ Warehouses seeded');

  // Seed MovementTypes
  const purchaseMovement = await prisma.movementType.upsert({
    where: { name: 'Purchase' },
    update: {},
    create: {
      name: 'Purchase',
      desc: 'Stock received from supplier',
    },
  });

  const transferMovement = await prisma.movementType.upsert({
    where: { name: 'Transfer' },
    update: {},
    create: {
      name: 'Transfer',
      desc: 'Stock transferred between warehouses',
    },
  });

  const consumptionMovement = await prisma.movementType.upsert({
    where: { name: 'Consumption' },
    update: {},
    create: {
      name: 'Consumption',
      desc: 'Stock used for production or service',
    },
  });

  const adjustmentMovement = await prisma.movementType.upsert({
    where: { name: 'Adjustment' },
    update: {},
    create: {
      name: 'Adjustment',
      desc: 'Stock adjustment due to counting or correction',
    },
  });

  const returnMovement = await prisma.movementType.upsert({
    where: { name: 'Return' },
    update: {},
    create: {
      name: 'Return',
      desc: 'Stock returned to supplier',
    },
  });

  const wasteMovement = await prisma.movementType.upsert({
    where: { name: 'Waste' },
    update: {},
    create: {
      name: 'Waste',
      desc: 'Stock removed due to spoilage or damage',
    },
  });

  console.log('✓ Movement types seeded');

  console.log('\n✅ Database seeded successfully!');
  console.log('\nSeeded data summary:');
  console.log('- 3 Roles');
  console.log('- 4 Permissions');
  console.log('- 5 Base Units');
  console.log('- 5 Stock Types');
  console.log('- 8 Categories');
  console.log('- 4 Suppliers');
  console.log('- 4 Warehouses');
  console.log('- 6 Movement Types');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });