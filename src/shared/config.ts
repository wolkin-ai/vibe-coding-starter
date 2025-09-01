/**
 * Global application configuration
 *
 * This is the ONLY place where global constants should be defined.
 * All hardcoded values should be moved here.
 */

export const AppConfig = {
  // App metadata
  name: 'Vibe Coding スターター',
  description: 'AIと一緒にVibeコーディングを学ぶ初心者向けプラットフォーム',
  version: '1.0.0',

  // UI defaults
  ui: {
    defaultPageSize: 20,
    maxPageSize: 100,
    animationDuration: 200,
  },

  // API settings
  api: {
    timeoutMs: 15000,
    retryCount: 3,
  },

  // Feature flags
  features: {
    enableRealtime: true,
    enableAnalytics: false,
  },

  // Routes
  routes: {
    home: '/',
    todos: '/todos',
    auth: {
      login: '/auth/login',
      signup: '/auth/signup',
    },
  },
} as const;

// Export individual sections for convenience
export const { ui, api, features, routes } = AppConfig;
