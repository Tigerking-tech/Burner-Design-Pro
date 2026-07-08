const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Collect console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push('PAGE ERROR: ' + err.message);
  });

  // Test homepage first
  console.log('Testing homepage...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  console.log('Homepage loaded. Errors so far:', errors.length);
  errors.forEach(e => console.log('  -', e));

  // Test orifice calculator page
  console.log('\nTesting orifice-calculator page...');
  errors.length = 0;
  await page.goto('http://localhost:3001/orifice-calculator', { waitUntil: 'networkidle' }).catch(e => {
    console.log('Navigation failed:', e.message);
  });
  
  // Wait a bit for React to render
  await page.waitForTimeout(3000);
  
  console.log('Orifice page loaded. Errors:', errors.length);
  errors.forEach(e => console.log('  -', e));
  
  // Check if the page has actual content (not just loading)
  const bodyText = await page.textContent('body').catch(() => 'NO CONTENT');
  console.log('\nPage content preview:', bodyText.substring(0, 200));

  // Take screenshot
  await page.screenshot({ path: '/workspace/orifice-test.png' });
  console.log('Screenshot saved to /workspace/orifice-test.png');

  await browser.close();
})();
