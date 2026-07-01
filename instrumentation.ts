export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.E2E_MSW === '1') {
    const { server } = await import('./src/testing/mocks/anilist-server');
    server.listen({ onUnhandledRequest: 'bypass' });
  }
}
