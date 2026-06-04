import { Product, PRODUCTS } from "@/lib/types";

interface StockBadgeProps {
  stock: number;
}

function StockBadge({ stock }: StockBadgeProps) {
  const cls =
    stock > 5
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
      : stock > 0
      ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
      : "bg-rose-500/10 text-rose-400 border-rose-500/25";

  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded border font-semibold ${cls}`}>
      {stock} units
    </span>
  );
}

interface ProductCardProps {
  product: Product;
  stock: number;
  isSelected: boolean;
}

function ProductCard({ product, stock, isSelected }: ProductCardProps) {
  return (
    <div
      className={`relative rounded-xl border p-5 transition-all duration-300 ${
        isSelected
          ? "bg-indigo-600/10 border-indigo-500/50 shadow-md shadow-indigo-500/5"
          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-white text-base">{product.name}</span>
        <span className="font-mono text-indigo-400 text-sm font-semibold">
          ${product.price.toFixed(2)}
        </span>
      </div>
      <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
        {product.description}
      </p>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs text-zinc-500">Stock Available:</span>
        <StockBadge stock={stock} />
      </div>
    </div>
  );
}

interface ProductListProps {
  stocks: Record<string, number>;
  selectedProductId: string;
}

export default function ProductList({ stocks, selectedProductId }: ProductListProps) {
  return (
    <section>
      <h2 className="text-xl font-bold tracking-tight text-white mb-4">Available Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PRODUCTS.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            stock={stocks[product.id] ?? 0}
            isSelected={selectedProductId === product.id}
          />
        ))}
      </div>
    </section>
  );
}
