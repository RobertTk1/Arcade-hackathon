# Arcade flow for COMO covers

1. `POST /patterns/create` {requestId, prompt, referenceIds?} → jobId
2. `POST /jobs/get` until succeeded → patternId
3. `categories/list` → notebook category; `categories/get` → full selections
4. `POST /products/create` → jobId → productId
5. `POST /checkouts/create` → checkoutUrl
6. `POST /orders/get` {checkoutId}

Reference images: `references/createUpload` → PUT bytes → `references/create` → referenceId.
