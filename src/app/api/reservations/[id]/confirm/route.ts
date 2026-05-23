import { NextRequest, NextResponse } from "next/server";

import { confirmReservation } from "@/lib/services/reservation.service";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const reservation =
      await confirmReservation(id);

    return NextResponse.json(reservation);
  } catch (error: any) {
    console.error(error);

    if (
      error.message ===
      "RESERVATION_EXPIRED"
    ) {
      return NextResponse.json(
        {
          error: "Reservation expired",
        },
        {
          status: 410,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to confirm reservation",
      },
      {
        status: 500,
      }
    );
  }
}