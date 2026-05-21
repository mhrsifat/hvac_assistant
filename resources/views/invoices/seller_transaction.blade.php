<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #{{ $transaction->id }}</title>
    <style>
        body {
            font-family: 'Helvetica', sans-serif;
            color: #333;
            line-height: 1.6;
        }
        .container {
            width: 100%;
            margin: 0 auto;
            padding: 20px;
        }
        .header, .footer {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #007bff;
        }
        .invoice-details, .company-details {
            margin-bottom: 30px;
        }
        .invoice-details table, .company-details table {
            width: 100%;
            border-collapse: collapse;
        }
        .invoice-details th, .invoice-details td,
        .company-details th, .company-details td {
            padding: 8px;
            text-align: left;
        }
        .invoice-details th {
            background-color: #f2f2f2;
        }
        .summary-table {
            width: 100%;
            margin-top: 20px;
            border-collapse: collapse;
        }
        .summary-table th, .summary-table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: right;
        }
        .summary-table th {
            background-color: #f2f2f2;
            text-align: left;
        }
        .total-section {
            margin-top: 20px;
            float: right;
            width: 40%;
        }
        .total-section table {
            width: 100%;
            border-collapse: collapse;
        }
        .total-section th, .total-section td {
            padding: 8px;
            text-align: right;
        }
        .total-section th {
            text-align: left;
        }
        .total-section .grand-total {
            font-weight: bold;
            font-size: 1.2em;
            background-color: #f2f2f2;
        }
        .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            font-size: 12px;
            color: #777;
        }
        .clearfix::after {
            content: "";
            display: table;
            clear: both;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>COMMISSION INVOICE</h1>
        </div>

        <div class="invoice-details clearfix">
            <div style="float: left; width: 50%;">
                <strong>Billed To:</strong><br>
                {{ $seller->businessDetail?->company_name ?? $seller->name }}<br>
                {{ $seller->businessDetail?->address_line }}<br>
                {{ $seller->businessDetail?->city }}, {{ $seller->businessDetail?->state }} {{ $seller->businessDetail?->zip_code }}<br>
                {{ $seller->businessDetail?->country }}<br>
                Tax ID/Reg: {{ $seller->businessDetail?->tax_id_or_reg_number ?? 'N/A' }}<br>
                {{ $seller->email }}<br>
                {{ $seller->phone }}
            </div>
            <div style="float: right; width: 50%; text-align: right;">
                <strong>Invoice #{{ $transaction->id }}</strong><br>
                Date: {{ $transaction->created_at->format('M d, Y') }}<br>
                Order: #{{ $order->order_number }}<br>
                Status: <span style="text-transform: capitalize;">{{ $transaction->status }}</span>
            </div>
        </div>

        <div class="company-details">
             <strong>From:</strong><br>
             {{ config('app.name', 'Davorro Martis') }}<br>
             {{-- Add your company address here --}}
             123 Marketplace St.<br>
             Commerce City, 12345<br>
             contact@davorronmartis.com
        </div>

        <h3>Order & Commission Summary</h3>

        <table class="summary-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total Gross Sale Value from Order #{{ $order->order_number }}</td>
                    <td>{{ number_format($transaction->gross_amount, 2) }} {{ $transaction->currency }}</td>
                </tr>
                <tr>
                    <td>Commission Rate</td>
                    <td>{{ number_format($transaction->commission_percentage, 2) }}%</td>
                </tr>
            </tbody>
        </table>

        <div class="total-section">
            <table>
                <tr>
                    <th>Commission Fee:</th>
                    <td>{{ number_format($transaction->commission_amount, 2) }} {{ $transaction->currency }}</td>
                </tr>
                <tr class="grand-total">
                    <th>Net Amount Payable to Seller:</th>
                    <td>{{ number_format($transaction->net_amount, 2) }} {{ $transaction->currency }}</td>
                </tr>
            </table>
        </div>

        <div class="clearfix"></div>

        <div class="footer">
            <p>Thank you for your business!</p>
            <p>{{ config('app.name', 'Davorro Martis') }}</p>
        </div>
    </div>
</body>
</html>
