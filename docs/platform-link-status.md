# Platform Link Status — XDAW NOVA

Last verified: 2026-08-14. Secrets never live in this repo; they stay in the owner's local `.env.local`.

| Platform | OAuth code | Live credentials in .env.local | Test publish done | Public publishing allowed |
|---|---|---|---|---|
| YouTube | server/youtubeOAuth.ts + youtubePublisher.ts | Yes (verified: Signal Zero uploaded 2026-08-13) | Yes | Yes |
| Telegram | server/telegram.ts | Yes (verified: test message delivered 2026-08-14) | N/A (notifications) | Yes |
| Instagram | Meta Graph via facebookOAuth | Yes (account @xdaw_nova connected via connector) | No | Needs Meta app live-mode permissions (instagram_business_content_publish) |
| Facebook | server/facebookPageToken + facebookPublisher | Yes (page access token available) | No | Needs live-mode app review; organic test possible with current token |
| TikTok | server/tiktokOAuth.ts | Yes (App ID 7673768835363145748) | No | App is Sandbox only; needs Live Mode review at developers.tiktok.com |

Notes: Meta Ads account act_1502752946625950 is disabled; not required for organic launch. TikTok Content Posting API live approval typically takes 10 hours to a few weeks.
