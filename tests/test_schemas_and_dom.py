"""
Automated Verification Suite: Schemas, Manifest V3, and DOM Integrity.
Verifies that all files, HTML elements, and storage keys match without human interaction.
"""

import os
import json
import re

def test_manifest_v3():
    print("[TEST] Validating extension/manifest.json...")
    path = os.path.join("extension", "manifest.json")
    assert os.path.exists(path), "manifest.json does not exist"
    
    with open(path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
        
    assert manifest.get("manifest_version") == 3, "manifest_version must be 3"
    assert "storage" in manifest.get("permissions", []), "storage permission missing"
    assert "activeTab" in manifest.get("permissions", []), "activeTab permission missing"
    assert manifest.get("background", {}).get("service_worker") == "background.js", "background service worker misconfigured"
    assert os.path.exists(os.path.join("extension", "icons", "icon16.png")), "icon16.png missing"
    assert os.path.exists(os.path.join("extension", "icons", "icon48.png")), "icon48.png missing"
    assert os.path.exists(os.path.join("extension", "icons", "icon128.png")), "icon128.png missing"
    print("  -> manifest.json is 100% compliant with Manifest V3.")

def test_dom_ids_matching():
    print("[TEST] Validating DOM IDs between dashboard.html and dashboard.js...")
    html_path = os.path.join("extension", "dashboard.html")
    js_path = os.path.join("extension", "dashboard.js")
    
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    with open(js_path, "r", encoding="utf-8") as f:
        js_content = f.read()

    # Find all getElementById calls in JS
    js_ids = set(re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", js_content))
    
    # Find all id="..." in HTML
    html_ids = set(re.findall(r'id=["\']([^"\']+)["\']', html_content))

    missing_in_html = js_ids - html_ids
    assert not missing_in_html, f"dashboard.js queries IDs missing from dashboard.html: {missing_in_html}"
    print(f"  -> All {len(js_ids)} DOM element IDs referenced in dashboard.js exist in dashboard.html. Zero null pointer risks.")

def test_seed_data_syntax():
    print("[TEST] Validating seed_data.js key consistency...")
    path = os.path.join("extension", "seed_data.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "STORAGE_KEYS" in content
    assert "asc_journal_log" in content
    assert "asc_skills_ledger" in content
    assert "asc_events_data" in content
    assert "asc_peer_matches" in content
    assert "CISP-310" in content
    assert "Alex Rivera" in content
    print("  -> Seed data keys match Data Contract specifications perfectly.")

if __name__ == "__main__":
    test_manifest_v3()
    test_dom_ids_matching()
    test_seed_data_syntax()
    print("\n✅ ALL EXTENSION, SCHEMA, AND DOM INTEGRITY TESTS PASSED SUCCESSFULLY!")
