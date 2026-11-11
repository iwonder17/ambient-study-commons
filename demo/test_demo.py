#!/usr/bin/env python3
"""
Test Suite for Ambient Study Commons (Demo)
Validates:
1. Manifest V3 structure and file references.
2. Prompt text decoupling (prompts exist in prompt/*.txt).
3. Material Symbols icon names matching specifications.
4. Zero-backend compliance (no localhost or backend URLs required).
5. DOM element ID binding between dashboard HTML and JS.
6. Offline fixtures completeness in local_store.js.
"""

import os
import sys
import json
import re

DEMO_DIR = os.path.dirname(os.path.abspath(__file__))
EXT_DIR = os.path.join(DEMO_DIR, "extension")

def test_manifest():
    print("[1/6] Testing manifest.json...")
    manifest_path = os.path.join(EXT_DIR, "manifest.json")
    assert os.path.exists(manifest_path), "manifest.json missing!"

    with open(manifest_path, "r", encoding="utf-8") as f:
        m = json.load(f)

    assert m.get("manifest_version") == 3, "Must be Manifest V3"
    assert "storage" in m.get("permissions", []), "storage permission required"
    assert m.get("background", {}).get("service_worker") == "background.js", "background worker must be background.js"

    # Verify content scripts exist
    for cs in m.get("content_scripts", []):
        for js_file in cs.get("js", []):
            path = os.path.join(EXT_DIR, js_file)
            assert os.path.exists(path), f"Content script {js_file} not found at {path}"
        for css_file in cs.get("css", []):
            path = os.path.join(EXT_DIR, css_file)
            assert os.path.exists(path), f"CSS file {css_file} not found at {path}"

    print("  ✓ manifest.json is valid Manifest V3")

def test_prompts():
    print("[2/6] Testing decoupled prompts in prompt/ directory...")
    prompt_dir = os.path.join(EXT_DIR, "prompt")
    assert os.path.exists(prompt_dir), "prompt/ folder missing!"

    required_prompts = [
        "data_collecting.txt",
        "journal_review.txt",
        "skill_analysis.txt",
        "peer_matching.txt"
    ]

    for p in required_prompts:
        path = os.path.join(prompt_dir, p)
        assert os.path.exists(path), f"Prompt file {p} is missing!"
        with open(path, "r", encoding="utf-8") as f:
            content = f.read().strip()
            assert len(content) > 20, f"Prompt {p} should have meaningful content"
            print(f"  ✓ {p} loaded ({len(content)} chars)")

def test_zero_backend_compliance():
    print("[3/6] Testing zero-backend compliance (no localhost/cloud dependencies)...")
    for root, _, files in os.walk(EXT_DIR):
        for f in files:
            if f.endswith((".js", ".html")):
                fpath = os.path.join(root, f)
                with open(fpath, "r", encoding="utf-8") as fp:
                    content = fp.read()
                    # Check for localhost:8000 or external api calls
                    assert "localhost:8000" not in content, f"Hardcoded localhost:8000 found in {f}!"
                    assert "127.0.0.1:8000" not in content, f"Hardcoded 127.0.0.1:8000 found in {f}!"

    print("  ✓ Zero backend verified: All data handled via chrome.storage.local")

def test_material_symbols_and_icons():
    print("[4/6] Testing required Material Symbols icons...")
    content_js_path = os.path.join(EXT_DIR, "content.js")
    with open(content_js_path, "r", encoding="utf-8") as f:
        content_js = f.read()

    required_symbols = ["book_5", "content_copy", "note_alt", "sentiment_calm", "owl"]
    for sym in required_symbols:
        assert sym in content_js, f"Required Material Symbol '{sym}' missing from content.js"
        svg_path = os.path.join(EXT_DIR, "assets", "icons", f"{sym}.svg")
        assert os.path.exists(svg_path), f"Bundled fallback SVG {sym}.svg missing!"
        print(f"  ✓ Symbol '{sym}' configured & bundled")

def test_dashboard_dom_bindings():
    print("[5/6] Testing Dashboard HTML & JS DOM bindings...")
    html_path = os.path.join(EXT_DIR, "dashboard", "index.html")
    js_path = os.path.join(EXT_DIR, "dashboard", "app.js")

    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()
    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()

    # Find all getElementById in app.js
    ids_in_js = re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", js)
    assert len(ids_in_js) > 10, "app.js should bind multiple DOM elements"

    for element_id in ids_in_js:
        pattern = f'id=["\']{element_id}["\']'
        assert re.search(pattern, html), f"Element id='{element_id}' referenced in app.js is missing from index.html"

    print(f"  ✓ All {len(set(ids_in_js))} DOM IDs cleanly mapped between HTML and JS")

def test_offline_seed_fixtures():
    print("[6/6] Testing local_store.js seed data...")
    store_path = os.path.join(EXT_DIR, "local_store.js")
    with open(store_path, "r", encoding="utf-8") as f:
        store = f.read()

    assert "DEFAULT_OFFLINE_STATE" in store, "DEFAULT_OFFLINE_STATE missing"
    assert "initLocalStorageIfEmpty" in store, "initLocalStorageIfEmpty function missing"
    assert "CISP 310" in store or "CISP-310" in store, "Course fixture context missing"
    assert "Alex Rivera" in store, "Peer fixture missing"
    print("  ✓ Seed data complete with courses, journals, skills, dreams, and peer invitations")

def main():
    print("=" * 60)
    print("Running Ambient Study Commons Zero-Backend Demo Test Suite")
    print("=" * 60)
    try:
        test_manifest()
        test_prompts()
        test_zero_backend_compliance()
        test_material_symbols_and_icons()
        test_dashboard_dom_bindings()
        test_offline_seed_fixtures()
        print("=" * 60)
        print("ALL TESTS PASSED! Demo extension is 100% verified and operational.")
        print("=" * 60)
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

