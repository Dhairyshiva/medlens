# MedLens: Personal Health Record Intelligence Engine

**wHACKiest 2026 | Track 3: Know Thyself**

MedLens reads your scattered lab reports and prescriptions, connects them across time and across doctors, and explains what deserves attention. Everything runs in the browser, so your records never leave your device.

> MedLens does not diagnose. It helps you ask better questions.

## Problem

Health records are spread across labs and hospitals in different formats and read one at a time. So:
- A "normal" value can be rising toward a danger line and nobody sees it.
- Two doctors can prescribe interacting medicines without knowing about each other.
- Missing or mis-scanned values go unnoticed.

Most AI tools fix this by uploading reports to the cloud. MedLens doesn't.

## How it works

Upload report → on-device OCR → extract values, units, ranges, drugs, doses → completeness check → trend projection and interaction check → plain-language timeline.

## Features

- On-device OCR and extraction (no server, no data upload)
- Missing-parameter check per test panel (e.g. LDL absent from a lipid profile)
- Trend projection: flags "normal" values heading toward a threshold
- Cross-doctor drug-interaction alerts
- "What to ask your doctor" summary

## Tech stack

React, Tailwind CSS, Recharts, Tesseract.js, JavaScript (regression and rule engines), browser local storage.

## Demo data

All data is synthetic. Demo patient Rohan Mehta (45 M) has three planted findings:
1. HbA1c 5.0 → 5.3 → 5.6 (all in range), projected to cross 5.7 soon
2. Atorvastatin + Clarithromycin from two different doctors
3. June lipid report missing LDL

## Run

```bash
npm install
npm run dev
```

Click **Load demo patient**, or upload files from `/sample-data`.

## Limitations

- OCR is tuned for clean synthetic reports, and noisy photos are less accurate.
- The interaction table is a small demo rule set, not a clinical database.
- It does not verify report authenticity and is not a medical device.

## Roadmap

ONNX/TFLite medical NER, a licensed drug-interaction dataset, more lab layouts and languages, offline mobile app.

## Team

_Team name, members, college_
