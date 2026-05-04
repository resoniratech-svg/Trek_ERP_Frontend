import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  // Capture failed network requests
  page.on('requestfailed', request => {
    console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  // Capture network responses
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      console.log(`RESPONSE: ${response.status()} - ${url}`);
    }
  });

  try {
    await page.goto('http://localhost:5173/login');
    
    // Fill in login details
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'admin@erp.com');
    await page.type('input[type="password"]', 'password');
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    console.log('Navigated to:', page.url());
    
    // Check if loading spinner is present
    // Let's take a screenshot
    await page.screenshot({ path: 'dashboard_local.png' });
    
    const pageContent = await page.content();
    if (pageContent.includes('Aggregating Executive Analytics')) {
      console.log('DASHBOARD IS STUCK LOADING');
    } else {
      console.log('DASHBOARD LOADED SUCCESSFULLY');
    }

  } catch (err) {
    console.error('Error during automation:', err);
  } finally {
    await browser.close();
  }
})();
