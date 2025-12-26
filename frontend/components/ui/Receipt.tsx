import React, { useRef } from 'react';
import { Receipt as ReceiptType } from '../../types';
import { PrinterIcon, XIcon } from 'lucide-react';

interface ReceiptProps {
  receipt: ReceiptType;
  onClose: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ receipt, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo ${receipt.receiptNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
              font-size: 12px;
              background: white;
              color: black;
            }
            .receipt-container {
              border: 2px dashed #333;
              padding: 15px;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .company-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
              color: #000;
            }
            .company-info {
              font-size: 10px;
              margin: 2px 0;
              color: #333;
            }
            .receipt-info {
              margin: 15px 0;
              font-size: 11px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              color: #000;
            }
            .items-table {
              width: 100%;
              margin: 15px 0;
              border-top: 1px solid #333;
              border-bottom: 1px solid #333;
              padding: 10px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 11px;
              color: #000;
            }
            .item-name {
              flex: 1;
            }
            .item-qty {
              width: 40px;
              text-align: center;
            }
            .item-price {
              width: 60px;
              text-align: right;
            }
            .totals {
              margin-top: 15px;
              border-top: 2px solid #333;
              padding-top: 10px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 12px;
              color: #000;
            }
            .total-row.final {
              font-size: 16px;
              font-weight: bold;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #333;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px dashed #333;
              font-size: 10px;
              color: #333;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <PrinterIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Recibo</h2>
              <p className="text-sm opacity-90">{receipt.receiptNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <XIcon size={24} />
          </button>
        </div>

        {/* Receipt Content - Vista Previa */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-800">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border-2 border-dashed border-slate-300 dark:border-slate-600">
            {/* Company Header */}
            <div className="text-center mb-4 pb-4 border-b-2 border-slate-800 dark:border-slate-300">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">PRIMERA PARADA</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300">Restaurant & Café</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Av. Principal #123, Abancay</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Tel: (083) 123-456</p>
            </div>

            {/* Receipt Info */}
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="font-medium">Recibo N°:</span>
                <strong className="text-slate-900 dark:text-white">{receipt.receiptNumber}</strong>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="font-medium">Orden:</span>
                <span className="text-slate-900 dark:text-white">{receipt.orderNumber}</span>
              </div>
              {receipt.tableNumber && (
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span className="font-medium">Mesa:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{receipt.tableNumber}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="font-medium">Fecha:</span>
                <span className="text-slate-900 dark:text-white">{formatDate(receipt.timestamp)}</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="font-medium">Pago:</span>
                <span className="text-slate-900 dark:text-white font-semibold">{receipt.paymentMethod}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-t border-b border-slate-800 dark:border-slate-300 py-3 my-4">
              <div className="flex justify-between text-xs font-bold mb-2 pb-2 border-b border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <div className="flex-1">Producto</div>
                <div className="w-12 text-center">Cant.</div>
                <div className="w-20 text-right">Precio</div>
              </div>
              {receipt.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm mb-2 text-slate-800 dark:text-slate-200">
                  <div className="flex-1 pr-2">{item.menuItemName}</div>
                  <div className="w-12 text-center font-medium">{item.quantity}</div>
                  <div className="w-20 text-right font-semibold">S/. {(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Subtotal:</span>
                <span className="text-slate-900 dark:text-white">S/. {receipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>IGV (18%):</span>
                <span className="text-slate-900 dark:text-white">S/. {receipt.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-slate-800 dark:border-slate-300 text-slate-900 dark:text-white">
                <span>TOTAL:</span>
                <span>S/. {receipt.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6 pt-4 border-t border-dashed border-slate-400 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-400">
              <p className="font-medium">¡Gracias por su preferencia!</p>
              <p className="mt-1">Vuelva pronto</p>
            </div>
          </div>
        </div>

        {/* Hidden Print Content */}
        <div className="hidden">
          <div ref={printRef}>
            <div className="receipt-container">
              {/* Company Header */}
              <div className="header">
                <div className="company-name">PRIMERA PARADA</div>
                <div className="company-info">Restaurant & Café</div>
                <div className="company-info">Av. Principal #123, Abancay</div>
                <div className="company-info">Tel: (083) 123-456</div>
              </div>

              {/* Receipt Info */}
              <div className="receipt-info">
                <div className="info-row">
                  <span>Recibo N°:</span>
                  <strong>{receipt.receiptNumber}</strong>
                </div>
                <div className="info-row">
                  <span>Orden:</span>
                  <span>{receipt.orderNumber}</span>
                </div>
                {receipt.tableNumber && (
                  <div className="info-row">
                    <span>Mesa:</span>
                    <span>{receipt.tableNumber}</span>
                  </div>
                )}
                <div className="info-row">
                  <span>Fecha:</span>
                  <span>{formatDate(receipt.timestamp)}</span>
                </div>
                <div className="info-row">
                  <span>Pago:</span>
                  <span>{receipt.paymentMethod}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="items-table">
                <div className="item-row" style={{ fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                  <div className="item-name">Producto</div>
                  <div className="item-qty">Cant.</div>
                  <div className="item-price">Precio</div>
                </div>
                {receipt.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <div className="item-name">{item.menuItemName}</div>
                    <div className="item-qty">{item.quantity}</div>
                    <div className="item-price">S/. {(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>S/. {receipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>IGV (18%):</span>
                  <span>S/. {receipt.tax.toFixed(2)}</span>
                </div>
                <div className="total-row final">
                  <span>TOTAL:</span>
                  <span>S/. {receipt.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="footer">
                <p>¡Gracias por su preferencia!</p>
                <p style={{ marginTop: '5px' }}>Vuelva pronto</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-95"
          >
            <PrinterIcon size={20} />
            Imprimir
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
