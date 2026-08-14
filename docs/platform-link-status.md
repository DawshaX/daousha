# Platform Link Status — XDAW NOVA

Last verified: 2026-08-14. Facebook upgraded to permanent long-lived page token on the same date. TikTok live-mode review submitted on the same date (2026-08-14). Secrets never live in this repo; they stay in the owner's local `.env.local` (owner must copy `secrets.txt` back after every credential rotation).

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

Facebook publishes via Meta Graph API with a **long-lived page token** (verified via debug_token: type PAGE, expires never, scopes include pages_manage_posts) generated from Graph API Explorer then exchanged through app `XDAW NOVA Publisher` (App ID 2828503350861658). Target page is **XDAW NOVA, page ID 1265727539958933**, linked at https://www.facebook.com/1265727539958933 — owned by the owner's personal Facebook account ("محمد ضياء" profile); publishing always goes to the **page**, never to the personal profile. The short-lived Explorer token (1265727539958933_61593031750114 profile.php display form is the same page in some contexts) was converted to long-lived with `fb_longlived2.py`/`fb_finalize.py` and stored in the local secrets file as `FACEBOOK_PAGE_ACCESS_TOKEN` — no expiry. If a future publish ever fails with an OAuth error, run the same exchange scripts with a fresh Explorer user token (rare, roughly every 60 days at worst).

TikTok: app **xDaW NoVa** (App ID 7673768835363145748, production client key `awa32n4co6o1vqbm`, sandbox key `sbawlacpenz2vl9ygx`) is fully configured with Login Kit + Content Posting API and scopes `user.info.basic`, `video.publish`, `video.upload`; Direct Post is enabled (publish straight to the profile via `push_by_file`). Category Education, website and redirect URI point at `https://daousha-vide-nbqlahcj.manus.space/` (callback `/api/integrations/tiktok/callback`), with privacy-policy and ToS pages on the same domain. **Live-mode review submitted on 2026-08-14** at https://developers.tiktok.com/app/7673768835363145748/pending with the end-to-end demo video `xdawnova-tiktok-review-demo-sandbox-live.mp4` and the reason "Submitting for Live Mode review to enable automated publishing of our educational bilingual content via the Content Posting API." Status: Production / **In review**; once approved, re-authorize the owner's real TikTok account through the OAuth flow and publishing becomes fully automatic. Until approval, sandbox publishing remains available with the sandbox client key.

Meta Ads account act_1502752946625950 is disabled; not required for organic launch.
