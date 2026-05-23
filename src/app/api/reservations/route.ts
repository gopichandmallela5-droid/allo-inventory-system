import { NextRequest, NextResponse } from "next/server";

import { createReservationSchema } from "@/lib/validations/reservation";
import { createReservation } from "@/lib/services/reservation.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validatedData =
      createReservationSchema.parse(body);

    const reservation = await createReservation(
      validatedData
    );

    return NextResponse.json(reservation, {
      status: 201,
    });
  } catch (error: any) {
    console.error(error);

    // Validation errors
    if (error?.name === "ZodError") {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        {
          status: 400,
        }
      );
    }

    // Inventory unavailable
    if (error?.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        {
          error: "Not enough stock available",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create reservation",
      },
      {
        status: 500,
      }
    );
  }
}