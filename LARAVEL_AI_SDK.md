# Laravel AI SDK

### Introduction
The Laravel AI SDK provides a unified, expressive API for interacting with AI providers such as OpenAI, Anthropic, Gemini, and more. With the AI SDK, you can build intelligent agents with tools and structured output, generate images, synthesize and transcribe audio, create vector embeddings, and much more — all using a consistent, Laravel-friendly interface.

### Installation
You can install the Laravel AI SDK via Composer:
```bash
composer require laravel/ai
```

Next, you should publish the AI SDK configuration and migration files using the `vendor:publish` Artisan command:
```bash
php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"
```

Finally, you should run your application's database migrations. This will create the `agent_conversations` and `agent_conversation_messages` tables that the AI SDK uses to power its conversation storage:
```bash
php artisan migrate
```

### Configuration
You may define your AI provider credentials in your application's `config/ai.php` configuration file or as environment variables in your application's `.env` file:
```env
ANTHROPIC_API_KEY=
AZURE_OPENAI_API_KEY=
COHERE_API_KEY=
DEEPSEEK_API_KEY=
ELEVENLABS_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
MISTRAL_API_KEY=
OLLAMA_API_KEY=
OPENAI_API_KEY=
OPENROUTER_API_KEY=
JINA_API_KEY=
VOYAGEAI_API_KEY=
XAI_API_KEY=
```

The default models used for text, images, audio, transcription, and embeddings may also be configured in your application's `config/ai.php` configuration file.

### Custom Base URLs
By default, the Laravel AI SDK connects directly to each provider's public API endpoint. However, you may route requests through a different endpoint:
```php
'providers' => [
    'openai' => [
        'driver' => 'openai',
        'key' => env('OPENAI_API_KEY'),
        'url' => env('OPENAI_BASE_URL'),
    ],
 
    'anthropic' => [
        'driver' => 'anthropic',
        'key' => env('ANTHROPIC_API_KEY'),
        'url' => env('ANTHROPIC_BASE_URL'),
    ],
],
```

Custom base URLs are supported for: OpenAI, Anthropic, Gemini, Groq, Cohere, DeepSeek, xAI, and OpenRouter.

### Provider Support
The AI SDK supports a variety of providers across its features:
- **Text:** OpenAI, Anthropic, Gemini, Azure, Bedrock, Groq, xAI, DeepSeek, Mistral, Ollama, OpenRouter
- **Images:** OpenAI, Gemini, xAI, Azure, Bedrock, OpenRouter
- **TTS:** OpenAI, ElevenLabs, Gemini
- **STT:** OpenAI, ElevenLabs, Mistral, Gemini
- **Embeddings:** OpenAI, Gemini, Azure, Bedrock, Cohere, Mistral, Jina, VoyageAI, Ollama, OpenRouter
- **Reranking:** Cohere, Jina, VoyageAI
- **Files:** OpenAI, Anthropic, Gemini

You can reference providers using the `Laravel\Ai\Enums\Lab` enum:
```php
use Laravel\Ai\Enums\Lab;
 
Lab::Anthropic;
Lab::OpenAI;
Lab::Gemini;
```

### Agents
Each agent is a dedicated PHP class that encapsulates instructions, conversation context, tools, and output schema.
Create an agent via the `make:agent` Artisan command:
```bash
php artisan make:agent SalesCoach
php artisan make:agent SalesCoach --structured
```

Example Agent:
```php
<?php
 
namespace App\Ai\Agents;
 
use App\Ai\Tools\RetrievePreviousTranscripts;
use App\Models\History;
use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Stringable;
 
class SalesCoach implements Agent, Conversational, HasTools, HasStructuredOutput
{
    use Promptable;
 
    public function __construct(public User $user) {}
 
    public function instructions(): Stringable|string
    {
        return 'You are a sales coach, analyzing transcripts and providing feedback.';
    }
 
    public function messages(): iterable
    {
        return History::where('user_id', $this->user->id)
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->map(function ($message) {
                return new Message($message->role, $message->content);
            })->all();
    }
 
    public function tools(): iterable
    {
        return [
            new RetrievePreviousTranscripts,
        ];
    }
 
    public function schema(JsonSchema $schema): array
    {
        return [
            'feedback' => $schema->string()->required(),
            'score' => $schema->integer()->min(1)->max(10)->required(),
        ];
    }
}
```

### Prompting
```php
$response = (new SalesCoach)->prompt('Analyze this sales transcript...');
return (string) $response;
```

With automatic dependency injection and constructor arguments:
```php
$agent = SalesCoach::make(user: $user);
```

Override defaults during prompting:
```php
$response = (new SalesCoach)->prompt(
    'Analyze this sales transcript...',
    provider: Lab::Anthropic,
    model: 'claude-haiku-4-5-20251001',
    timeout: 120,
);
```

### Remembering Conversations
Use the `RemembersConversations` trait to automatically store and retrieve conversation history:
```php
use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Promptable;
 
class SalesCoach implements Agent, Conversational
{
    use Promptable, RemembersConversations;
 
    public function instructions(): string
    {
        return 'You are a sales coach...';
    }
}
```

Starting and continuing conversations:
```php
// Start a new conversation
$response = (new SalesCoach)->forUser($user)->prompt('Hello!');
$conversationId = $response->conversationId;

// Continue an existing conversation
$response = (new SalesCoach)
    ->continue($conversationId, as: $user)
    ->prompt('Tell me more about that.');
```

Add the `HasConversations` trait to the user model:
```php
use Laravel\Ai\Concerns\HasConversations;
 
class User extends Authenticatable
{
    use HasConversations;
}
```

### Structured Output
Implement `HasStructuredOutput` and define the `schema` method. Access results like an array:
```php
$response = (new SalesCoach)->prompt('Analyze this...');
return $response['score'];
```

#### Nested Objects
```php
'metadata' => $schema->object(fn ($schema) => [
    'confidence' => $schema->string()->enum(['low', 'medium', 'high'])->required(),
    'language' => $schema->string()->required(),
])->required(),
```

#### Arrays of Objects
```php
'feedback' => $schema->array()
    ->items(
        $schema->object(fn ($schema) => [
            'comment' => $schema->string()->required(),
            'score' => $schema->integer()->required(),
        ])
    )->required(),
```

### Attachments
Pass files or images with the prompt:
```php
use Laravel\Ai\Files;
 
$response = (new SalesCoach)->prompt(
    'Analyze the attached files...',
    attachments: [
        Files\Document::fromStorage('transcript.pdf'),
        Files\Image::fromPath('/path/to/photo.jpg'),
        $request->file('transcript'),
    ]
);
```

### Streaming
Stream responses from a route:
```php
Route::get('/coach', function () {
    return (new SalesCoach)->stream('Analyze this...');
});
```

Using the Vercel AI SDK Protocol:
```php
return (new SalesCoach)
    ->stream('Analyze this...')
    ->usingVercelDataProtocol();
```

### Broadcasting
```php
// Broadcast stream events directly
$stream = (new SalesCoach)->stream('Analyze...');
foreach ($stream as $event) {
    $event->broadcast(new Channel('channel-name'));
}

// Queue agent operation and broadcast stream events
(new SalesCoach)->broadcastOnQueue(
    'Analyze...',
    new Channel('channel-name'),
);
```

### Queueing
```php
(new SalesCoach)
    ->queue('Analyze...')
    ->then(function (AgentResponse $response) {
        // Handle success
    })
    ->catch(function (Throwable $e) {
        // Handle error
    });
```

### Tools
Create tools via the `make:tool` Artisan command:
```bash
php artisan make:tool RandomNumberGenerator
```

Define the handle and schema:
```php
class RandomNumberGenerator implements Tool
{
    public function description(): string
    {
        return 'Generates cryptographically secure random numbers.';
    }
 
    public function handle(Request $request): string
    {
        return (string) random_int($request['min'], $request['max']);
    }
 
    public function schema(JsonSchema $schema): array
    {
        return [
            'min' => $schema->integer()->min(0)->required(),
            'max' => $schema->integer()->required(),
        ];
    }
}
```

### Similarity Search (RAG)
Give agents access to vector embeddings stored in PostgreSQL:
```php
use App\Models\Document;
use Laravel\Ai\Tools\SimilaritySearch;
 
public function tools(): iterable
{
    return [
        SimilaritySearch::usingModel(Document::class, 'embedding')
            ->withDescription('Search the knowledge base for relevant articles.'),
    ];
}
```

### Provider Tools
Implement provider-native tools:
- **WebSearch:** `new WebSearch`
- **WebFetch:** `new WebFetch`
- **FileSearch:** `new FileSearch(stores: ['store_id'])`

### Sub-Agents
Delegate sub-tasks to specialized agents:
```php
public function tools(): iterable
{
    return [
        new RefundsAgent,
    ];
}
```

### Middleware
Create agent middleware using the `make:agent-middleware` Artisan command:
```bash
php artisan make:agent-middleware LogPrompts
```

Implement `HasMiddleware` and define the `middleware` method.

### Anonymous Agents
Ad-hoc interactions without an agent class:
```php
use function Laravel\Ai\agent;
 
$response = agent(instructions: 'You are an expert...')->prompt('Tell me about Laravel');
```

### Agent Configuration Attributes
Annotate agents for setup:
- `#[Provider(Lab::Anthropic)]`
- `#[Model('claude-haiku-4-5-20251001')]`
- `#[MaxSteps(10)]`
- `#[MaxTokens(4096)]`
- `#[Temperature(0.7)]`
- `#[Timeout(120)]`
- `#[TopP(0.9)]`
- `#[UseCheapestModel]`
- `#[UseSmartestModel]`

### Image Generation
```php
use Laravel\Ai\Image;
 
$image = Image::of('A donut sitting on the kitchen counter')
    ->quality('high')
    ->landscape()
    ->generate();

$path = $image->store();
```

### Audio (TTS)
```php
use Laravel\Ai\Audio;
 
$audio = Audio::of('I love coding with Laravel.')
    ->female()
    ->instructions('Said like a pirate')
    ->generate();

$path = $audio->store();
```

### Transcriptions (STT)
```php
use Laravel\Ai\Transcription;
 
$transcript = Transcription::fromStorage('audio.mp3')->diarize()->generate();
```

### Embeddings
```php
use Illuminate\Support\Str;
 
$embeddings = Str::of('Napa Valley has great wine.')->toEmbeddings();
```
Vector query:
```php
$documents = Document::query()
    ->whereVectorSimilarTo('embedding', 'best wineries in Napa Valley')
    ->limit(10)
    ->get();
```

### Reranking
```php
use Laravel\Ai\Reranking;
 
$response = Reranking::of($documents)->rerank('PHP frameworks');
```

### Vector Stores
```php
use Laravel\Ai\Stores;
 
$store = Stores::create('Knowledge Base');
$document = $store->add(Document::fromPath('/path/to/document.pdf'));
```
