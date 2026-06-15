<?php

namespace App\Ai\Agents;

use App\Models\Chat;
use App\Models\User;
use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Laravel\Ai\Tools\SimilaritySearch;
use Modules\Vector\Models\ManualVector;
use Stringable;

#[MaxSteps(5)]
class HvacAssistantAgent implements Agent, Conversational, HasTools
{
    use Promptable;

    public function __construct(public User $user, public Chat $chat)
    {
        // Eagerly load brand/model context so instructions() can use it
        $this->chat->loadMissing('hvacModel.brand');
    }

    public function instructions(): Stringable|string
    {
        $hvacModel = $this->chat->hvacModel;

        $contextBlock = '';

        if ($hvacModel) {
            $brandName = $hvacModel->brand?->name ?? 'Unknown Brand';
            $modelName = $hvacModel->name;
            $modelNumber = $hvacModel->model_number ? " (Model #: {$hvacModel->model_number})" : '';
            $specs = [];

            if ($hvacModel->capacity_btu) {
                $specs[] = "Capacity: {$hvacModel->capacity_btu} BTU";
            }
            if ($hvacModel->efficiency_rating) {
                $specs[] = "Efficiency: {$hvacModel->efficiency_rating}";
            }
            if ($hvacModel->refrigerant_type) {
                $specs[] = "Refrigerant: {$hvacModel->refrigerant_type}";
            }
            if ($hvacModel->power_spec) {
                $specs[] = "Power: {$hvacModel->power_spec}";
            }

            $specsText = ! empty($specs) ? ' Specifications: '.implode(', ', $specs).'.' : '';

            $contextBlock = "\n\nCURRENT SESSION CONTEXT:\n"
                ."- Brand: {$brandName}\n"
                ."- Model: {$modelName}{$modelNumber}\n"
                .($specsText ? "- {$specsText}\n" : '')
                ."\nYou are already aware of the brand and model above. Do NOT ask the user for their brand or model — you already know it. Focus directly on diagnosing and resolving their issue.";
        }

        return 'You are an expert HVAC technician assistant. You help technicians troubleshoot and repair HVAC systems based on error codes and manuals. Be concise and precise. '
            .'CRITICAL: You MUST ALWAYS use the SimilaritySearch tool to look up error codes, manuals, or procedures BEFORE answering. NEVER rely on your pre-trained knowledge for error codes, as they vary wildly between brands and models.'
            .$contextBlock;
    }

    public function messages(): iterable
    {
        return $this->chat->messages()
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->filter(fn ($message) => filled($message->content))
            ->map(fn ($message) => new Message($message->sender_role, $message->content))
            ->values()
            ->all();
    }

    public function tools(): iterable
    {
        return [
            SimilaritySearch::usingModel(ManualVector::class, 'embedding')
                ->withDescription('Search the knowledge base for relevant HVAC manuals, error codes, and troubleshooting steps.'),
        ];
    }
}
