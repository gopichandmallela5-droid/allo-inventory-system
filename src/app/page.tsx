"use client"
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
  const [products, setProducts] = useState<Product[]>(
    []
  );

  const [loading, setLoading] = useState(true);
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
  }, []);

  if (loading) {
    return (
      <div className="p-10">
        Loading products...
      </div>
    );
  }

  return (
    <main className="p-10 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">
        Inventory System
      </h1>

      <div className="space-y-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="border rounded-xl p-6 shadow-sm"
          >
            <h2 className="text-2xl font-semibold">
              {product.name}
            </h2>

            <p className="text-gray-500 mb-4">
              SKU: {product.sku}
            </p>

            <div className="space-y-3">
              {product.warehouses.map(
                (warehouse) => (
                  <div
                    key={warehouse.warehouseId}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {
                          warehouse.warehouseName
                        }
                      </p>

                      <p className="text-sm text-gray-500">
                        {
                          warehouse.location
                        }
                      </p>
                    </div>

                    <div className="text-right">
                      <p>
                        Available:{" "}
                        <span className="font-bold">
                          {
                            warehouse.availableUnits
                          }
                        </span>
                      </p>

                      <p className="text-sm text-gray-500">
                        Reserved:{" "}
                        {
                          warehouse.reservedUnits
                        }
                      </p>
                      <button
                      onClick={() =>
                        reserveProduct(
                          product.id,
                          warehouse.warehouseId
                        )
                      }
                      className="mt-3 bg-black text-white px-4 py-2 rounded-lg hover:opacity-90"
                      >
                        Reserve
                        </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}