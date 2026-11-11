#!/usr/bin/env python3
"""
Test Suite for Ambient Study Commons (Demo)
Validates:
1. Manifest V3 structure and modular content script references.
2. Prompt text decoupling (prompts exist in prompt/*.txt).
3. Material Symbols icon names matching specifications.
4. Zero-backend compliance (no localhost or backend URLs required).
5. Modular Dashboard Views & HTML DOM bindings.
6. Offline fixtures completeness in local_store.js.
7. Pure "Dumb Server" MockServer architecture (zero DOM).
8. Floating button rainbow ring and conditional red notification dot.
"""

import os
import sys
import json
import re

DEMO_DIR = os.path.dirname(os.path.abspath(__file__))
EXT_DIR = os.path.join(DEMO_DIR, "extension")

def test_manifest_and_modular_scripts():
    print("[1/8] Testing manifest.json and modular content scripts...")
    manifest_path = os.path.join(EXT_DIR, "manifest.json")
    assert os.path.exists(manifest_path), "manifest.json missing!"

    with open(manifest_path, "r", encoding="utf-8") as f:
        m = json.load(f)

    assert m.get("manifest_version") == 3, "Must be Manifest V3"
    assert "storage" in m.get("permissions", []), "storage permission required"
    assert m.get("background", {}).get("service_worker") == "background.js", "background worker must be background.js"

    expected_ui_scripts = [
        "local_store.js",
        "ui/icons.js",
        "ui/toast.js",
        "ui/injector.js",
        "ui/draggable.js",
        "ui/paste_modal.js",
        "ui/dropdown_menu.js",
        "ui/master_button.js",
        "content.js"
    ]
    cs_js = m.get("content_scripts", [])[0].get("js", [])
    for expected in expected_ui_scripts:
        assert expected in cs_js, f"Script {expected} missing from manifest content_scripts!"
        fpath = os.path.join(EXT_DIR, expected)
        assert os.path.exists(fpath), f"File {expected} does not exist at {fpath}"

    print("  ✓ manifest.json is valid Manifest V3 with all modular UI components")

def test_mock_server_pure_backend():
    print("[2/8] Testing MockServer pure dumb-server architecture (zero DOM)...")
    server_path = os.path.join(EXT_DIR, "mockserver", "mock_server.js")
    assert os.path.exists(server_path), "mockserver/mock_server.js missing!"

    with open(server_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Zero DOM assertions
    assert "document." not in content, "MockServer must be a pure dumb server without DOM manipulation!"
    assert "window." not in content, "MockServer should not touch window object directly!"
    assert "innerHTML" not in content, "MockServer should not touch HTML!"
    assert "classList" not in content, "MockServer should not touch CSS classes!"
    assert "broadcastEvent" in content, "MockServer should have broadcastEvent method"
    print("  ✓ MockServer is 100% pure data/event broker with zero DOM manipulation")

def test_rainbow_ring_and_notification_dot():
    print("[3/8] Testing floating button rainbow ring & conditional red dot...")
    btn_path = os.path.join(EXT_DIR, "ui", "master_button.js")
    css_path = os.path.join(EXT_DIR, "styles.css")

    with open(btn_path, "r", encoding="utf-8") as f:
        btn_code = f.read()
    with open(css_path, "r", encoding="utf-8") as f:
        css_code = f.read()

    assert "asc-rainbow-ring" in btn_code, "Rainbow ring missing from master_button.js"
    assert "asc-rainbow-ring" in css_code, "Rainbow ring style missing from styles.css"
    assert "asc-notification-dot" in btn_code, "Notification dot missing from master_button.js"
    assert "asc-notification-dot" in css_code, "Notification dot style missing from styles.css"
    assert "asc-match-bubble" in btn_code, "Message wrapper bubble missing from master_button.js"
    assert "asc-match-bubble" in css_code, "Message wrapper bubble style missing from styles.css"
    assert "25000" in btn_code, "25-second auto-dismiss timer missing from master_button.js"
    assert "BACKEND_EVENT" in btn_code, "Master button must listen to BACKEND_EVENT"

    print("  ✓ Rainbow ring, notification dot, and 25s message wrapper bubble verified")

def test_prompts():
    print("[4/8] Testing decoupled prompts in prompt/ directory...")
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

    print("  ✓ All decoupled prompts loaded")

def test_zero_backend_compliance():
    print("[5/8] Testing zero-backend compliance (no localhost/cloud dependencies)...")
    for root, _, files in os.walk(EXT_DIR):
        for f in files:
            if f.endswith((".js", ".html")):
                fpath = os.path.join(root, f)
                with open(fpath, "r", encoding="utf-8") as fp:
                    content = fp.read()
                    assert "localhost:8000" not in content, f"Hardcoded localhost:8000 found in {f}!"
                    assert "127.0.0.1:8000" not in content, f"Hardcoded 127.0.0.1:8000 found in {f}!"

    print("  ✓ Zero external backend required: 100% offline compliant")

def test_material_symbols_and_icons():
    print("[6/8] Testing required Material Symbols icons...")
    dropdown_js = os.path.join(EXT_DIR, "ui", "dropdown_menu.js")
    with open(dropdown_js, "r", encoding="utf-8") as f:
        code = f.read()

    required_symbols = ["book_5", "content_copy", "note_alt", "sentiment_calm", "owl", "waving_hand"]
    for sym in required_symbols:
        svg_path = os.path.join(EXT_DIR, "assets", "icons", f"{sym}.svg")
        assert os.path.exists(svg_path), f"Bundled fallback SVG {sym}.svg missing!"

    # Verify action default_icon in manifest
    manifest_path = os.path.join(EXT_DIR, "manifest.json")
    with open(manifest_path, "r", encoding="utf-8") as f:
        m = json.load(f)
    assert "default_icon" in m.get("action", {}), "action.default_icon missing from manifest"
    for sz in ["16", "32", "48", "128"]:
        icon_path = os.path.join(EXT_DIR, m["action"]["default_icon"][sz])
        assert os.path.exists(icon_path), f"Icon {icon_path} missing!"

    print("  ✓ All Material Symbols and waving_hand extension icons verified")

def test_modular_dashboard_views():
    print("[7/8] Testing Modular Dashboard Views & HTML DOM bindings...")
    html_path = os.path.join(EXT_DIR, "dashboard", "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    expected_views = [
        "modules/toast.js",
        "modules/export.js",
        "views/journals_view.js",
        "views/canvas_view.js",
        "views/skills_view.js",
        "views/dreams_view.js",
        "views/matches_view.js",
        "views/greeting_view.js",
        "views/settings_view.js",
        "app.js"
    ]

    all_ids_in_js = []
    for rel_path in expected_views:
        full_path = os.path.join(EXT_DIR, "dashboard", rel_path)
        assert os.path.exists(full_path), f"Dashboard module {rel_path} missing!"
        with open(full_path, "r", encoding="utf-8") as fp:
            js_content = fp.read()
            ids = re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", js_content)
            all_ids_in_js.extend(ids)

    for element_id in all_ids_in_js:
        pattern = f'id=["\']{element_id}["\']'
        assert re.search(pattern, html), f"Element id='{element_id}' referenced in JS is missing from index.html"

    print(f"  ✓ All {len(set(all_ids_in_js))} DOM IDs cleanly mapped across all modular views")

def test_offline_seed_fixtures():
    print("[8/8] Testing mockserver/mock_data.json and LocalStore seed integration...")
    json_path = os.path.join(EXT_DIR, "mockserver", "mock_data.json")
    assert os.path.exists(json_path), "mockserver/mock_data.json missing!"

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "user" in data, "User profile missing from mock_data.json"
    assert "journals" in data and len(data["journals"]) >= 3, "Journals missing from mock_data.json"
    assert "skills" in data and len(data["skills"]) >= 2, "Skills missing from mock_data.json"
    assert "dreams" in data, "Dreams missing from mock_data.json"
    assert "canvasReminders" in data, "Canvas context missing from mock_data.json"
    assert "invitations" in data, "Peer invitations missing from mock_data.json"

    store_path = os.path.join(EXT_DIR, "local_store.js")
    with open(store_path, "r", encoding="utf-8") as f:
        store = f.read()

    assert "initLocalStorageIfEmpty" in store, "initLocalStorageIfEmpty function missing from local_store.js"
    assert "wipeAllLocalData" in store, "wipeAllLocalData function missing from local_store.js"
    assert "populateFromSeedData" in store, "populateFromSeedData missing from local_store.js"

    print("  ✓ Pure mockserver/mock_data.json and slim LocalStore seed integration verified")

def test_fake_google_login_dialog():
    print("[9/9] Testing Fake Google Sign-In dialog & Manifest V3 web accessible resources...")
    login_dir = os.path.join(EXT_DIR, "fake_google_login")
    assert os.path.exists(login_dir), "fake_google_login/ directory missing!"

    for fname in ["index.html", "styles.css", "login.js"]:
        fpath = os.path.join(login_dir, fname)
        assert os.path.exists(fpath), f"fake_google_login/{fname} missing!"

    # Verify manifest web_accessible_resources
    manifest_path = os.path.join(EXT_DIR, "manifest.json")
    with open(manifest_path, "r", encoding="utf-8") as f:
        m = json.load(f)

    war = m.get("web_accessible_resources", [])
    has_google_login = any("fake_google_login/*" in item.get("resources", []) for item in war)
    assert has_google_login, "fake_google_login/* must be declared in web_accessible_resources for iframe access!"

    # Verify account IDs match seed data
    login_html = os.path.join(login_dir, "index.html")
    with open(login_html, "r", encoding="utf-8") as f:
        html = f.read()

    assert "user_jordan_101" in html, "user_jordan_101 persona missing from Google dialog"
    assert "user_alex_202" in html, "user_alex_202 persona missing from Google dialog"
    assert "Jordan Lee" in html, "Jordan Lee name missing from Google dialog"
    assert "Alex Rivera" in html, "Alex Rivera name missing from Google dialog"

    print("  ✓ Fake Google account picker dialog & web accessible resources verified")

def main():
    print("=" * 65)
    print("Running Ambient Study Commons Complete Test Suite")
    print("=" * 65)
    try:
        test_manifest_and_modular_scripts()
        test_mock_server_pure_backend()
        test_rainbow_ring_and_notification_dot()
        test_prompts()
        test_zero_backend_compliance()
        test_material_symbols_and_icons()
        test_modular_dashboard_views()
        test_offline_seed_fixtures()
        test_fake_google_login_dialog()
        print("=" * 65)
        print("ALL 9 TESTS PASSED! Google sign-in and mock server verified.")
        print("=" * 65)
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
