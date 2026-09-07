export async function installMockApi(page, { user, responses = {} }) {
  await page.route(/^https?:\/\/[^/]+\/api(?:\/|$)/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const key = `${request.method()} ${url.pathname.replace(/^\/api/, '')}${url.search}`;
    const payload = responses[key] || responses[`${request.method()} ${url.pathname.replace(/^\/api/, '')}`]
      || (url.pathname === '/api/auth/me' ? { user } : {});

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
}
