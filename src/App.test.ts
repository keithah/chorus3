import { describe, expect, it } from 'vitest';

import App from './App.svelte';

describe('App scaffold', () => {
  it('exports a mountable Svelte component', () => {
    expect(App).toBeTypeOf('function');
  });
});
