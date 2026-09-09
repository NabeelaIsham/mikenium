import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {chromium,expect} from '@playwright/test';

export async function verifyBrowser({base,cookie,pool}){
  const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
  const context=await browser.newContext({userAgent:'mikenium-ci',viewport:{width:1440,height:1000}});
  const page=await context.newPage(),errors=[],violations=[];
  await context.exposeBinding('recordCspViolation',(_source,violation)=>violations.push(violation));
  await context.addInitScript(()=>document.addEventListener('securitypolicyviolation',event=>{
    window.recordCspViolation({directive:event.effectiveDirective,blocked:event.blockedURI,page:location.pathname});
  }));
  page.on('pageerror',error=>errors.push(error.message));
  // Keep third-party analytics, fonts, and other resources outside this test.
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
  try{
    for(const route of ['/','/about','/services','/portfolio','/products','/pricing','/blog','/contact','/privacy-policy','/terms-of-service','/cookie-policy']){
      await page.goto(`${base}${route}`);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('#root')).not.toHaveText('Loading…');
      await page.evaluate(()=>document.fonts.ready);
      assert.ok(await page.evaluate(()=>document.fonts.check('16px Inter')),'Local Inter font loaded');
    }
    await page.goto(`${base}/admin`);
    await expect(page.getByRole('heading',{name:'Super Admin Login'})).toBeVisible();
    const split=cookie.indexOf('=');
    await context.addCookies([{name:cookie.slice(0,split),value:cookie.slice(split+1),url:base,httpOnly:true,sameSite:'Strict'}]);
    await page.reload();
    await expect(page.locator('.sidebar')).toBeVisible();
    for(const name of ['Users','Clients','Projects','Services','Products','Pricing','Blogs','Testimonials','Partners','Contact Messages','Settings','Activity Logs','System Backup']){
      await page.locator('.sidebar nav').getByRole('button',{name,exact:true}).click();
      await expect(page.locator('.sidebar nav').getByRole('button',{name,exact:true})).toHaveClass(/active/);
      await expect(page.locator('.users-page')).toBeVisible();
    }
    await page.locator('.sidebar nav').getByRole('button',{name:'Services',exact:true}).click();
    await page.getByRole('button',{name:'Add New Service',exact:true}).click();
    const name=`Browser service ${randomUUID()}`;
    await page.getByLabel('Service name',{exact:true}).fill(name);
    await page.getByLabel('Description',{exact:true}).fill('A service created through the browser for persistence and publication verification.');
    await page.getByRole('button',{name:'Add Service',exact:true}).click();
    await expect(page.locator('.modal')).toHaveCount(0);
    await expect(page.getByText(name,{exact:true})).toBeVisible();
    await page.reload();
    await page.locator('.sidebar nav').getByRole('button',{name:'Services',exact:true}).click();
    await expect(page.getByText(name,{exact:true})).toBeVisible();
    await page.goto(`${base}/services`);
    await expect(page.getByText(name,{exact:true}).first()).toBeVisible();
    await pool.query('DELETE FROM services WHERE name=$1',[name]);
    const settings=(await pool.query('SELECT seo FROM site_settings WHERE id=1')).rows[0];
    await pool.query("UPDATE site_settings SET seo=jsonb_set(seo,'{allowIndexing}','false') WHERE id=1");
    await page.reload();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
    // Wait for settings to load and the React page to remount before checking.
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
    await pool.query('UPDATE site_settings SET seo=$1 WHERE id=1',[settings.seo]);
    await page.setViewportSize({width:390,height:844});
    await page.goto(base);
    await expect(page.locator('h1').first()).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
    assert.equal(overflow,false,'Mobile homepage should not overflow horizontally');
    assert.deepEqual(errors,[],'Browser runtime errors');
    assert.deepEqual(violations,[],'Content Security Policy violations');
    console.log('Verified public pages, admin navigation, browser service creation/persistence/publication, indexing controls, and mobile homepage.');
  }finally{await browser.close()}
}
