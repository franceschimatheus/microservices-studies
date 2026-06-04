"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PRODUCTS } from "@/lib/types";
import { orderSchema, OrderFormValues } from "@/lib/schema";

interface OrderFormProps {
  onSubmit: (values: OrderFormValues) => Promise<void>;
  onSelectedChange: (productId: string) => void;
  submitting: boolean;
  error: string | null;
  success: string | null;
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  );
}

const inputCls = (hasError: boolean) =>
  `w-full bg-zinc-950 border rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
    hasError
      ? "border-rose-500/60 focus:ring-rose-500/40"
      : "border-zinc-800 focus:ring-indigo-500"
  }`;

export default function OrderForm({
  onSubmit,
  onSelectedChange,
  submitting,
  error,
  success,
}: OrderFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isDirty },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { productId: "prod_laptop", quantity: 1, userEmail: "" },
    mode: "onChange",
  });

  const productId = watch("productId");

  useEffect(() => {
    onSelectedChange(productId);
  }, [productId, onSelectedChange]);

  const hasAnyError = Object.keys(errors).length > 0;
  const canSubmit = !submitting && !hasAnyError;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Accent gradient top bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-white">Simulate Order Purchase</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Triggers the full Saga: gRPC stock reservation → RabbitMQ events → Payment & Notification services.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Product selector */}
        <div>
          <label htmlFor="order-product" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Product Item
          </label>
          <select
            id="order-product"
            {...register("productId")}
            className={inputCls(!!errors.productId)}
          >
            {PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ${p.price.toFixed(2)}
              </option>
            ))}
          </select>
          <FieldError message={errors.productId?.message} />
        </div>

        {/* Quantity + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="order-quantity" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Quantity
            </label>
            <input
              id="order-quantity"
              type="number"
              min={1}
              {...register("quantity", { valueAsNumber: true })}
              placeholder="1"
              className={inputCls(!!errors.quantity)}
            />
            <FieldError message={errors.quantity?.message} />
          </div>

          <div>
            <label htmlFor="order-email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Customer Email
            </label>
            <input
              id="order-email"
              type="email"
              {...register("userEmail")}
              placeholder="customer@domain.com"
              className={inputCls(!!errors.userEmail)}
            />
            <FieldError message={errors.userEmail?.message} />
          </div>
        </div>

        {/* Submit button */}
        <button
          id="order-submit"
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2
            bg-indigo-600 text-white shadow-md shadow-indigo-600/10
            hover:bg-indigo-500 hover:shadow-indigo-600/20
            active:bg-indigo-700
            disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {submitting ? (
            <>
              <Spinner />
              <span>Processing Order…</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
                <path d="M16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              Place Secure Order (Saga Pattern)
            </>
          )}
        </button>
      </form>

      {/* Feedback banners — shown below the form */}
      <div className="mt-4 space-y-3">
        {success && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
            <svg className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm">
            <svg className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
