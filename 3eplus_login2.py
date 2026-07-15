#!/usr/bin/env python3
"""
3E Plus 登录 - 尝试不同的 endpoint 格式
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

# 步骤1: 触发 B2C OAuth
oauth_url = "https://3eplusauth.b2clogin.com/3eplusauth.onmicrosoft.com/oauth2/v2.0/authorize?p=B2C_1_3eplus_signup_signin&client_id=3e2daaad-1f68-4bd6-94dc-f722874e169b&nonce=defaultNonce&redirect_uri=https%3A%2F%2F3eplus.org%2Fsignin&scope=openid%20https%3A%2F%2F3eplusauth.onmicrosoft.com%2Fapi%2F3e.write%20https%3A%2F%2F3eplusauth.onmicrosoft.com%2Fapi%2F3e.read&response_type=id_token%20token&prompt=login"
resp = session.get(oauth_url)

# 提取设置
settings_match = re.search(r'var SETTINGS\s*=\s*(\{[^;]*?\});', resp.text)
settings = json.loads(settings_match.group(1))
csrf_token = settings['csrf']
trans_id = settings['transId']
api = settings['api']
tenant = settings['hosts']['tenant']
policy = settings['hosts']['policy']

print(f"CSRF: {csrf_token[:20]}...")
print(f"Trans ID: {trans_id[:30]}...")
print(f"API: {api}")
print(f"Tenant: {tenant}")
print(f"Policy: {policy}")

# 步骤2: 提交登录凭据
login_url = f"https://3eplusauth.b2clogin.com{tenant}/{api}/SelfAsserted?tx={trans_id}&p={policy}"
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
    'Accept': 'application/json, text/javascript, */*; q=0.01',
}

print("\n提交登录...")
resp = session.post(login_url, data=login_data, headers=headers)
print(f"Status: {resp.status_code}")
print(f"Response: {resp.text[:300]}")

# 步骤3: 确认 - 尝试不同的 URL 格式
print("\n确认登录 - 尝试不同 URL 格式...")

confirm_urls = [
    f"https://3eplusauth.b2clogin.com{tenant}/{api}/Confirmed?csrf_token={csrf_token}&tx={trans_id}&p={policy}",
    f"https://3eplusauth.b2clogin.com{tenant}/{api}/confirmed?csrf_token={csrf_token}&tx={trans_id}&p={policy}",
    f"https://3eplusauth.b2clogin.com{tenant}/{api}/api/CombinedSigninAndSignup/confirmed?csrf_token={csrf_token}&tx={trans_id}&p={policy}",
]

for url in confirm_urls:
    try:
        r = session.get(url, headers=headers, allow_redirects=False)
        print(f"  [{r.status_code}] {url[80:]}")
        if r.status_code in [200, 302]:
            print(f"    Location: {r.headers.get('Location', 'N/A')[:200]}")
            print(f"    Body: {r.text[:300]}")
            if 'access_token' in r.text or 'id_token' in r.text or r.status_code == 302:
                print(f"    ✅ 成功!")
                break
    except Exception as e:
        print(f"  [ERR] {e}")
