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
      throw new Error("INVENTORY_NOT_FOUND");
    }

    const availableUnits =
      inventory.totalUnits - inventory.reservedUnits;

    if (availableUnits < quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    // Increase reserved units
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

export async function confirmReservation(
  reservationId: string
) {
  return await prisma.$transaction(async (tx) => {
    const reservation =
      await tx.reservation.findUnique({
        where: {
          id: reservationId,
        },
      });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    if (
      reservation.status !==
      ReservationStatus.PENDING
    ) {
      throw new Error("INVALID_RESERVATION_STATUS");
    }

    // Expired reservation
    if (reservation.expiresAt < new Date()) {
      throw new Error("RESERVATION_EXPIRED");
    }

    // Reduce inventory permanently
    await tx.inventory.update({
      where: {
        id: reservation.inventoryId,
      },
      data: {
        totalUnits: {
          decrement: reservation.quantity,
        },

        reservedUnits: {
          decrement: reservation.quantity,
        },
      },
    });

    // Update reservation status
    const updatedReservation =
      await tx.reservation.update({
        where: {
          id: reservation.id,
        },
        data: {
          status: ReservationStatus.CONFIRMED,
        },
      });

    return updatedReservation;
  });
}
export async function releaseReservation(
  reservationId: string
) {
  return await prisma.$transaction(async (tx) => {
    const reservation =
      await tx.reservation.findUnique({
        where: {
          id: reservationId,
        },
      });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    if (
      reservation.status !==
      ReservationStatus.PENDING
    ) {
      throw new Error("INVALID_RESERVATION_STATUS");
    }

    // Release reserved units
    await tx.inventory.update({
      where: {
        id: reservation.inventoryId,
      },
      data: {
        reservedUnits: {
          decrement: reservation.quantity,
        },
      },
    });

    // Update reservation status
    const updatedReservation =
      await tx.reservation.update({
        where: {
          id: reservation.id,
        },
        data: {
          status: ReservationStatus.RELEASED,
        },
      });

    return updatedReservation;
  });
}
export async function cleanupExpiredReservations() {
  const expiredReservations =
    await prisma.reservation.findMany({
      where: {
        status: ReservationStatus.PENDING,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

  for (const reservation of expiredReservations) {
    await prisma.$transaction(async (tx) => {
      // Reduce reserved units
      await tx.inventory.update({
        where: {
          id: reservation.inventoryId,
        },
        data: {
          reservedUnits: {
            decrement: reservation.quantity,
          },
        },
      });

      // Mark reservation released
      await tx.reservation.update({
        where: {
          id: reservation.id,
        },
        data: {
          status: ReservationStatus.RELEASED,
        },
      });
    });
  }

  return expiredReservations.length;
}