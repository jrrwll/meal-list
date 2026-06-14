#!/usr/bin/env python3
"""
backup sqlite and images, output to backup/backup_yyyyMMdd.zip
"""

import json
import os
import re
import shutil
import sqlite3
import sys
import urllib.request
from datetime import datetime
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

DB_FILE = "api/meal-list.db"
IMAGES_DIR = "api/images"
BACKUP_DIR = "backup"


def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)


def backup():
    today = datetime.now().strftime("%Y%m%d")
    work_dir = Path(BACKUP_DIR) / f"backup_{today}"
    zip_path = Path(BACKUP_DIR) / f"backup_{today}.zip"

    if zip_path.exists():
        print(f"[skip] {zip_path} already exists")
        return

    if work_dir.exists():
        shutil.rmtree(work_dir)
    ensure_dir(work_dir)

    # 1. copy db
    db_src = Path(DB_FILE)
    db_dst = work_dir / "meal-list.db"
    print(f"[copy] {db_src} -> {db_dst}")
    shutil.copy2(db_src, db_dst)

    # 2. copy images dir
    img_src = Path(IMAGES_DIR)
    img_dst = work_dir / "images"
    if img_src.is_dir():
        print(f"[copy] {img_src} -> {img_dst}")
        shutil.copytree(img_src, img_dst, dirs_exist_ok=True)
    else:
        ensure_dir(img_dst)
        print("[warn] images source dir not found, created empty")

    # 3. open backup db
    conn = sqlite3.connect(str(db_dst))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cols = [r[1] for r in cur.execute("PRAGMA table_info(file)").fetchall()]

    # 4. phase 1: copy local files
    if "hosting_file" in cols:
        rows = cur.execute(
            "SELECT id, url, filename FROM file WHERE hosting_file = ''"
        ).fetchall()
    else:
        rows = cur.execute("SELECT id, url, filename FROM file").fetchall()

    print(f"[phase1] {len(rows)} local file records")
    for r in rows:
        src_file = img_src / r["url"].lstrip("/")
        dst_file = img_dst / r["url"].lstrip("/")
        if src_file.is_file():
            if not dst_file.is_file():
                ensure_dir(dst_file.parent)
                shutil.copy2(src_file, dst_file)
        else:
            print(f"  [warn] missing {src_file}")

    # 5. phase 2: download hosting files + build url mapping
    url_to_local: dict[str, str] = {}

    hosting_rows = []
    if "hosting_file" in cols:
        hosting_rows = cur.execute(
            "SELECT id, url, filename FROM file WHERE hosting_file != ''"
        ).fetchall()

    print(f"[phase2] {len(hosting_rows)} hosting file records")
    for r in hosting_rows:
        remote_url = r["url"]
        print(f"  download {remote_url}")
        try:
            req = urllib.request.Request(
                remote_url, headers={"User-Agent": "meal-list-backup/1.0"}
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
        except Exception as e:
            print(f"  [fail] {e}")
            continue

        filename = Path(r["filename"])
        ext = filename.suffix.lower().lstrip(".")
        if not ext:
            ext = "jpg"
        local_rel = f"/{today}/{r['id']}.{ext}"
        local_path = img_dst / local_rel.lstrip("/")
        ensure_dir(local_path.parent)
        local_path.write_bytes(data)
        print(f"  saved {local_rel} ({len(data)} bytes)")

        # record mapping: old url → new local path
        url_to_local[remote_url] = local_rel

        # update file.url in backup db
        cur.execute("UPDATE file SET url = ? WHERE id = ?", (local_rel, r["id"]))

    conn.commit()

    # 6. phase 3: migrate meal.images http URLs
    meal_rows = cur.execute("SELECT id, images FROM meal").fetchall()
    updated_meals = 0

    for m in meal_rows:
        try:
            imgs: list[str] = json.loads(m["images"])
        except (json.JSONDecodeError, TypeError):
            continue

        changed = False
        new_imgs = []
        for img_url in imgs:
            if img_url.startswith("http://") or img_url.startswith("https://"):
                if img_url in url_to_local:
                    new_local = url_to_local[img_url]
                    new_imgs.append(new_local)
                    changed = True
                    print(f"  meal {m['id']}: {img_url} -> {new_local}")
                else:
                    new_imgs.append(img_url)
                    print(f"  [warn] meal {m['id']}: no mapping for {img_url}")
            else:
                new_imgs.append(img_url)

        if changed:
            cur.execute(
                "UPDATE meal SET images = ? WHERE id = ?",
                (json.dumps(new_imgs, ensure_ascii=False), m["id"]),
            )
            updated_meals += 1

    conn.commit()
    print(f"[phase3] updated {updated_meals} meal records")
    conn.close()

    # 7. package zip
    print(f"[pack] {zip_path}")
    with ZipFile(zip_path, "w", ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(work_dir):
            for fname in files:
                fpath = Path(root) / fname
                arcname = fpath.relative_to(work_dir)
                zf.write(fpath, arcname)

    print(f"[done] {zip_path}")


if __name__ == "__main__":
    backup()
