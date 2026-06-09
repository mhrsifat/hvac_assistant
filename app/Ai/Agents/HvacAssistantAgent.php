<?php

namespace App\Ai\Agents;

use App\Models\Chat;
use App\Models\User;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Laravel\Ai\Tools\SimilaritySearch;
use Modules\Vector\Models\ManualVector;
use Stringable;

class HvacAssistantAgent implements Agent, Conversational, HasTools
{
    use Promptable;

    public function __construct(public User $user, public Chat $chat) {}

    public function instructions(): Stringable|string
    {
        return 'You are an expert HVAC technician assistant. You help technicians troubleshoot and repair HVAC systems based on error codes and manuals. Be concise and precise. Use the SimilaritySearch tool to find relevant manual content if you are unsure about specific error codes or procedures.';
    }

    public function messages(): iterable
    {
        return $this->chat->messages()
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->map(function ($message) {
                // If it's a user message and has attachments, we might pass them, but here we just pass text
                // Adjust if attachments need to be passed to AI SDK in history.
                return new Message($message->sender_role, $message->content ?? 'Sent an attachment.');
            })->all();
    }

    public function tools(): iterable
    {
        return [
            SimilaritySearch::usingModel(ManualVector::class, 'embedding')
                ->withDescription('Search the knowledge base for relevant HVAC manuals, error codes, and troubleshooting steps.'),
        ];
    }
}
