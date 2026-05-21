<?php

namespace App\Http\Controllers\Api\User;

use App\Models\SellerTransaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class SellerTransactionInvoiceController
{
    public function __invoke(int $id): Response
    {
        $transaction = SellerTransaction::with([
            'seller.businessDetail',
            'order.user',
        ])->findOrFail($id);

        $pdf = Pdf::loadView('invoices.seller_transaction', [
            'transaction' => $transaction,
            'seller' => $transaction->seller,
            'customer' => $transaction->order->user,
            'order' => $transaction->order,
        ]);

        return $pdf->download('invoice-'.$transaction->id.'.pdf');
    }
}
