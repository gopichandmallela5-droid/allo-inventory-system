"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import axios from "axios";

export default function CheckoutPage() {
  const params = useParams();

  const router = useRouter();

  const reservationId = params.id as string;

  const [loading, setLoading] =
    useState(false);

  const [timeLeft, setTimeLeft] =
    useState(600);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          alert("Reservation expired");

          router.push("/");

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  const minutes = Math.floor(timeLeft / 60);

  const seconds = timeLeft % 60;

  async function confirmPurchase() {
    try {
      setLoading(true);

      await axios.post(
        `/api/reservations/${reservationId}/confirm`
      );

      alert("Purchase confirmed");

      router.push("/");
      router.refresh();
    } catch (error: any) {
      if (
        error.response?.status === 410
      ) {
        alert("Reservation expired");

        router.push("/");
        return;
      }

      alert("Failed to confirm purchase");
    } finally {
      setLoading(false);
    }
  }

  async function cancelReservation() {
    try {
      setLoading(true);

      await axios.post(
        `/api/reservations/${reservationId}/release`
      );

      alert("Reservation cancelled");

      router.push("/");
      router.refresh();
    } catch (error) {
      alert("Failed to cancel reservation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-10">
      <div className="border rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-6">
          Checkout
        </h1>

        <div className="mb-6">
          <p className="text-gray-600">
            Reservation expires in:
          </p>

          <p className="text-3xl font-bold mt-2">
            {minutes}:
            {seconds
              .toString()
              .padStart(2, "0")}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={confirmPurchase}
            disabled={loading}
            className="bg-green-600 text-white px-5 py-3 rounded-lg"
          >
            Confirm Purchase
          </button>

          <button
            onClick={cancelReservation}
            disabled={loading}
            className="bg-red-600 text-white px-5 py-3 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}