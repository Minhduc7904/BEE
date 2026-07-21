# Bank Transfer Reconciliation

`BankTransferTransaction` has two independent status fields:

- `processingStatus`: technical matching outcome: `RECEIVED`, `MATCHED`, `UNMATCHED`, `AMOUNT_MISMATCH`, `IGNORED`, or `ERROR`.
- `reconciliationStatus`: business reconciliation source:
  - `UNRECONCILED`: not reconciled yet.
  - `AUTOMATIC`: reconciled automatically by the verified SePay webhook.
  - `ADMIN`: reconciled manually by an administrator.

## SePay transfer content

The webhook supports the payment instruction format:

```text
{attemptCode} TP{tuitionPaymentId} HS{studentName} {parentPhone}
```

Example:

```text
HP7A82F TP201 HSNGUYEN VAN A 0901234567
```

When this format is present, the webhook reads only `attemptCode` and `TP<id>`; it does not parse or validate the optional `HS` and phone-number segments. If SePay also supplies `code`, it must match. `TP<id>` must equal the payment intent's tuition-payment ID before auto-confirmation can proceed. A mismatch remains stored for review and is not auto-confirmed. The new format uses spaces only, without `|` or `:`; the webhook still accepts the legacy format for unexpired QR codes already issued.

Successful auto matching sets `processingStatus: MATCHED` and `reconciliationStatus: AUTOMATIC`.

## Manual reconciliation

`POST /api/tuition-payments/:id/confirm-manual-payment` accepts this optional body field:

```json
{
  "bankTransferTransactionIds": [91, 92]
}
```

Each selected bank transaction must be `UNRECONCILED` and identify exactly one active receiving bank account. The manual policy intentionally does not require an individual amount or the total selected amount to equal the tuition payment. The backend first reuses a non-expired pending manual attempt for the same intent when one exists; otherwise it creates a manual `PaymentAttempt` with `SUCCEEDED`. It then marks each selected bank transaction `MATCHED` plus `reconciliationStatus: ADMIN`. Duplicate IDs and transactions attached to automatic attempts are rejected; any failure rolls back the whole action. The admin action is audited.

`POST /api/tuition-payments/:id/unreconcile-manual-payment` reverses a paid tuition payment to `UNPAID` and its intent to `PENDING`. It does not delete bank transaction history: each attached transaction is released by clearing `paymentAttemptId`, setting `processingStatus: RECEIVED`, and setting `reconciliationStatus: UNRECONCILED`.

`PUT /api/tuition-payments/:id/manual-reconciliation` replaces the selected bank transaction list for an already paid tuition payment. Omitted old transactions are released with the same `RECEIVED`/`UNRECONCILED` transition; new transactions follow the manual attempt reuse/create rule above.
