import type { Component } from 'solid-js';
import { createSignal, onMount, Switch, Match } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import { probeLocal } from './utils/local';
import ListPage from './pages/List';
import CreatePage from './pages/Create';
import EditPage from './pages/Edit';
import SettingsPage from './pages/Settings';

const App: Component = () => {
  const [ready, setReady] = createSignal(false);

  onMount(async () => {
    await probeLocal();
    setReady(true);
  });

  return (
    <Switch>
      <Match when={ready()}>
        <Router>
          <Route path="/" component={ListPage} />
          <Route path="/create" component={CreatePage} />
          <Route path="/edit/:id" component={EditPage} />
          <Route path="/settings" component={SettingsPage} />
        </Router>
      </Match>
      <Match when={!ready()}>
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900" />
      </Match>
    </Switch>
  );
};

export default App;
