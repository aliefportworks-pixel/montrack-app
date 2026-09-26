/* Montrack — entry point SPA (hash router, Vue 3 CDN) */
(function () {
  var viewByPath = {
    '/login': 'login-view',
    '/daftar': 'register-view',
    '/': 'home-view',
    '/transaksi': 'transaction-form-view',
    '/riwayat': 'history-view',
    '/analitik': 'analytics-view',
    '/pengaturan': 'settings-view',
  };

  var App = {
    template: `
      <div class="mx-auto max-w-md min-h-screen relative pb-32 overflow-x-hidden">
        <transition name="page" mode="out-in">
          <component :is="currentView" :key="viewKey" />
        </transition>

        <bottom-nav v-if="showNav" />

        <toast-component />
        <confirm-modal v-if="store.confirm" />

        <div
          v-if="store.loading"
          class="fixed inset-0 z-30 bg-black/40 flex items-center justify-center backdrop-blur-[2px]"
        >
          <div class="bg-surface border border-edge rounded-full px-5 py-3 flex items-center gap-3 shadow-glow">
            <spinner-component />
            <span class="text-sm font-medium">Memuat data…</span>
          </div>
        </div>
      </div>
    `,
    computed: {
      currentView: function () {
        return viewByPath[this.store.route.path] || 'home-view';
      },
      showNav: function () {
        return (
          !!this.store.user &&
          this.store.route.path !== '/login' &&
          this.store.route.path !== '/daftar' &&
          this.store.route.path !== '/transaksi'
        );
      },
      viewKey: function () {
        return this.store.route.path + '?' + JSON.stringify(this.store.route.query);
      },
    },
  };

  var app = Vue.createApp(App);

  app.config.globalProperties.store = window.store;
  app.config.globalProperties.actions = window.actions;
  app.config.globalProperties.$fmt = window.Utils;
  app.config.globalProperties.icons = window.Icons;

  app.component('spinner-component', window.SpinnerComponent);
  app.component('toast-component', window.ToastComponent);
  app.component('confirm-modal', window.ConfirmModal);
  app.component('bottom-nav', window.BottomNav);
  app.component('balance-card', window.BalanceCard);
  app.component('quick-actions', window.QuickActions);
  app.component('transaction-item', window.TransactionItem);
  app.component('login-view', window.LoginView);
  app.component('register-view', window.RegisterView);
  app.component('home-view', window.HomeView);
  app.component('transaction-form-view', window.TransactionFormView);
  app.component('history-view', window.HistoryView);
  app.component('analytics-view', window.AnalyticsView);
  app.component('settings-view', window.SettingsView);

  window.actions.bootstrap();
  app.mount('#app');
})();
