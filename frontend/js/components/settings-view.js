window.SettingsView = {
  name: 'SettingsView',
  data: function () {
    return { icons: Icons };
  },
  methods: {
    logout: function () {
      var self = this;
      this.actions.askConfirm({
        message: 'Anda akan keluar dari sesi ini. Data tidak akan hilang.',
        confirmLabel: 'Keluar',
        onConfirm: function () {
          self.actions.logout();
        },
      });
    },
  },
  computed: {
    user: function () {
      return this.store.user;
    },
    initials: function () {
      if (!this.user) return '?';
      return this.user.name
        .split(' ')
        .map(function (w) {
          return w.charAt(0);
        })
        .slice(0, 2)
        .join('')
        .toUpperCase();
    },
    apiMock: function () {
      return window.Api && Api.USE_MOCK;
    },
  },
  template: `
    <main class="px-5 pt-4">
      <header style="margin-top:12px" class="mb-6">
        <h1 class="font-bold" style="font-size:32px;letter-spacing:-0.02em">Pengaturan</h1>
      </header>

      <section class="flex items-center gap-4 bg-surface border border-edge rounded-panel p-4 mb-6">
        <div class="w-14 h-14 rounded-full gradient-fill flex items-center justify-center shadow-glow shrink-0">
          <span class="text-background font-bold">{{ initials }}</span>
        </div>
        <div class="min-w-0">
          <p class="text-base font-semibold truncate">{{ user ? user.name : '-' }}</p>
          <p class="text-xs text-secondary truncate">{{ user ? user.email : '-' }}</p>
        </div>
      </section>

      <section class="bg-surface border border-edge rounded-panel divide-y divide-edge overflow-hidden mb-6">
        <div class="flex items-center justify-between px-4 py-3.5 gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-5 h-5 text-secondary shrink-0" v-html="icons.coin"></span>
            <span class="text-sm">Mata uang</span>
          </div>
          <span class="text-sm font-semibold text-secondary">IDR (Rp)</span>
        </div>

        <div class="flex items-center justify-between px-4 py-3.5 gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-5 h-5 text-secondary shrink-0" v-html="icons.info"></span>
            <span class="text-sm">Sumber data</span>
          </div>
          <span class="text-sm font-semibold text-secondary">Google Sheets</span>
        </div>

        <div class="flex items-center justify-between px-4 py-3.5 gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-5 h-5 text-secondary shrink-0" v-html="icons.chart"></span>
            <span class="text-sm">Mode mock</span>
          </div>
          <span
            class="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            :class="apiMock ? 'bg-chart/20 text-chart' : 'bg-variant text-secondary'"
          >
            {{ apiMock ? 'AKTIF' : 'NONAKTIF' }}
          </span>
        </div>
      </section>

      <section class="bg-surface border border-edge rounded-panel p-4 mb-6">
        <p class="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Tentang</p>
        <p class="text-sm font-semibold">Montrack App v0.1</p>
        <p class="text-xs text-secondary leading-relaxed mt-1">
          Pencatatan keuangan pribadi ringan. Seluruh data disimpan di Google Sheets milik Anda,
          tanpa server database pihak ketiga.
        </p>
      </section>

      <button
        type="button"
        class="w-full bg-surface border border-edge rounded-box flex items-center justify-center gap-2
               text-danger font-semibold text-sm active:opacity-70 transition mb-4"
        @click="logout"
      >
        <span class="w-5 h-5" v-html="icons.logout"></span>
        Keluar
      </button>
    </main>
  `,
};
