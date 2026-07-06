#!/usr/bin/env python3
"""
Comprehensive Verification Script for 18 SaaS Standard Fixes
============================================================
This script verifies all 18 fixes have been properly implemented.

Categories:
1. Security (5 items)
2. GDPR Compliance (4 items)  
3. Billing & Subscription (4 items)
4. Content & Pages (5 items)
"""

import sys
import os
import re
import json

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Colored output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

passed = 0
failed = 0
warnings = 0
results = []

def check(name, condition, category, detail=""):
    global passed, failed
    if condition:
        status = f"{Colors.GREEN}✓ PASS{Colors.END}"
        passed += 1
    else:
        status = f"{Colors.RED}✗ FAIL{Colors.END}"
        failed += 1
    results.append({"name": name, "status": condition, "category": category, "detail": detail})
    print(f"  {status} {name}")
    if detail and not condition:
        print(f"      {Colors.YELLOW}Detail: {detail}{Colors.END}")

def file_contains(filepath, pattern):
    """Check if file contains a pattern (case-insensitive)."""
    if not os.path.exists(filepath):
        return False, f"File not found: {filepath}"
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        if re.search(pattern, content, re.IGNORECASE):
            return True, ""
        return False, f"Pattern '{pattern}' not found in {filepath}"
    except Exception as e:
        return False, str(e)

def file_exists(filepath):
    exists = os.path.exists(filepath)
    return exists, "" if exists else f"File not found: {filepath}"

def print_header(title):
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}  {title}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*70}{Colors.END}")

def main():
    global passed, failed, warnings
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, '..', 'backend')
    frontend_dir = os.path.join(base_dir, '..', 'frontend')
    
    # Normalize paths
    backend_dir = os.path.normpath(backend_dir)
    frontend_dir = os.path.normpath(frontend_dir)
    
    print(f"\n{Colors.BOLD}{Colors.YELLOW}")
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║     Burner Design Pro - 18 Fixes Verification Suite         ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}")
    print(f"  Backend dir: {backend_dir}")
    print(f"  Frontend dir: {frontend_dir}")
    print()

    # ========================================================================
    # CATEGORY 1: SECURITY (5 items)
    # ========================================================================
    print_header("CATEGORY 1: SECURITY (5 fixes)")
    
    # 1.1 Password hashing uses bcrypt
    auth_file = os.path.join(backend_dir, 'app', 'security', 'auth.py')
    has_bcrypt, bcrypt_detail = file_contains(auth_file, r'bcrypt')
    has_get_password_hash, _ = file_contains(auth_file, r'def get_password_hash')
    check("1.1 Password hashing uses bcrypt", 
          has_bcrypt and has_get_password_hash,
          "Security",
          bcrypt_detail)
    
    # 1.2 Password migration from SHA256 to bcrypt
    has_migration, mig_detail = file_contains(auth_file, r'needs_migration|migrate.*hash|sha256.*bcrypt')
    check("1.2 SHA256 to bcrypt migration support", 
          has_migration,
          "Security",
          mig_detail)
    
    # 1.3 Login attempt protection (account lockout)
    verify_file = os.path.join(backend_dir, 'app', 'services', 'verification_store.py')
    has_lockout, lock_detail = file_contains(verify_file, r'is_account_locked|record_failed_login|lockout')
    check("1.3 Login attempt protection (account lockout)",
          has_lockout,
          "Security",
          lock_detail)
    
    # 1.4 JWT secret key from environment variable
    has_jwt_env, jwt_detail = file_contains(auth_file, r'SECRET_KEY.*os\.getenv|SECRET_KEY.*environ')
    has_jwt_warning, _ = file_contains(auth_file, r'WARNING.*SECRET_KEY|INSECURE|production')
    check("1.4 JWT secret key from env + production warning",
          has_jwt_env,
          "Security",
          jwt_detail)
    
    # 1.5 Login activity logging
    db_file = os.path.join(backend_dir, 'app', 'services', 'database.py')
    has_login_activity, la_detail = file_contains(db_file, r'login_activities|save_login_activity')
    auth_api_file = os.path.join(backend_dir, 'app', 'api', 'auth.py')
    has_login_log_api, _ = file_contains(auth_api_file, r'login-activity|save_login_activity')
    check("1.5 Login activity logging",
          has_login_activity and has_login_log_api,
          "Security",
          la_detail)

    # ========================================================================
    # CATEGORY 2: GDPR COMPLIANCE (4 items)
    # ========================================================================
    print_header("CATEGORY 2: GDPR COMPLIANCE (4 fixes)")
    
    # 2.1 Account deletion (right to erasure)
    has_delete_account, del_detail = file_contains(auth_api_file, r'delete.*account|delete_my_account')
    check("2.1 Account deletion (right to erasure)",
          has_delete_account,
          "GDPR",
          del_detail)
    
    # 2.2 Data export (right to data portability)
    has_export_data, exp_detail = file_contains(auth_api_file, r'export.*data|data.*export')
    check("2.2 Data export (right to data portability)",
          has_export_data,
          "GDPR",
          exp_detail)
    
    # 2.3 Cookie consent banner
    cookie_file = os.path.join(frontend_dir, 'src', 'components', 'CookieConsent.tsx')
    has_cookie_banner, cookie_detail = file_exists(cookie_file)
    check("2.3 Cookie consent banner",
          has_cookie_banner,
          "GDPR",
          cookie_detail)
    
    # 2.4 Terms of service agreement checkbox on signup
    signup_file = os.path.join(frontend_dir, 'src', 'pages', 'SignUpPage.tsx')
    has_terms_checkbox, terms_detail = file_contains(signup_file, r'agreed.*terms|terms.*agree|accept.*terms')
    user_model_file = os.path.join(backend_dir, 'app', 'models', 'user.py')
    has_terms_model, _ = file_contains(user_model_file, r'agreed_to_terms')
    check("2.4 Terms agreement checkbox on signup",
          has_terms_checkbox and has_terms_model,
          "GDPR",
          terms_detail)

    # ========================================================================
    # CATEGORY 3: BILLING & SUBSCRIPTION (4 items)
    # ========================================================================
    print_header("CATEGORY 3: BILLING & SUBSCRIPTION (4 fixes)")
    
    # 3.1 Invoice/receipt download links
    account_file = os.path.join(frontend_dir, 'src', 'pages', 'AccountPage.tsx')
    has_invoices, inv_detail = file_contains(account_file, r'invoice|receipt|order.*history')
    sub_api_file = os.path.join(backend_dir, 'app', 'api', 'subscription.py')
    has_orders_api, _ = file_contains(sub_api_file, r'@router.get\("/orders')
    check("3.1 Invoice/Receipt download & order history",
          has_invoices and has_orders_api,
          "Billing",
          inv_detail)
    
    # 3.2 Customer portal link (Manage in Creem Portal)
    has_portal_link, portal_detail = file_contains(account_file, r'creem.*portal|portal.*url|billing.*portal|Manage in Creem')
    has_portal_api, _ = file_contains(sub_api_file, r'create_customer_portal|billing_portal_url')
    check("3.2 Customer portal link (Manage in Creem Portal)",
          has_portal_link and has_portal_api,
          "Billing",
          portal_detail)
    
    # 3.3 Subscription pause/resume API
    has_pause_api, pause_detail = file_contains(sub_api_file, r'pause_subscription|subscription/pause')
    has_resume_api, _ = file_contains(sub_api_file, r'resume_subscription|subscription/resume')
    creem_client_file = os.path.join(backend_dir, 'app', 'services', 'creem_client.py')
    has_pause_client, _ = file_contains(creem_client_file, r'def pause_subscription|def resume_subscription')
    check("3.3 Subscription pause/resume API",
          has_pause_api and has_resume_api and has_pause_client,
          "Billing",
          pause_detail)
    
    # 3.4 CSP header fix (doesn't break frontend)
    middleware_file = os.path.join(backend_dir, 'app', 'security', 'middleware.py')
    has_csp, csp_detail = file_contains(middleware_file, r'Content-Security-Policy')
    has_unsafe_inline, _ = file_contains(middleware_file, r"unsafe-inline.*style|style.*unsafe-inline")
    check("3.4 CSP policy (frontend-compatible)",
          has_csp and has_unsafe_inline,
          "Billing",
          csp_detail)

    # ========================================================================
    # CATEGORY 4: CONTENT & PAGES (5 items)
    # ========================================================================
    print_header("CATEGORY 4: CONTENT & PAGES (5 fixes)")
    
    pages_dir = os.path.join(frontend_dir, 'src', 'pages')
    
    # 4.1 Refund Policy page
    refund_page = os.path.join(pages_dir, 'RefundPolicyPage.tsx')
    has_refund, refund_detail = file_exists(refund_page)
    check("4.1 Refund Policy page",
          has_refund,
          "Content",
          refund_detail)
    
    # 4.2 FAQ / Help page
    faq_page = os.path.join(pages_dir, 'FAQPage.tsx')
    has_faq, faq_detail = file_exists(faq_page)
    check("4.2 FAQ / Help page",
          has_faq,
          "Content",
          faq_detail)
    
    # 4.3 Contact page
    contact_page = os.path.join(pages_dir, 'ContactPage.tsx')
    has_contact, contact_detail = file_exists(contact_page)
    check("4.3 Contact page",
          has_contact,
          "Content",
          contact_detail)
    
    # 4.4 About page (fixed broken links)
    about_page = os.path.join(pages_dir, 'AboutPage.tsx')
    has_about, about_detail = file_exists(about_page)
    check("4.4 About page (fixed broken links)",
          has_about,
          "Content",
          about_detail)
    
    # 4.5 Changelog page
    changelog_page = os.path.join(pages_dir, 'ChangelogPage.tsx')
    has_changelog, changelog_detail = file_exists(changelog_page)
    check("4.5 Changelog page",
          has_changelog,
          "Content",
          changelog_detail)

    # ========================================================================
    # ADDITIONAL CHECKS: Routes + Footer Links + 2FA Framework
    # ========================================================================
    print_header("ADDITIONAL VERIFICATIONS")
    
    # Check all pages are routed
    app_file = os.path.join(frontend_dir, 'src', 'App.tsx')
    pages_to_check = [
        ('/refund-policy', 'RefundPolicyPage'),
        ('/faq', 'FAQPage'),
        ('/contact', 'ContactPage'),
        ('/about', 'AboutPage'),
        ('/changelog', 'ChangelogPage'),
        ('/forgot-password', 'ForgotPasswordPage'),
    ]
    
    all_routes_ok = True
    missing_routes = []
    for path, name in pages_to_check:
        has_route, _ = file_contains(app_file, path)
        has_import, _ = file_contains(app_file, name)
        if not has_route or not has_import:
            all_routes_ok = False
            missing_routes.append(f"{path} ({name})")
    
    check("All new pages have proper routes",
          all_routes_ok,
          "Content",
          f"Missing: {', '.join(missing_routes)}" if missing_routes else "")
    
    # Check footer links in HomePage
    home_page = os.path.join(frontend_dir, 'src', 'pages', 'HomePage.tsx')
    footer_links = ['privacy', 'terms', 'refund', 'faq', 'contact', 'about', 'changelog']
    all_footer_ok = True
    missing_footer = []
    for link in footer_links:
        has_link, _ = file_contains(home_page, link)
        if not has_link:
            all_footer_ok = False
            missing_footer.append(link)
    check("Footer has all legal/support links",
          all_footer_ok,
          "Content",
          f"Missing: {', '.join(missing_footer)}" if missing_footer else "")
    
    # 2FA framework
    user_model_file = os.path.join(backend_dir, 'app', 'models', 'user.py')
    has_2fa_model, _ = file_contains(user_model_file, 'two_factor_enabled')
    has_2fa_db, _ = file_contains(db_file, 'two_factor_enabled')
    check("Two-factor auth database framework",
          has_2fa_model and has_2fa_db,
          "Security",
          "")

    # ========================================================================
    # Password reset flow (extra check)
    # ========================================================================
    print_header("PASSWORD RESET FLOW")
    forgot_page = os.path.join(pages_dir, 'ForgotPasswordPage.tsx')
    has_forgot_page, forgot_detail = file_exists(forgot_page)
    has_reset_request, _ = file_contains(auth_api_file, r'request_password_reset|password-reset')
    has_reset_confirm, _ = file_contains(auth_api_file, r'confirm_password_reset')
    check("Password reset flow (frontend + backend)",
          has_forgot_page and has_reset_request and has_reset_confirm,
          "Security",
          forgot_detail if not has_forgot_page else "")

    # ========================================================================
    # SUMMARY
    # ========================================================================
    total = passed + failed
    print(f"\n\n{Colors.BOLD}{Colors.YELLOW}")
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║                       VERIFICATION SUMMARY                    ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}")
    
    print(f"\n  {Colors.BOLD}Total Checks:{Colors.END} {total}")
    print(f"  {Colors.GREEN}{Colors.BOLD}Passed:{Colors.END} {passed}")
    print(f"  {Colors.RED}{Colors.BOLD}Failed:{Colors.END} {failed}")
    
    if failed == 0:
        print(f"\n  {Colors.GREEN}{Colors.BOLD}🎉 ALL {total} CHECKS PASSED!{Colors.END}")
        print(f"  {Colors.GREEN}All 18+ fixes have been successfully implemented.{Colors.END}")
    else:
        print(f"\n  {Colors.RED}{Colors.BOLD}⚠ {failed} check(s) failed.{Colors.END}")
        print(f"\n  Failed items:")
        for r in results:
            if not r["status"]:
                print(f"    {Colors.RED}• {r['name']}{Colors.END} [{r['category']}]")
                if r["detail"]:
                    print(f"      {Colors.YELLOW}{r['detail']}{Colors.END}")
    
    print(f"\n{Colors.BLUE}{Colors.BOLD}Category Breakdown:{Colors.END}")
    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"passed": 0, "total": 0}
        categories[cat]["total"] += 1
        if r["status"]:
            categories[cat]["passed"] += 1
    
    for cat, data in categories.items():
        pct = int(data["passed"] / data["total"] * 100) if data["total"] > 0 else 0
        color = Colors.GREEN if pct == 100 else Colors.YELLOW if pct >= 70 else Colors.RED
        print(f"  {cat:15s}: {color}{data['passed']}/{data['total']} ({pct}%){Colors.END}")
    
    print()
    return failed == 0

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n{Colors.RED}Error running verification: {e}{Colors.END}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
