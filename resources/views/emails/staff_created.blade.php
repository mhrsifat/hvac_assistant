<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Staff Account Created</title>
  </head>
  <body>
    <p>Hello {{ $user->first_name }},</p>

    <p>A staff account has been created for you. You can sign in using the credentials below:</p>

    <ul>
      <li>Email: {{ $user->email }}</li>
      <li>Password: {{ $password }}</li>
    </ul>

    <p>Please login and change your password as soon as possible.</p>

    <p>Regards,<br/>The Team</p>
  </body>
  </html>
