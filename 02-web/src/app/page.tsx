"use client";

import { useState } from "react";
import Header from "@/components/Header";
import ProductList from "@/components/ProductList";
import OrderForm from "@/components/OrderForm";
import MetricsDashboard from "@/components/MetricsDashboard";
import AuditStream from "@/components/AuditStream";
import { useDashboard } from "@/hooks/useDashboard";

export default function Home() {
  const { stocks, logs, metrics, submitting, formError, formSuccess, placeOrder } =
    useDashboard();

  // selectedProductId is driven by the OrderForm but needed by ProductList for highlighting
  const [selectedProductId, setSelectedProductId] = useState("prod_laptop");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500 selection:text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left two-thirds: store simulator */}
          <div className="lg:col-span-2 space-y-8">
            <ProductList stocks={stocks} selectedProductId={selectedProductId} />
            <OrderForm
              onSubmit={placeOrder}
              onSelectedChange={setSelectedProductId}
              submitting={submitting}
              error={formError}
              success={formSuccess}
            />
          </div>

          {/* Right third: telemetry */}
          <div className="space-y-8">
            <MetricsDashboard metrics={metrics} />
            <AuditStream logs={logs} />
          </div>

        </div>
      </main>
    </div>
  );
}
