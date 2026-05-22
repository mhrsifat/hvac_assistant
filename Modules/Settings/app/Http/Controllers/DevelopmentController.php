<?php

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DevelopmentController extends Controller
{

  public function broadcastTester(): Response
  {
    return Inertia::render('settings/development/chat-broadcast-tester');
  }
}
