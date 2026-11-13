#!/usr/bin/env python3
"""INDIO auto-poster: puts each episode on the Facebook Page at its slot in schedule.csv.

Commands:  run | dry-run | check | reschedule YYYY-MM-DD
Env:       FB_PAGE_ID, FB_PAGE_TOKEN, VIDEO_BASE_URL, POST_MODE (schedule|now), FB_API_VERSION (optional)
"""
import csv, datetime as dt, json, os, pathlib, sys, tempfile, time

HERE = pathlib.Path(__file__).resolve().parent
SCHEDULE = HERE / "schedule.csv"
STATE = HERE / "state" / "posted.json"
PH = dt.timezone(dt.timedelta(hours=8))          # Asia/Manila, no daylight saving
LOOKAHEAD = dt.timedelta(hours=30)               # schedule mode: hand over this far ahead
MIN_LEAD = dt.timedelta(minutes=15)              # Facebook needs at least 10 minutes
EARLY = dt.timedelta(minutes=20)                 # now mode: may post this early
LATE = dt.timedelta(hours=6)                     # after this, a slot counts as missed
COMMENT_AFTER = dt.timedelta(minutes=5)

GRAPH = os.environ.get("FB_GRAPH_URL", "https://graph.facebook.com")
GRAPH_VIDEO = os.environ.get("FB_GRAPH_VIDEO_URL", "https://graph-video.facebook.com")
VER = os.environ.get("FB_API_VERSION", "").strip("/")


def api(base, path):
    return f"{base}/{VER}/{path}" if VER else f"{base}/{path}"


def now_utc():
    fake = os.environ.get("INDIO_NOW")           # for tests: 2026-11-14T10:00:00+00:00
    return dt.datetime.fromisoformat(fake) if fake else dt.datetime.now(dt.timezone.utc)


def load_schedule():
    rows = []
    with open(SCHEDULE, encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            n = int(r["episode"])
            d = dt.date.fromisoformat(r["petsa"])
            h, m = map(int, r["oras_PH"].split(":"))
            rows.append({"n": n, "title": r["pamagat"], "due": dt.datetime(d.year, d.month, d.day, h, m, tzinfo=PH)})
    return sorted(rows, key=lambda r: r["n"])


def load_state():
    return json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}


def save_state(state):
    STATE.parent.mkdir(exist_ok=True)
    STATE.write_text(json.dumps(state, indent=1, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")


def text_of(folder, n):
    p = HERE / folder / f"ep{n:02d}.txt"
    return p.read_text(encoding="utf-8").strip() if p.exists() else ""


def fb_error(resp):
    try:
        e = resp.json().get("error", {})
        return f"HTTP {resp.status_code}: {e.get('message')} (code {e.get('code')}, subcode {e.get('error_subcode')})"
    except Exception:
        return f"HTTP {resp.status_code}: {resp.text[:300]}"


def download(url, dest):
    import requests
    with requests.get(url, stream=True, timeout=120) as r:
        if r.status_code == 404:
            return False
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(1 << 20):
                f.write(chunk)
    return os.path.getsize(dest) > 100_000


def upload(page, token, path, title, caption, publish_at=None):
    import requests
    data = {"access_token": token, "title": title[:250], "description": caption}
    if publish_at is not None:
        data.update(published="false", scheduled_publish_time=str(int(publish_at.timestamp())))
    with open(path, "rb") as f:
        r = requests.post(api(GRAPH_VIDEO, f"{page}/videos"), data=data,
                          files={"source": (os.path.basename(path), f, "video/mp4")}, timeout=1800)
    if r.status_code != 200 or "id" not in r.json():
        raise RuntimeError(fb_error(r))
    return r.json()["id"]


def comment(token, video_id, message):
    import requests
    r = requests.post(api(GRAPH, f"{video_id}/comments"), data={"access_token": token, "message": message}, timeout=60)
    if r.status_code != 200:
        raise RuntimeError(fb_error(r))


def page_token(page, token):
    """Accepts a Page token, or a user / system-user token that manages the Page, and returns a Page token."""
    import requests
    r = requests.get(api(GRAPH, "me"), params={"fields": "id,name", "access_token": token}, timeout=60)
    if r.status_code != 200:
        sys.exit("Token check failed. " + fb_error(r))
    me = r.json()
    if str(me.get("id")) == str(page):
        print(f"Page token for: {me.get('name')}")
        return token
    r = requests.get(api(GRAPH, str(page)), params={"fields": "name,access_token", "access_token": token}, timeout=60)
    if r.status_code != 200 or "access_token" not in r.json():
        sys.exit(f"The token belongs to '{me.get('name')}' and cannot get a Page token for FB_PAGE_ID. "
                 "Give it the Page (full control) and the pages_* permissions. " + (fb_error(r) if r.status_code != 200 else ""))
    print(f"Token of '{me.get('name')}' exchanged for the Page token of: {r.json().get('name')}")
    return r.json()["access_token"]


def reschedule(start):
    rows = list(csv.DictReader(open(SCHEDULE, encoding="utf-8-sig", newline="")))
    days = ["Lun", "Mar", "Miy", "Huw", "Biy", "Sab", "Lin"]
    for r in rows:
        d = start + dt.timedelta(days=(int(r["episode"]) - 1) // 2)
        r["petsa"], r["araw"] = d.isoformat(), days[d.weekday()]
    with open(SCHEDULE, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)
    print(f"Episode 1 now starts {start}; Episode {rows[-1]['episode']} is on {rows[-1]['petsa']}.")


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "run"
    if cmd == "reschedule":
        return reschedule(dt.date.fromisoformat(sys.argv[2]))
    dry = cmd == "dry-run"
    page, token = os.environ.get("FB_PAGE_ID", ""), os.environ.get("FB_PAGE_TOKEN", "")
    base = os.environ.get("VIDEO_BASE_URL", "").rstrip("/")
    mode = os.environ.get("POST_MODE", "schedule")
    if not dry and not (page and token):
        sys.exit("Missing FB_PAGE_ID or FB_PAGE_TOKEN (repository secrets).")
    if not dry:
        token = page_token(page, token)
    if cmd == "check":
        return print("OK: ready to post to this Page.")
    if not base:
        sys.exit("Missing VIDEO_BASE_URL.")

    state, now, problems = load_state(), now_utc(), []
    print(f"Now: {now.astimezone(PH):%Y-%m-%d %H:%M} PH | mode: {mode}{' | DRY RUN' if dry else ''}")

    for ep in load_schedule():
        key, due = f"{ep['n']:02d}", ep["due"]
        if key in state:
            continue
        if now > due + LATE:
            problems.append(f"Episode {ep['n']} MISSED its slot ({due:%d %b %H:%M} PH). Not posted. Use 'reschedule' or post it by hand.")
            continue
        if mode == "schedule":
            ready = due - now <= LOOKAHEAD
        else:
            ready = now >= due - EARLY
        if not ready:
            continue
        caption = text_of("captions", ep["n"])
        if not caption:
            problems.append(f"Episode {ep['n']}: no caption file."); continue
        url = f"{base}/ep{ep['n']:02d}.mp4"
        publish_at = due if (mode == "schedule" and due - now >= MIN_LEAD) else None
        when = f"scheduled for {due:%d %b %H:%M} PH" if publish_at else "published now"
        if dry:
            print(f"[dry] Episode {ep['n']} '{ep['title']}' <- {url} -> {when}"); continue
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, f"ep{ep['n']:02d}.mp4")
            try:
                if not download(url, path):
                    problems.append(f"Episode {ep['n']} (due {due:%d %b %H:%M} PH): video not found at {url}"); continue
                vid = upload(page, token, path, f"INDIO Episode {ep['n']}: {ep['title']}", caption, publish_at)
            except Exception as e:
                problems.append(f"Episode {ep['n']}: {e}"); continue
        state[key] = {"video_id": vid, "due": due.isoformat(), "how": when, "at": now.isoformat(timespec="seconds")}
        save_state(state)
        print(f"Episode {ep['n']}: {when} (video id {vid})")
        time.sleep(5)

    # Sources comment, once the post is live. Never fatal.
    if not dry:
        for key, s in sorted(state.items()):
            msg = text_of("comments", int(key))
            if s.get("comment") or not msg or now < dt.datetime.fromisoformat(s["due"]) + COMMENT_AFTER:
                continue
            try:
                comment(token, s["video_id"], msg)
                s["comment"] = "done"
                print(f"Episode {int(key)}: sources comment added")
            except Exception as e:
                s["comment_tries"] = s.get("comment_tries", 0) + 1
                if s["comment_tries"] >= 3:
                    s["comment"] = "gave up"
                print(f"Episode {int(key)}: comment not added ({e})")
            save_state(state)

    done = len(state)
    print(f"Handed to Facebook so far: {done} of 50.")
    if problems:
        print("\nPROBLEMS:\n- " + "\n- ".join(problems))
        sys.exit(1)


if __name__ == "__main__":
    main()
