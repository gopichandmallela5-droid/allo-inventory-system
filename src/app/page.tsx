"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface Warehouse {
  warehouseId: string;
  warehouseName: string;
  location: string;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  warehouses: Warehouse[];
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const router = useRouter();

  async function fetchProducts() {
    try {
      const response = await axios.get(
        "/api/products"
      );

      setProducts(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function reserveProduct(
    productId: string,
    warehouseId: string
  ) {
    try {
      const response = await axios.post(
        "/api/reservations",
        {
          productId,
          warehouseId,
          quantity: 1,
          userId: "demo-user",
        }
      );

      router.push(
        `/checkout/${response.data.id}`
      );
    } catch (error: any) {
      if (
        error.response?.status === 409
      ) {
        alert(
          "Not enough stock available"
        );

        return;
      }

      alert("Failed to reserve product");
    }
  }

  useEffect(() => {
    fetchProducts();

    const interval = setInterval(() => {
      fetchProducts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-white">
        Loading products...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-10">
          Inventory System
        </h1>

        <div className="space-y-8">
          {products.map((product) => {
            const imageSrc =
              product.name.includes("iPhone")
                ? "/products/iphone15.png"
                : "/products/macbook.jpeg";

            return (
              <div
                key={product.id}
                className="border border-gray-700 rounded-2xl p-8 bg-zinc-900"
              >
                <div className="flex gap-8 items-center">
                  <Image
                    src={imageSrc}
                    alt={product.name}
                    width={180}
                    height={180}
                    className="object-contain"
                  />

                  <div className="flex-1">
                    <h2 className="text-4xl font-bold">
                      {product.name}
                    </h2>

                    <p className="text-gray-400 mt-2 mb-6">
                      SKU: {product.sku}
                    </p>

                    <div className="space-y-4">
                      {product.warehouses.map(
                        (warehouse) => (
                          <div
                            key={
                              warehouse.warehouseId
                            }
                            className="border border-gray-700 rounded-xl p-5 flex items-center justify-between bg-black"
                          >
                            <div>
                              <p className="font-semibold text-lg">
                                {
                                  warehouse.warehouseName
                                }
                              </p>

                              <p className="text-gray-400">
                                {
                                  warehouse.location
                                }
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-lg">
                                Available:{" "}
                                <span className="font-bold text-green-400">
                                  {
                                    warehouse.availableUnits
                                  }
                                </span>
                              </p>

                              <p className="text-gray-400 text-sm">
                                Reserved:{" "}
                                {
                                  warehouse.reservedUnits
                                }
                              </p>

                              {warehouse.availableUnits <=
                                2 && (
                                <p className="text-sm text-red-400 mt-1">
                                  Low stock remaining
                                </p>
                              )}

                              <button
                                onClick={() =>
                                  reserveProduct(
                                    product.id,
                                    warehouse.warehouseId
                                  )
                                }
                                disabled={
                                  warehouse.availableUnits <=
                                  0
                                }
                                className={`mt-4 px-5 py-2 rounded-lg font-medium transition ${
                                  warehouse.availableUnits <=
                                  0
                                    ? "bg-gray-600 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-500"
                                }`}
                              >
                                {warehouse.availableUnits <=
                                0
                                  ? "Out of Stock"
                                  : "Reserve"}
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}