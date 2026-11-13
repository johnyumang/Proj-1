# INDIO auto-poster (libre)

Naglalabas ng dalawang episode kada araw sa Facebook page: **7:00 PM** at **11:00 PM**, oras sa Pilipinas, ayon sa `schedule.csv` (50 episode, 25 araw).

Walang bayad: GitHub Actions ang timer, GitHub Releases ang lalagyan ng video, at ang opisyal na Graph API ng Facebook ang nagpo-post.

## Paano ito gumagana

1. Tuwing tatlong oras, tumatakbo ang `.github/workflows/indio-post.yml`.
2. Hinahanap ng `post.py` ang mga episode na lalabas sa susunod na 30 oras at hindi pa naipapasa.
3. Dina-download nito ang `epNN.mp4`, ina-upload sa page kasama ang caption sa `captions/epNN.txt`, at ipinapa-schedule sa Facebook sa eksaktong oras. Facebook na ang maglalabas, kaya hindi apektado ng pagkaantala ng GitHub.
4. Pagkalabas ng post, idinadagdag ang sources comment mula sa `comments/epNN.txt`.
5. Itinatala ang bawat naipasa sa `state/posted.json`, kaya walang madodoble.

Kapag walang video ang isang episode o tumanggi ang Facebook, **pula ang run** at mag-e-email ang GitHub. Ang episode na lumampas nang 6 na oras sa oras nito ay hindi na ipo-post nang kusa.

## Isang beses na set-up

### A. Facebook token (sa Business settings, hindi nag-e-expire)
1. Sa developers.facebook.com, gumawa ng app (My Apps → Create app, uri: Business) at ikabit ito sa business portfolio mo. Ilipat ito sa **Live** mode (kailangan ng privacy policy URL); sa Development mode, mga may role lang sa app ang nakakakita ng post.
2. Sa business.facebook.com/settings → **Users → System users** → **Add**: pangalan `indio-poster`, role **Admin**.
3. Piliin ang system user → **Assign assets** → **Pages** → History Indio → **Full control**. Idagdag din ang app sa ilalim ng **Apps** (Full control).
4. **Generate token** → piliin ang app → expiration **Never** → mga permission: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `pages_manage_engagement` → Generate. Kopyahin agad; minsan lang ito ipinapakita.
5. Kunin ang Page ID: Business settings → Accounts → Pages → History Indio (ang numero sa ilalim ng pangalan).

Ang token ng system user ay kusang ipinagpapalit ng script sa Page token, kaya iyon na mismo ang ilalagay sa `FB_PAGE_TOKEN`.

### B. GitHub
1. Settings → Secrets and variables → Actions → **New repository secret**: `FB_PAGE_ID` at `FB_PAGE_TOKEN`. Huwag ilagay ang token saanman maliban dito.
2. Releases → **Draft a new release** → tag na `indio-videos` → i-drag ang mga MP4 na pinangalanang `ep01.mp4` … `ep50.mp4` → Publish. Puwedeng dagdagan ang release kahit kailan (Edit → i-drag ang bagong file).
3. Actions → **INDIO auto-post** → Run workflow → `check` para subukan ang token, tapos `dry-run` para makita ang ipo-post.

Pampubliko ang repo na ito, kaya mapapanood ng may link ang mga video sa release bago pa lumabas. Kung ayaw mo niyon, ilagay ang mga video sa ibang lugar at itakda ang variable na `VIDEO_BASE_URL`.

## Mga setting (Settings → Secrets and variables → Actions → Variables; opsyonal lahat)

| Variable | Default | Gamit |
|---|---|---|
| `VIDEO_BASE_URL` | release na `indio-videos` ng repo na ito | Saan kukunin ang `epNN.mp4` (hal. isang R2 public URL) |
| `POST_MODE` | `schedule` | `now` = mag-post mismo sa oras sa halip na ipa-schedule sa Facebook; gamitin kung tumanggi ang Facebook sa schedule |
| `FB_API_VERSION` | wala | Hal. `v23.0`, kung kailangang i-pin ang bersyon ng API |

## Paglipat ng petsa

```bash
python indio-poster/post.py reschedule 2026-11-20
```

Inililipat nito ang Episode 1 sa petsang iyon at sinusundan ng iba; i-commit ang nabagong `schedule.csv`.

## Hindi pa nasusubok

Nasubok ang lohika laban sa pekeng server, hindi pa sa totoong Facebook. Sa unang totoong takbo, tingnan sa Meta Business Suite (Content → Scheduled) kung lumitaw ang Episode 1 at 2 sa tamang oras. Mahigit 90 segundo ang mga episode, kaya ordinaryong video upload ang gamit, hindi ang Reels API.
