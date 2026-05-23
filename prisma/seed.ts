import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  // Create warehouses
  const mumbaiWarehouse = await prisma.warehouse.create({
    data: {
      name: "Mumbai Warehouse",
      location: "Mumbai",
    },
  });

  const delhiWarehouse = await prisma.warehouse.create({
    data: {
      name: "Delhi Warehouse",
      location: "Delhi",
    },
  });

  // Create products
  const iphone = await prisma.product.create({
    data: {
      name: "iPhone 15",
      sku: "IPHONE15",
    },
  });

  const macbook = await prisma.product.create({
    data: {
      name: "MacBook Air M3",
      sku: "MBAIR-M3",
    },
  });

  // Create inventory
  await prisma.inventory.createMany({
    data: [
      {
        productId: iphone.id,
        warehouseId: mumbaiWarehouse.id,
        totalUnits: 10,
        reservedUnits: 0,
      },
      {
        productId: iphone.id,
        warehouseId: delhiWarehouse.id,
        totalUnits: 5,
        reservedUnits: 0,
      },
      {
        productId: macbook.id,
        warehouseId: mumbaiWarehouse.id,
        totalUnits: 4,
        reservedUnits: 0,
      },
    ],
  });

  console.log("Seed data inserted successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });