#!/usr/bin/env python3
"""
3E Plus 登录并计算保温厚度
通过 Microsoft B2C OAuth 流程
"""
import requests
import re
import json
import time

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
})

EMAIL = "352672338@qq.com"
PASSWORD = "Qaz3355237-"

print("=" * 80)
print("3E Plus 自动化登录测试")
print("=" * 80)

# 步骤1: 触发 B2C OAuth 流程
print("\n[1] 触发 B2C OAuth 流程...")
oauth_url = "https://3eplusauth.b2clogin.com/3eplusauth.onmicrosoft.com/oauth2/v2.0/authorize?p=B2C_1_3eplus_signup_signin&client_id=3e2daaad-1f68-4bd6-94dc-f722874e169b&nonce=defaultNonce&redirect_uri=https%3A%2F%2F3eplus.org%2Fsignin&scope=openid%20https%3A%2F%2F3eplusauth.onmicrosoft.com%2Fapi%2F3e.write%20https%3A%2F%2F3eplusauth.onmicrosoft.com%2Fapi%2F3e.read&response_type=id_token%20token&prompt=login"
resp = session.get(oauth_url)
print(f"    Status: {resp.status_code}")
print(f"    URL: {resp.url}")

# 提取 SETTINGS 变量中的 csrf_token 和 transId
settings_match = re.search(r'var SETTINGS\s*=\s*(\{.*?\});', resp.text, re.DOTALL)
if settings_match:
    settings_text = settings_match.group(1)
    csrf_match = re.search(r'csrf["\']?\s*:\s*["\']([^"\']+)["\']', settings_text)
    trans_match = re.search(r'transId["\']?\s*:\s*["\']([^"\']+)["\']', settings_text)
    api_match = re.search(r'api["\']?\s*:\s*["\']([^"\']+)["\']', settings_text)

    if csrf_match and trans_match:
        csrf_token = csrf_match.group(1)
        trans_id = trans_match.group(1)
        api_endpoint = api_match.group(1) if api_match else "CombinedSigninAndSignup"
        print(f"    ✅ CSRF Token: {csrf_token[:20]}...")
        print(f"    ✅ Trans ID: {trans_id}")
        print(f"    ✅ API: {api_endpoint}")
    else:
        print(f"    ❌ 未找到 CSRF token 或 trans ID")
        print(f"    Settings: {settings_text[:500]}")
        exit(1)
else:
    print(f"    ❌ 未找到 SETTINGS 变量")
    exit(1)

# 步骤2: 提交登录凭据
print("\n[2] 提交登录凭据...")
login_url = f"https://3eplusauth.b2clogin.com/3eplusauth.onmicrosoft.com/{api_endpoint}/SelfAsserted?tx={trans_id}&p=B2C_1_3eplus_signup_signin"

login_data = {
    'request_type': 'RESPONSE',
    'email': EMAIL,
    'password': PASSWORD,
}

headers = {
    'X-CSRF-TOKEN': csrf_token,
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': 'https://3eplusauth.b2clogin.com',
    'Referer': resp.url,
    'Accept': 'application/json, text/javascript, */*; q=0.01',
}

resp = session.post(login_url, data=login_data, headers=headers)
print(f"    Status: {resp.status_code}")
print(f"    Response: {resp.text[:500]}")

# 步骤3: 确认登录 - 获取 token
print("\n[3] 确认登录...")
confirm_url = f"https://3eplusauth.b2clogin.com/3eplusauth.onmicrosoft.com/{api_endpoint}/confirmed?csrf_token={csrf_token}&tx={trans_id}&p=B2C_1_3eplus_signup_signin"
resp = session.get(confirm_url, headers=headers, allow_redirects=False)
print(f"    Status: {resp.status_code}")
print(f"    Location: {resp.headers.get('Location', 'N/A')[:300]}")
print(f"    Body: {resp.text[:500]}")
