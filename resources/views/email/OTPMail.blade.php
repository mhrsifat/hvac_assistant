<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Helvetica, Arial, sans-serif; color: #111827;">
    <span style="display: none; font-size: 1px; color: #f3f4f6; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
        Your verification code is {{ $otp }}.
    </span>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 32px 16px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(17, 24, 39, 0.08);">
                    <tr>
                        <td style="padding: 24px 32px; background-color: #0f172a; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 20px; font-weight: 700;">{{ config('app.name') }}</h1>
                            <p style="margin: 6px 0 0; font-size: 13px; color: #cbd5f5;">Verification</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px;">
                            <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 700;">Your verification code</h2>
                            <p style="margin: 0 0 20px; font-size: 15px; color: #4b5563;">
                                Use the code below to complete your sign-in. This code is valid for a limited time.
                            </p>
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; font-size: 32px; letter-spacing: 6px; font-weight: 700; color: #0f172a;">
                                {{ $otp }}
                            </div>
                            <p style="margin: 20px 0 0; font-size: 13px; color: #6b7280;">
                                If you did not request this code, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 18px 32px; background-color: #f8fafc; font-size: 12px; color: #6b7280;">
                            <p style="margin: 0;">
                                Need help? Contact us at
                                <a href="mailto:{{ config('mail.from.address') }}" style="color: #2563eb; text-decoration: none;">
                                    {{ config('mail.from.address') }}
                                </a>
                            </p>
                        </td>
                    </tr>
                </table>
                <p style="margin: 16px 0 0; font-size: 11px; color: #9ca3af;">
                    {{ config('app.name') }}
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
