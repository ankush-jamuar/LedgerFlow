# LedgerFlow Import Report

## Source File

Expenses Export(1).csv

## Report Type

CSV Import Validation & Anomaly Analysis Report

## Analysis Date

June 2026

---

# Import Summary

| Metric                | Value        |
| --------------------- | ------------ |
| Total Rows Analyzed   | 42           |
| Valid Rows            | 36           |
| Rows Requiring Review | 6            |
| Anomalies Detected    | 8 Categories |

---

# Detected Anomalies & Actions Taken

## 1. Missing Payer Information

### Row Details

| Description             |
| ----------------------- |
| House cleaning supplies |

### Issue

The `paid_by` field is empty.

### Action Taken

* Row flagged for review.
* Expense cannot be attributed to a member.
* Import should reject the row until a valid payer is provided.

---

## 2. Missing Split Type

### Row Details

| Description           |
| --------------------- |
| Rohan paid Aisha back |

### Issue

The `split_type` field is missing.

### Action Taken

* Validation failure generated.
* Row flagged for manual review.

---

## 3. Missing Currency

### Row Details

| Description     |
| --------------- |
| Groceries DMart |

### Issue

Currency value is missing.

### Action Taken

* Generated MISSING_CURRENCY anomaly.
* Row requires correction before import.

---

## 4. Negative Amount

### Row Details

| Description        | Amount |
| ------------------ | ------ |
| Parasailing refund | -30    |

### Issue

Expense amount is negative.

### Action Taken

* Generated NEGATIVE_AMOUNT anomaly.
* Row rejected from expense import.

---

## 5. Zero Amount Transaction

### Row Details

| Description         | Amount |
| ------------------- | ------ |
| Dinner order Swiggy | 0      |

### Issue

Transaction amount is zero.

### Action Taken

* Validation failure generated.
* Row excluded from import processing.

---

## 6. Settlement Recorded as Expense

### Row Details

| Description           |
| --------------------- |
| Rohan paid Aisha back |

### Issue

The transaction represents repayment activity rather than a shared expense.

### Action Taken

* Generated SETTLEMENT_AS_EXPENSE anomaly.
* Flagged for manual review.

---

## 7. Identity Normalization Issues

### Observed Values

* Priya
* priya
* Priya S
* Rohan
* rohan

### Issue

Inconsistent naming may create duplicate user matches.

### Action Taken

* Names require normalization before member resolution.
* Flagged for identity review.

---

## 8. Multi-Currency Dataset

### Detected Currencies

* INR
* USD

### Issue

Transactions exist in multiple currencies.

### Action Taken

* Currency-aware processing required.
* Exchange-rate conversion must occur before consolidated balance calculations.

---

# Final Outcome

The CSV file contains valid financial data but also includes multiple data-quality issues requiring validation before ingestion.

The following anomaly categories were identified:

* MISSING_PAYER
* MISSING_SPLIT_TYPE
* MISSING_CURRENCY
* NEGATIVE_AMOUNT
* ZERO_AMOUNT
* SETTLEMENT_AS_EXPENSE
* IDENTITY_NORMALIZATION_REQUIRED
* MULTI_CURRENCY_DATASET

These anomalies were documented to ensure auditability and safe financial processing before records are committed to the LedgerFlow database.

---

# Notes

This report was generated during CSV validation and QA analysis of the provided assignment dataset. Identified anomalies were reviewed and mapped to the validation and anomaly-detection rules implemented within LedgerFlow.
