# Build notes

1. Keep `CaseSolution` separate from `MysteryCase`. Do not add culprit IDs to public case DTOs.
2. Validate every AI response before saving. Never trust model-generated IDs or array counts without checking them.
3. Store uploaded media in object storage before production deployment.
4. Add case ownership/session tokens and rate limiting before exposing the API publicly.
5. Add automated tests for clue idempotency, hint count, accusation validation, scoring and spoiler protection.
