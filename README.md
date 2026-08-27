# GCC HR Agent (Lua AI take-home)

Production-style HR agent for a 50,000-employee industrial group HQ in Riyadh, with entities in KSA, UAE, Egypt, and Jordan.

Office staff use **web chat**. Field staff use **WhatsApp**. HeyLua is the agent layer. BambooHR is the HRIS. Google Sheets holds daily performance check-ins.

## Setup

```bash
cd ~/works/HR-agent
# copy these files over your empty Lua project, keep lua.skill.yaml agentId/orgId
cp .env.example .env
npm install
npx tsc --noEmit
npm test
lua compile
lua test
lua push all --force --auto-deploy
lua chat
```

Keep `BAMBOOHR_MODE=mock`, `SHEETS_MODE=mock`, `DATA_MODE=mock` until live keys exist.

Then:

```bash
lua env sandbox
lua env production
```

Set the names from `.env.example`. Enable RAG, disable web search:

```bash
lua features enable --feature-name rag
lua features disable --feature-name webSearch
```

## Environment

| Name | Purpose |
| --- | --- |
| `BAMBOOHR_API_KEY` | BambooHR key. Auth header is Basic `apiKey:x` |
| `BAMBOOHR_SUBDOMAIN` | BambooHR company subdomain |
| `BAMBOOHR_MODE` | `mock` or `live` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Sheets service account |
| `PERFORMANCE_SHEET_ID` | Spreadsheet id |
| `SHEETS_MODE` | `mock` or `live` |
| `DATA_MODE` | `mock` uses local `knowledge/` search |
| `HR_ESCALATION_EMAIL` | SOP-gap destination |

## Tools

| Tool | What it does |
| --- | --- |
| `start_onboarding` | Opens `onboarding_cases` + BambooHR checklist |
| `submit_onboarding_document` | Iqama / IBAN / emergency contact |
| `assign_orientation` | Schedule by entity + location |
| `complete_onboarding` | Fails with `MISSING_FIELD` if anything is missing |
| `request_leave` | Balance check, Sun–Thu working days, manager notify |
| `search_sops` | `Data.search` / local overlap over `knowledge/` |
| `get_sop` | Load one markdown SOP |
| `log_sop_gap` | Writes `sop_gaps` + emails HR |
| `submit_team_checkin` | Appends Google Sheet `checkins` rows |
| `weekly_team_performance` | Rollup for a lead such as Ahmad |
| `calculate_gratuity` | Coded EOSB math |
| `check_iqama_expiry` | On-demand Iqama status |

Job: `iqama-expiry-scan` cron `0 7 * * *`.

## Chat examples (same leave request)

Web:

> I need annual leave from 30 Aug to 1 Sep. My employee id is 1002.

WhatsApp (known number `+966500000002`):

> ابي اجازة سنوية من 1 الى 3 سبتمبر

Both call `request_leave`. WhatsApp preprocessor resolves the phone to Fatima Hassan (`1002`). Unknown WhatsApp numbers are asked for an employee number and payroll tools are not called.

## Architecture (10-minute Loom script)

1. Open `src/index.ts`. Show `LuaAgent` persona, three skills, job, preprocessor, postprocessor.
2. Open `src/lib/bamboohr.ts`. Only file that talks to BambooHR. Same TypeScript `Employee` type for live and mock.
3. Open `src/lib/sheets.ts` and `fixtures/checkins.json`.
4. Open `src/lib/rules/leave.ts` and `src/lib/rules/gratuity.ts`. Rules live in TypeScript.
5. Open `src/lib/i18n.ts` and `src/lib/locale.ts`. Arabic letters → `ar`.
6. **Leave from WhatsApp:** inbound channel WhatsApp → `identify-employee` matches phone → `request_leave` loads employee 1002 → working days Sun–Thu → balance from BambooHR mock → if OK, POST time-off + notify manager Ahmad + Arabic confirm → footer “leave / اجازة”.
7. **SOP miss:** `search_sops("mars colony allowance")` scores below 0.7 → `log_sop_gap` → `sop_gaps` row + `HR_ESCALATION_EMAIL`. No invented policy.
8. **Iqama job:** `iqama-expiry-scan` at 07:00 loads employees, `evaluateIqama`, alerts employee + HR in both languages when `daysLeft <= 30`.
9. Show `knowledge/` files and `tests/hr-agent.test.ts` passing `npm test`.

## Tests

```bash
npm test
```

Locked cases: KSA 21/30 entitlement, insufficient balance, pending approval, Arabic locale, KSA 6.5y × 12000 = 48000, salary-certificate SOP hit, mars-colony gap, onboarding without IBAN, Ahmad weekly average, Iqama 10 days → expiring.
