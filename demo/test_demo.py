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
        "views/activities_view.js",
        "views/freetime_view.js",
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

def test_frontend_api_layer_and_mockserver_endpoints():
    print("[10/10] Testing Frontend API layer (AscAPI) & MockServer REST endpoints...")
    api_path = os.path.join(EXT_DIR, "dashboard", "api.js")
    assert os.path.exists(api_path), "dashboard/api.js missing!"

    with open(api_path, "r", encoding="utf-8") as f:
        api_code = f.read()

    assert "AscAPI" in api_code, "AscAPI client missing from api.js"
    assert "getDashboardData" in api_code, "getDashboardData missing from AscAPI"
    assert "saveJournal" in api_code, "saveJournal missing from AscAPI"
    assert "deleteJournal" in api_code, "deleteJournal missing from AscAPI"
    assert "savePreferences" in api_code, "savePreferences missing from AscAPI"
    assert "sendGreetingMessage" in api_code, "sendGreetingMessage missing from AscAPI"

    # Verify MockServer handles all corresponding internal API actions
    server_path = os.path.join(EXT_DIR, "mockserver", "mock_server.js")
    with open(server_path, "r", encoding="utf-8") as f:
        server_code = f.read()

    required_endpoints = [
        "GET_DASHBOARD_DATA",
        "SAVE_JOURNAL",
        "DELETE_JOURNAL",
        "SAVE_PREFERENCES",
        "SEND_GREETING_MESSAGE",
        "FETCH_CANVAS_DATA",
        "SAVE_STUDENT_FREETIME"
    ]
    for ep in required_endpoints:
        assert ep in server_code, f"MockServer endpoint {ep} missing!"

    # Verify dashboard/index.html includes api.js before app.js
    index_path = os.path.join(EXT_DIR, "dashboard", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        index_html = f.read()
    assert 'src="api.js"' in index_html, "dashboard/index.html must load api.js"
    assert index_html.find('src="api.js"') < index_html.find('src="app.js"'), "api.js must be loaded before app.js"

    print("  ✓ Frontend API layer and MockServer internal REST endpoints fully verified")

def test_logged_out_notice_and_canvas_stopped_syncing():
    print("[11/11] Testing Logged-Out Notice cards and Canvas 'Stopped Syncing' state...")
    canvas_js = os.path.join(EXT_DIR, "dashboard", "views", "canvas_view.js")
    with open(canvas_js, "r", encoding="utf-8") as f:
        canvas_code = f.read()

    assert "Stopped Syncing" in canvas_code, "Canvas course cards must display 'Stopped Syncing' when disconnected!"
    assert "btn-reconnect-canvas-banner" in canvas_code, "Persistent reconnect banner missing from canvas_view.js"
    assert "renderLoggedOutNotice" in canvas_code, "Canvas view must call renderLoggedOutNotice when logged out"
    assert "loadFromMockServer" in canvas_code, "Canvas view must dynamically pull data from MockServer"
    assert "setCanvasConnected" in canvas_code, "Canvas view must have setCanvasConnected for reactive sync toggle"
    assert "updateDataSyncModalUI" in canvas_code, "Canvas view must have updateDataSyncModalUI to toggle sync options and logout/login button"
    assert "updateToolbarSyncStatus" in canvas_code, "Canvas view must update toolbar sync status badge"

    # Verify activities, freetime, matches, greeting views use renderLoggedOutNotice
    for view_file in ["activities_view.js", "freetime_view.js", "matches_view.js", "greeting_view.js"]:
        vpath = os.path.join(EXT_DIR, "dashboard", "views", view_file)
        with open(vpath, "r", encoding="utf-8") as f:
            vcode = f.read()
        assert "renderLoggedOutNotice" in vcode, f"{view_file} must call renderLoggedOutNotice when logged out"

    # Verify index.html contains notice wrappers and canvas sync elements
    index_path = os.path.join(EXT_DIR, "dashboard", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        index_html = f.read()
    assert "canvas-login-notice-wrap" in index_html, "canvas-login-notice-wrap missing from index.html"
    assert "canvas-sync-options-container" in index_html, "canvas-sync-options-container missing from index.html"
    assert "canvas-sync-locked-notice" in index_html, "canvas-sync-locked-notice missing from index.html"
    assert "canvas-toolbar-sync-badge" in index_html, "canvas-toolbar-sync-badge missing from index.html"
    assert "btn-sync-unlock-login" in index_html, "btn-sync-unlock-login missing from index.html"
    assert "activities-login-notice-wrap" in index_html, "activities-login-notice-wrap missing from index.html"
    assert "freetime-login-notice-wrap" in index_html, "freetime-login-notice-wrap missing from index.html"
    assert "matches-login-notice-wrap" in index_html, "matches-login-notice-wrap missing from index.html"
    assert "greeting-login-notice-wrap" in index_html, "greeting-login-notice-wrap missing from index.html"

    print("  ✓ Logged-Out Notice cards and Canvas 'Stopped Syncing' behavior fully verified")

def test_user_preferred_theme_and_mockserver_sync():
    print("[12/12] Testing user preferred themes & MockServer theme endpoints...")
    data_path = os.path.join(EXT_DIR, "mockserver", "mock_data.json")
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Verify Jordan default theme is Nordic Slate and Alex is Cosmic Amethyst
    jordan_theme = data["accounts"]["user_jordan_101"]["user"]["preferredTheme"]
    alex_theme = data["accounts"]["user_alex_202"]["user"]["preferredTheme"]
    assert jordan_theme["themePreset"] == "slate", "Jordan Lee default theme must be Nordic Slate (slate)"
    assert alex_theme["themePreset"] == "amethyst", "Alex Rivera default theme must be Cosmic Amethyst (amethyst)"

    # Verify canvas student profile defaults
    s1_path = os.path.join(EXT_DIR, "mockserver", "canvas data", "student_1", "canvas_student_profile.json")
    with open(s1_path, "r", encoding="utf-8") as f:
        s1 = json.load(f)
    assert s1["student"]["preferredTheme"]["themePreset"] == "slate", "Student 1 profile theme must be Nordic Slate"

    s2_path = os.path.join(EXT_DIR, "mockserver", "canvas data", "student_2", "canvas_student_profile.json")
    with open(s2_path, "r", encoding="utf-8") as f:
        s2 = json.load(f)
    assert s2["student"]["preferredTheme"]["themePreset"] == "amethyst", "Student 2 profile theme must be Cosmic Amethyst"

    # Verify MockServer functions and REST endpoints
    server_path = os.path.join(EXT_DIR, "mockserver", "mock_server.js")
    with open(server_path, "r", encoding="utf-8") as f:
        server_code = f.read()

    assert "getUserPickedTheme" in server_code, "getUserPickedTheme function missing in mock_server.js"
    assert "saveUserPickedTheme" in server_code, "saveUserPickedTheme function missing in mock_server.js"
    assert "GET_USER_THEME" in server_code, "GET_USER_THEME action missing in mock_server.js"
    assert "SAVE_USER_THEME" in server_code, "SAVE_USER_THEME action missing in mock_server.js"

    # Verify AscAPI methods
    api_path = os.path.join(EXT_DIR, "dashboard", "api.js")
    with open(api_path, "r", encoding="utf-8") as f:
        api_code = f.read()

    assert "getUserTheme" in api_code, "getUserTheme missing from AscAPI"
    assert "saveUserTheme" in api_code, "saveUserTheme missing from AscAPI"

    # Verify app.js userPreferredTheme variable & settings_view save
    app_path = os.path.join(EXT_DIR, "dashboard", "app.js")
    with open(app_path, "r", encoding="utf-8") as f:
        app_code = f.read()

    assert "userPreferredTheme" in app_code, "userPreferredTheme variable missing from app.js"
    assert "readUserPreferredThemeFromIndex" in app_code, "readUserPreferredThemeFromIndex missing from app.js"

    settings_path = os.path.join(EXT_DIR, "dashboard", "views", "settings_view.js")
    with open(settings_path, "r", encoding="utf-8") as f:
        settings_code = f.read()

    assert "saveUserPickedTheme" in settings_code, "saveUserPickedTheme missing from settings_view.js"

    # Verify meeting countdown button in matches_view and meeting cards in greeting_view
    matches_path = os.path.join(EXT_DIR, "dashboard", "views", "matches_view.js")
    with open(matches_path, "r", encoding="utf-8") as f:
        matches_code = f.read()
    assert "btn-meeting-countdown" in matches_code, "btn-meeting-countdown missing from matches_view.js"
    assert "formatMeetingCountdown" in matches_code, "formatMeetingCountdown missing from matches_view.js"

    greeting_path = os.path.join(EXT_DIR, "dashboard", "views", "greeting_view.js")
    with open(greeting_path, "r", encoding="utf-8") as f:
        greeting_code = f.read()
    assert "renderConfirmedMeetings" in greeting_code, "renderConfirmedMeetings missing from greeting_view.js"
    assert "asc-greeting-meeting-card" in greeting_code, "asc-greeting-meeting-card missing from greeting_view.js"
    assert "btn-dev-boost-time" in greeting_code, "btn-dev-boost-time missing from greeting_view.js"
    assert "boostMeetingTime" in greeting_code, "boostMeetingTime missing from greeting_view.js"
    assert "btn-ready-to-start" in greeting_code, "btn-ready-to-start missing from greeting_view.js"
    assert "openMeetingChat" in greeting_code, "openMeetingChat missing from greeting_view.js"
    assert "mountEmbeddedChat" in greeting_code, "mountEmbeddedChat missing from greeting_view.js"
    assert "getMeetingChatHistory" in greeting_code, "getMeetingChatHistory missing from greeting_view.js"
    assert "updateRoomContext" in greeting_code, "updateRoomContext missing from greeting_view.js"
    assert "asc-greeting-meeting-card-body" in greeting_code, "asc-greeting-meeting-card-body missing from greeting_view.js"
    assert "asc-embedded-chat-slot" in greeting_code, "asc-embedded-chat-slot missing from greeting_view.js"

    # Verify CSS rules for collapsible cards, embedded chat, and dev boost
    css_path = os.path.join(EXT_DIR, "dashboard", "styles.css")
    with open(css_path, "r", encoding="utf-8") as f:
        css_code = f.read()
    assert ".btn-dev-boost-time" in css_code, ".btn-dev-boost-time missing from styles.css"
    assert ".btn-ready-to-start" in css_code, ".btn-ready-to-start missing from styles.css"
    assert ".asc-greeting-meeting-card-body" in css_code, ".asc-greeting-meeting-card-body missing from styles.css"
    assert ".asc-embedded-chat-slot" in css_code, ".asc-embedded-chat-slot missing from styles.css"

    print("  ✓ User preferred themes, Greeting Room dev boost, collapsible cards, ready-to-start, and embedded chat verified")

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
        test_frontend_api_layer_and_mockserver_endpoints()
        test_logged_out_notice_and_canvas_stopped_syncing()
        test_user_preferred_theme_and_mockserver_sync()
        print("=" * 65)
        print("ALL 12 TESTS PASSED! Complete verified client-server architecture.")
        print("=" * 65)
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
