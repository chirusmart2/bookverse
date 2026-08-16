import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { buyerApi } from "../api/buyer";
import type { Cart } from "@shared/types";

export function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);

  const load = () => buyerApi.getCart().then((r) => setCart(r.cart));

  useEffect(() => {
    load();
  }, []);

  const updateQty = async (bookId: string, quantity: number) => {
    await buyerApi.updateCartItem(bookId, quantity);
    load();
  };

  const remove = async (bookId: string) => {
    await buyerApi.removeCartItem(bookId);
    load();
  };

  if (!cart) return <div className="loading-screen">Loading cart…</div>;

  return (
    <>
      <PageHeader title="Shopping cart" subtitle={`${cart.item_count} item${cart.item_count !== 1 ? "s" : ""}`} />
      <div className="page-body">
        {cart.items.length === 0 ? (
          <div className="empty-state card">
            <p>Your cart is empty.</p>
            <Link to="/" className="btn btn-primary">Browse catalog</Link>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Book</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr>
                </thead>
                <tbody>
                  {cart.items.map((line) => (
                    <tr key={line.id}>
                      <td>
                        <strong>{line.book.title}</strong>
                        <br /><span className="muted">{line.book.author}</span>
                      </td>
                      <td>₹{line.unit_price}</td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateQty(line.book_id, parseInt(e.target.value, 10))}
                          style={{ width: 72, padding: "0.4rem" }}
                        />
                      </td>
                      <td><strong>₹{line.line_total}</strong></td>
                      <td><button type="button" className="link-btn" onClick={() => remove(line.book_id)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="total-line">Subtotal: ₹{cart.subtotal}</div>

            {Object.keys(cart.subtotals_by_seller).length > 1 && (
              <p className="muted" style={{ marginBottom: "1rem" }}>
                Your cart contains books from multiple sellers. Checkout will create separate orders for each seller.
              </p>
            )}

            <Link to="/checkout" className="btn btn-primary btn-lg">Proceed to checkout (COD)</Link>
          </>
        )}
      </div>
    </>
  );
}
