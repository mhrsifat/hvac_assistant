# AI Agent Notes

## Database Architecture
- This app strictly uses TWO separate databases.
- The primary application database (MySQL/MariaDB) uses the default environment variables in `.env`.
- A separate PostgreSQL database is explicitly used for vector data.
- The vector database connection is named `pgsql_vector`.
- When changing database code, always keep both connections in mind. Do not run vector migrations on the default database.

## Module Isolation
- All vector-related logic MUST live inside: `Modules/Vector`
- Do not place any vector logic outside this module.
- Do not mix vector logic with core app services.
- Treat this module as an isolated infrastructure layer.

## Vector Schema Constraints
- The `manual_vectors` table (inside the `pgsql_vector` connection) STRICTLY has ONLY two columns: `content` (text) and `embedding` (vector).
- Do NOT attempt to insert, select, or migrate any other columns (like brand_id, model_id, source, etc.) into `manual_vectors`.

## Multi-Document to Vector Workflow (PDF, Word, Excel, CSV)
When generating code to process documents into the vector database, you MUST follow this exact pipeline:
1. **File Type Detection:** Identify the file extension (e.g., pdf, docx, xlsx, csv).
2. **Extraction by Type:**
   - For PDF: Use `Spatie\PdfToText\Pdf` to extract raw text.
   - For Word (.docx): Use `PhpOffice\PhpWord\IOFactory` to load and extract text from all elements.
   - For Excel/CSV (.xlsx, .csv): Use `PhpOffice\PhpSpreadsheet\IOFactory`. Iterate through rows and columns, concatenating row values with a separator (e.g., `implode(" - ", $rowValues)`) so that tabular data is converted into meaningful, readable sentences.
3. **Sanitization:** Clean the extracted text by removing excessive whitespace and newlines (e.g., `preg_replace('/\s+/', ' ', $text)`).
4. **Chunking with Overlap:** Split the cleaned text into logical, overlapping chunks (e.g., 1000 characters with a 200-character overlap) so that contextual meaning is not lost between cuts.
5. **Embedding:** Send each text chunk to the Embedding model (via Laravel AI SDK or OpenAI API) to generate the vector array.
6. **Storage:** Insert the chunk's text into the `content` column and its vector array into the `embedding` column of the `manual_vectors` table using the `pgsql_vector` connection. Add sleep delays (e.g., `usleep(200000)`) inside loops to prevent rate-limiting from the AI provider.