# AI Agent Model Guide

Use the real database columns exactly as they exist in the migrations. Do not guess column names, rename them mentally, or invent alternate fields.

## brands

- `slug`: brand slug.
- `name`: brand display name such as Samsung or LG.
- `logo_path`: stored path for the brand logo image.

## hvac_models

- `slug`: hvac model slug.
- `brand_id`: links the HVAC model to its brand.
- `name`: user-facing model name.
- `model_number`: manufacturer model code when available.
- `capacity_btu`: cooling capacity in BTU.
- `efficiency_rating`: efficiency label or rating string.
- `power_spec`: power specification text.
- `refrigerant_type`: refrigerant used by the unit.
- `image_path`: stored path for the HVAC model image.

## error_codes

- `brand_id`: Optional reference to a brand. When set, the error code applies to all HVAC models belonging to that brand.
- `hvac_model_id`: Optional reference to a specific HVAC model. When set, the error code applies only to that model.
- `code`: error code such as E03.
- `description`: what the code means.
- `resolution_steps`: troubleshooting and repair steps.

## chats

- `user_id`: the technician or user who owns the chat.
- `hvac_model_id`: optional HVAC model being discussed.
- `title`: short chat title shown in the UI.
- `status`: chat state such as active or closed.

## chat_messages

- `chat_id`: parent chat.
- `sender_id`: user who sent the message when the sender is a person; null for assistant or system messages.
- `sender_role`: message origin such as user, assistant, or system.
- `content`: message body.
- `attachments`: JSON array of stored paths or URLs for uploaded files.

## repair_reports

- `user_id`: report owner.
- `chat_id`: related chat when the report was generated from a conversation.
- `title`: report title.
- `location`: job site or customer location.
- `status`: report state such as completed.
- `pdf_path`: stored path to the exported PDF report.

## manual_vectors

- `content`: source knowledge text stored for semantic retrieval.
- `embedding`: pgvector embedding for the stored content.

## Rules for the agent

- Prefer the existing model classes in `app/Models`.
- Use the actual migration columns before adding new model attributes.
- If a field name is unclear, inspect the migration first rather than guessing.
- Keep the MySQL relational data separate from the PostgreSQL vector database in `Modules/Vector`.
- Do not invent columns such as `source_document`, `page_number`, or `brand_id` for the vector table unless the migration adds them first.
