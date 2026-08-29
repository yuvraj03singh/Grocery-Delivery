import type { Order } from "../../types";
import { BikeIcon, MapPinIcon, PhoneIcon } from "lucide-react";

export default function InvoicePrint({ order }: { order: Order }) {
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "₹";
  
  return (
    <div 
      className="hidden print:block p-6 w-full max-w-4xl mx-auto bg-white text-gray-900 font-sans print:m-0"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body, html {
              background: #fff !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}
      </style>
      {/* Header section */}
      <div className="flex justify-between items-start border-b-2 border-green-700 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="size-14 rounded-2xl bg-green-700 flex items-center justify-center text-white shadow-sm">
            <BikeIcon className="size-8" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-green-700 tracking-tight">Apna Bazaar</h1>
            <p className="text-gray-500 text-xs font-medium mt-0.5">Fresh groceries delivered fast.</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest mb-1">Tax Invoice</h2>
          <p className="text-gray-600 font-medium text-sm">Invoice <span className="text-gray-900 font-bold">#{order.id.slice(-8).toUpperCase()}</span></p>
          <p className="text-gray-500 text-xs mt-0.5">Date: {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Addresses and Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Billed To */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
          <p className="font-bold text-gray-900 text-base mb-2">
            {typeof order.user === 'object' && order.user?.name ? order.user.name : ((order.shippingAddress as any).userId || order.shippingAddress.label)}
          </p>
          <div className="text-gray-600 text-xs space-y-1.5">
            <p className="flex items-start gap-2">
              <MapPinIcon className="size-3.5 text-gray-400 mt-0.5 shrink-0" />
              <span className="leading-relaxed">
                {order.shippingAddress.address}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {(order.shippingAddress as any).pinCode || order.shippingAddress.zip}
              </span>
            </p>
            {(order.shippingAddress as any).phone && (
              <p className="flex items-center gap-2">
                <PhoneIcon className="size-3.5 text-gray-400 shrink-0" />
                <span>{(order.shippingAddress as any).phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Payment & Company Info */}
        <div className="flex flex-col justify-between">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-full">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-[11px] uppercase font-semibold mb-1">Method</p>
                <p className="font-bold text-gray-900 text-sm capitalize">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-500 text-[11px] uppercase font-semibold mb-1">Status</p>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${order.isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {order.isPaid ? 'PAID' : 'PENDING'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-xl border border-gray-200 mb-6 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-2.5 px-4 font-extrabold text-gray-600 text-[11px] uppercase tracking-widest">Item Description</th>
              <th className="py-2.5 px-4 font-extrabold text-gray-600 text-center text-[11px] uppercase tracking-widest w-20">Qty</th>
              <th className="py-2.5 px-4 font-extrabold text-gray-600 text-right text-[11px] uppercase tracking-widest w-28">Price</th>
              <th className="py-2.5 px-4 font-extrabold text-gray-600 text-right text-[11px] uppercase tracking-widest w-28">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map((item, i) => (
              <tr key={i} className="bg-white">
                <td className="py-2.5 px-4 text-gray-900 font-semibold text-sm">
                  {item.name}
                </td>
                <td className="py-2.5 px-4 text-center font-semibold text-gray-700 text-sm">{item.quantity}</td>
                <td className="py-2.5 px-4 text-right text-gray-700 text-sm">{currency}{item.price.toFixed(2)}</td>
                <td className="py-2.5 px-4 text-right font-bold text-gray-900 text-sm">{currency}{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="flex justify-end w-full mb-8">
        <div className="w-72 bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-gray-600 text-xs">
              <span className="font-medium">Subtotal</span>
              <span className="font-semibold text-gray-900">{currency}{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-xs">
              <span className="font-medium">Delivery Fee</span>
              <span className="font-semibold text-gray-900">{order.deliveryFee === 0 ? "Free" : `${currency}${order.deliveryFee.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-xs">
              <span className="font-medium">Tax</span>
              <span className="font-semibold text-gray-900">{currency}{order.tax.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-3 border-t border-gray-200 border-dashed">
            <span className="font-extrabold text-gray-900 text-sm uppercase tracking-wider">Total</span>
            <span className="font-black text-green-700 text-xl">{currency}{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-100 pt-4 mt-auto">
        <div className="flex flex-col items-center justify-center text-center">
          <h4 className="font-bold text-gray-800 text-sm mb-1">Thank you for your business!</h4>
          <p className="text-gray-500 text-xs max-w-md font-medium leading-relaxed">
            If you have any questions regarding this invoice, please contact our customer support team at support@apnabazaar.com.
          </p>
        </div>
      </div>
    </div>
  );
}
