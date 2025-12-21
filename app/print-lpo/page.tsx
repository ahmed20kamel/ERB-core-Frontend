'use client';

import MainLayout from '@/components/layout/MainLayout';
import { formatPrice } from '@/lib/utils/format';

const order = {
  order_number: 'LPO-217-142',
  status: 'approved',
  order_date: new Date().toISOString(),
  supplier: { name: 'AL KHASHAB BUILDING MATERIALS CO LLC' },
  items: [
    {
      id: 1,
      quantity: 2,
      unit_price: 770,
      discount: 0,
      tax_rate: 5,
      total: 1540,
      product: {
        name: 'AWATEX RBE 3500 RUBBERIZED DAMP PROOF',
        code: 'AW-3500',
      },
    },
  ],
  subtotal: 1540,
  discount: 0,
  tax_amount: 77,
  total: 1617,
  notes: 'FOR WATERPROOFING',
  payment_terms: '90 DAYS CREDIT',
  delivery_terms: 'DELIVERY',
  created_by_name: 'ENGR. ABDO',
};

export default function PrintLPOPage() {
  return (
    <MainLayout>
      <div className="lpo-print" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* HEADER */}
        <div className="card">
          <h1 style={{ marginBottom: 4 }}>Local Purchase Order</h1>
          <p className="text-secondary">
            Order No: {order.order_number}
          </p>
        </div>

        {/* SUPPLIER */}
        <div className="card">
          <strong>Supplier:</strong>
          <div>{order.supplier.name}</div>
        </div>

        {/* ITEMS */}
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id}>
                  <td>
                    <div>{item.product.name}</div>
                    <div className="text-secondary text-xs">{item.product.code}</div>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.unit_price)}</td>
                  <td>{formatPrice(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* NOTES */}
        <div className="card">
          <strong>Notes:</strong>
          <p>{order.notes}</p>
          <p>Payment Terms: {order.payment_terms}</p>
          <p>Delivery Terms: {order.delivery_terms}</p>
        </div>

        {/* SUMMARY */}
        <div className="card" style={{ width: 300, marginLeft: 'auto' }}>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatPrice(order.tax_amount)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* SIGNATURES */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
          <div style={{ width: '30%', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 8 }}>Prepared By</div>
          </div>
          <div style={{ width: '30%', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 8 }}>Checked By</div>
          </div>
          <div style={{ width: '30%', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 8 }}>Approved By</div>
          </div>
        </div>

        {/* PRINT BUTTON */}
        <div>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            Print
          </button>
        </div>

      </div>
    </MainLayout>
  );
}
