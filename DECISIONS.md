## Use of Artificial Intelligence

AI was used to speed up scaffolding, implementation drafts, tests, and UI components. Generated code was reviewed incrementally rather than accepted as a complete solution. The main corrections were:

- Domain tests: The initial tests covered only a small part of the state machine. They were expanded to cover all relevant transitions, failed-transition immutability, document-gated submission, overdue calculation, version increments, and Tax ID masking.

- Architecture and persistence: The initial proposal used integer IDs and considered SQLite. UUIDs and PostgreSQL were selected instead to provide opaque API identifiers and a more realistic environment for transactions and optimistic concurrency.

- Document requirement: An initial frontend implementation required a document during creation whenever `requires_document` was true. This was rejected because the obligation may be created without a document; the backend must enforce the rule only when transitioning to `submitted`.

- Partial updates: The generated PATCH implementation used `exclude_none=True`. It was changed to `exclude_unset=True` so omitted fields remain unchanged while explicitly submitted `null` and `False` values retain their intended meaning.

- Dashboard rendering: The first dashboard implementation was statically generated during the build. It was changed to dynamic rendering so newly created or updated obligations are fetched from the backend on request.

- Delete confirmation: The initial confirmation UI was rendered inside the header and broke the layout. It was replaced with an accessible, responsive confirmation dialog without changing the deletion logic.

The generated migrations and API behavior were reviewed manually. Backend flows were validated with automated tests and Postman, while frontend behavior was verified through component tests and browser-based scenarios.