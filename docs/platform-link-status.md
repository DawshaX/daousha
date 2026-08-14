# Platform Link Status — XDAW NOVA

Last verified: 2026-08-14. Secrets never live in this repo; they stay in the owner's local `.env.local` (owner must copy `secrets.txt` back after every credential rotation).

## First multi-platform publish (2026-08-14)

Episode 1 — "دماغك يعمل على ثلث طاقته فقط! 3 حقائق صادمة" was published to three platforms in a single run:

| Platform | Public URL | Verified |
|---|---|---|
| YouTube | https://www.youtube.com/watch?v=KsPu75budwA | Yes — public, channel xDaw_NoVa |
| Instagram | https://www.instagram.com/reel/DcB9PhLiYxg/ | Yes — reel on @xdaw_nova via Manus Instagram connector |
| Facebook | https://www.facebook.com/reel/29350563061210067/ | Yes — reel on page XDAW NOVA (page ID 1265727539958933) |

## Connection notes

YouTube publishing uses a refresh token obtained via the project OAuth client `276755111100-7ll905jqkefcbanqrqnvm1p4ogl5n229` (project `xdaw-nova`). Redirect URI `https://8899-ivfx0jnsfhm4lb21x07io-ae1265fb.sg1.manus.computer/callback` was registered on that client in 2026-08-14 and works; re-authorize there if the refresh token is ever revoked.

Instagram is connected through the Manus Instagram connector (account @xdaw_nova) and publishes reels without needing the Meta app to be in live mode.

Facebook publishes via Meta Graph API with a page token generated from Graph API Explorer (app `XDAW NOVA Publisher`, App ID 2828503350861658, user-scoped token with pages_manage_posts + friends permissions). The token is short-lived relative to the user session: **regenerate from the Explorer when the user logs out/in** and paste the new value into the local secrets file.

TikTok (App ID 7673768835363145748) remains sandbox-only; live-mode review pending at developers.tiktok.com.

Meta Ads account act_1502752946625950 is disabled; not required for organic launch.
