import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app');

if (!target) {
  throw new Error('Unable to mount chorus3: #app element was not found.');
}

const app = mount(App, {
  target
});

export default app;
