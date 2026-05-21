<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application. Ensure you abide by these specific packages & versions:

- php - 8.4
- inertiajs/inertia-laravel (INERTIA_LARAVEL) - v2
- laravel/framework (LARAVEL) - v13
- laravel/boost (BOOST) - v2
- pestphp/pest (PEST) - v4
- react (REACT) - v19
- tailwindcss (TAILWINDCSS) - v4
- [Assume other standard Laravel 13 ecosystem packages as per your original list]

## Token Optimization & Output Rules (CRITICAL)

- **NO YAPPING:** Output ONLY the requested code. Do not provide conversational filler, pleasantries, or unnecessary explanations unless explicitly asked.
- **PARTIAL UPDATES:** When modifying an existing file, output ONLY the functions or code blocks that changed. Do not output the entire file unless requested.
- **AVOID ASSUMPTIONS:** Do not create related files (like controllers, migrations, or tests) unless the user explicitly requests them.

## Conventions

- Follow all existing code conventions used in this application.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.

=== boost rules ===

# Laravel Boost

## Artisan & Tinker

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`).
- Execute PHP in app context for debugging and testing code via Tinker. Do not create models without user approval.

=== php rules ===

# PHP

- Always use curly braces for control structures.
- Use PHP 8 constructor property promotion.
- Use explicit return type declarations and type hints for all method parameters.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.

=== tests rules ===

# Test Enforcement (UPDATED)

- **DO NOT create, modify, or run any test files (Pest/PHPUnit) unless explicitly requested by the user.**
- Skip all test generation to save tokens and execution time.
- If the user asks for a test, then use `php artisan test --compact` to verify it.

=== inertia-laravel/core rules ===

# Inertia v2

- Components live in `resources/js/pages`. Use `Inertia::render()` for server-side routing.
- Use all Inertia v2 features: deferred props, infinite scroll, merging props, polling, prefetching.
- When using deferred props, add an empty state with a pulsing skeleton.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files. Pass `--no-interaction` to all Artisan commands.
- For APIs, default to using Eloquent API Resources and API versioning.
- When generating links, prefer named routes and the `route()` function.

=== laravel/v12 rules ===

# Laravel 12 Structure

- Middleware are configured declaratively in `bootstrap/app.php`.
- `bootstrap/providers.php` contains application specific service providers.
- Console commands in `app\Console/Commands/` are automatically available.
- Casts should be set in a `casts()` method on a model rather than the `$casts` property.

=== pint/core rules ===

# Laravel Pint Code Formatter

- After modifying PHP files, run `vendor/bin/pint --dirty --format agent`. Do not run with `--test`.

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

</laravel-boost-guidelines>
