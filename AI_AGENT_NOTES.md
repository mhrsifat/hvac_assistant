# AI Agent Notes

- This app uses two databases.
- The primary application database comes from the normal environment variables in `.env`.
- A separate PostgreSQL database is used for vector data.
- The vector database connection is `pgsql_vector`.
- All vector-related logic MUST live inside: `Modules/Vector`
- No vector logic outside this module
- No mixing vector logic with core app services
- Treat this module as isolated infrastructure layer
- Do not assume the vector database is the same as the main app database.
- `manual_vectors` only has `content` and `embedding`.
- When changing database code, keep both connections in mind.
