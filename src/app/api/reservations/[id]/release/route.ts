import { NextRequest, NextResponse } from "next/server";

import { releaseReservation } from "@/lib/services/reservation.service";

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
      await releaseReservation(id);

    return NextResponse.json(reservation);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to release reservation",
      },
      {
        status: 500,
      }
    );
  }
}