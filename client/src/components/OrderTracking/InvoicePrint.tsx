import type { Order } from "../../types";
import { BikeIcon, MapPinIcon, PhoneIcon } from "lucide-react";

export default function InvoicePrint({ order }: { order: Order }) {
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "₹";
  
  return (
    <div 
      className="hidden print:block p-10 w-full max-w-4xl mx-auto bg-white text-gray-900 font-sans"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
          }
        `}
      </style>
      {/* Header section */}
      <div className="flex justify-between items-start border-b-2 border-green-700 pb-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-green-700 flex items-center justify-center text-white shadow-sm">
            <BikeIcon className="size-9" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-green-700 tracking-tight">Apna Bazaar</h1>
            <p className="text-gray-500 text-sm font-medium mt-0.5">Fresh groceries delivered fast.</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-widest mb-1.5">Tax Invoice</h2>
          <p className="text-gray-600 font-medium text-lg">Invoice <span className="text-gray-900">#{order.id.slice(-8).toUpperCase()}</span></p>
          <p className="text-gray-500 text-sm mt-1">Date: {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Addresses and Info */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        {/* Billed To */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Billed To</h3>
          <p className="font-bold text-gray-900 text-xl mb-3">
            {typeof order.user === 'object' && order.user?.name ? order.user.name : ((order.shippingAddress as any).userId || order.shippingAddress.label)}
          </p>
          <div className="text-gray-600 text-sm space-y-2">
            <p className="flex items-start gap-3">
              <MapPinIcon className="size-4 text-gray-400 mt-0.5 shrink-0" />
              <span className="leading-relaxed">
                {order.shippingAddress.address}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {(order.shippingAddress as any).pinCode || order.shippingAddress.zip}
              </span>
            </p>
            {(order.shippingAddress as any).phone && (
              <p className="flex items-center gap-3">
                <PhoneIcon className="size-4 text-gray-400 shrink-0" />
                <span>{(order.shippingAddress as any).phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Payment & Company Info */}
        <div className="flex flex-col justify-between">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-4 h-full">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Payment Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1.5">Method</p>
                <p className="font-bold text-gray-900 text-lg capitalize">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1.5">Status</p>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${order.isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {order.isPaid ? 'PAID' : 'PENDING'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-2xl border border-gray-200 mb-8 shadow-sm print:shadow-none">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-4 px-6 font-extrabold text-gray-600 text-xs uppercase tracking-widest">Item Description</th>
              <th className="py-4 px-6 font-extrabold text-gray-600 text-center text-xs uppercase tracking-widest w-24">Qty</th>
              <th className="py-4 px-6 font-extrabold text-gray-600 text-right text-xs uppercase tracking-widest w-32">Price</th>
              <th className="py-4 px-6 font-extrabold text-gray-600 text-right text-xs uppercase tracking-widest w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map((item, i) => (
              <tr key={i} className="bg-white">
                <td className="py-4 px-6 text-gray-900 font-semibold border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <span className="text-base">{item.name}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-center font-semibold text-gray-700 text-base border-b border-gray-100">{item.quantity}</td>
                <td className="py-4 px-6 text-right text-gray-700 text-base border-b border-gray-100">{currency}{item.price.toFixed(2)}</td>
                <td className="py-4 px-6 text-right font-bold text-gray-900 text-base border-b border-gray-100">{currency}{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="flex justify-end w-full mb-16">
        <div className="w-80 bg-gray-50 rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-gray-600 text-sm">
              <span className="font-medium">Subtotal</span>
              <span className="font-semibold text-gray-900">{currency}{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm">
              <span className="font-medium">Delivery Fee</span>
              <span className="font-semibold text-gray-900">{order.deliveryFee === 0 ? "Free" : `${currency}${order.deliveryFee.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm">
              <span className="font-medium">Tax</span>
              <span className="font-semibold text-gray-900">{currency}{order.tax.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-5 border-t-2 border-gray-200 border-dashed">
            <span className="font-extrabold text-gray-900 text-xl uppercase tracking-wider">Total</span>
            <span className="font-black text-green-700 text-3xl">{currency}{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t-2 border-gray-100 pt-8 mt-auto pb-4">
        <div className="flex flex-col items-center justify-center text-center">
          <h4 className="font-bold text-gray-800 text-xl mb-2">Thank you for your business!</h4>
          <p className="text-gray-500 text-sm max-w-md font-medium leading-relaxed">
            If you have any questions regarding this invoice, please contact our customer support team at support@apnabazaar.com.
          </p>
        </div>
      </div>
    </div>
  );
}
