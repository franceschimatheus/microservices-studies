"use client";

import { useState, useEffect, useCallback } from "react";
import { AuditEvent, Metrics, PRODUCTS, EMPTY_METRICS } from "@/lib/types";
import { OrderFormValues } from "@/lib/schema";

export interface DashboardState {
  stocks: Record<string, number>;
  logs: AuditEvent[];
  metrics: Metrics;
  submitting: boolean;
  formError: string | null;
  formSuccess: string | null;
  placeOrder: (values: OrderFormValues) => Promise<void>;
  clearFeedback: () => void;
}

export function useDashboard(): DashboardState {
  const [stocks, setStocks] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchStocks = useCallback(async () => {
    try {
      const stockMap: Record<string, number> = {};
      await Promise.all(
        PRODUCTS.map(async (p) => {
          const res = await fetch(`/api/inventory?productId=${p.id}`);
          if (res.ok) {
            const data = await res.json();
            stockMap[p.id] = data.stock;
          }
        })
      );
      setStocks(stockMap);
    } catch {
      // Silently fail — stocks will remain stale until next poll
    }
  }, []);

  const fetchAuditData = useCallback(async () => {
    try {
      const [logsRes, metricsRes] = await Promise.all([
        fetch("/api/audit?type=logs"),
        fetch("/api/audit?type=metrics"),
      ]);

      if (logsRes.ok) {
        const data: AuditEvent[] = await logsRes.json();
        setLogs(data ?? []);
      }
      if (metricsRes.ok) {
        const data: Metrics = await metricsRes.json();
        setMetrics(data ?? EMPTY_METRICS);
      }
    } catch {
      // Silently fail — dashboard remains stale until next poll
    }
  }, []);

  useEffect(() => {
    fetchStocks();
    fetchAuditData();
    const interval = setInterval(() => {
      fetchStocks();
      fetchAuditData();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchStocks, fetchAuditData]);

  const placeOrder = useCallback(
    async (values: OrderFormValues) => {
      setFormError(null);
      setFormSuccess(null);
      setSubmitting(true);

      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: values.productId,
            quantity: values.quantity,
            user_email: values.userEmail,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to place order");
        }

        setFormSuccess(`Order placed! ID: ${data.id}`);
        // Refresh immediately after a successful order
        fetchStocks();
        fetchAuditData();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setFormError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [fetchStocks, fetchAuditData]
  );

  const clearFeedback = useCallback(() => {
    setFormError(null);
    setFormSuccess(null);
  }, []);

  return {
    stocks,
    logs,
    metrics,
    submitting,
    formError,
    formSuccess,
    placeOrder,
    clearFeedback,
  };
}
