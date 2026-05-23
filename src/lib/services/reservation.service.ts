import { prisma } from "@/lib/prisma";
import { ReservationStatus } from "@prisma/client";

interface CreateReservationInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  userId: string;
}

export async function createReservation(
  input: CreateReservationInput
) {
  const { productId, warehouseId, quantity, userId } = input;

  return await prisma.$transaction(async (tx) => {
    // Lock inventory row
    await tx.$queryRaw`
      SELECT * FROM "Inventory"
      WHERE "productId" = ${productId}
      AND "warehouseId" = ${warehouseId}
      FOR UPDATE
    `;

    // Fetch inventory
    const inventory = await tx.inventory.findFirst({
      where: {
        productId,
        warehouseId,
      },
    });

    if (!inventory) {
      throw new Error("Inventory not found");
    }

    const availableUnits =
      inventory.totalUnits - inventory.reservedUnits;

    if (availableUnits < quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    // Increase reserved stock
    await tx.inventory.update({
      where: {
        id: inventory.id,
      },
      data: {
        reservedUnits: {
          increment: quantity,
        },
      },
    });

    // Create reservation
    const reservation = await tx.reservation.create({
      data: {
        productId,
        warehouseId,
        inventoryId: inventory.id,
        quantity,
        userId,
        status: ReservationStatus.PENDING,

        expiresAt: new Date(
          Date.now() + 10 * 60 * 1000
        ),
      },
    });

    return reservation;
  });
}