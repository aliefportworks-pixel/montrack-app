window.HomeView = {
  name: 'HomeView',
  components: {
    BalanceCard: window.BalanceCard,
    QuickActions: window.QuickActions,
    TransactionItem: window.TransactionItem,
  },
  data: function () {
    return { icons: Icons };
  },
  computed: {
    user: function () {
      return this.store.user;
    },
    recent: function () {
      return this.store.transactions.slice(0, 5);
    },
    greeting: function () {
      var h = new Date().getHours();
      if (h < 11) return 'Selamat pagi';
      if (h < 15) return 'Selamat siang';
      if (h < 18) return 'Selamat sore';
      return 'Selamat malam';
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
  },
  methods: {
    go: function (path) {
      window.location.hash = path;
    },
  },
  template: `
    <main class="px-5 pt-4">
      <header class="flex items-center justify-between mb-6" style="margin-top:12px">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-full gradient-fill flex items-center justify-center shadow-glow">
            <span class="text-background text-sm font-bold">{{ initials }}</span>
          </div>
          <div>
            <p class="text-xs text-secondary">{{ greeting }},</p>
            <p class="text-base font-semibold leading-tight">{{ user ? user.name : '' }}</p>
          </div>
        </div>
        <button
          type="button"
          class="w-11 h-11 rounded-full bg-surface border border-edge flex items-center justify-center
                 text-primary active:opacity-60 transition"
          aria-label="Notifikasi"
          @click="actions.showToast('Tidak ada notifikasi baru', 'info')"
        >
          <span class="w-5 h-5" v-html="icons.bell"></span>
        </button>
      </header>

      <balance-card class="mb-4" />

      <quick-actions class="mb-8" />

      <section aria-label="Transaksi terbaru">
        <div class="flex items-center justify-between mb-1">
          <h2 class="text-base font-semibold" style="letter-spacing:-0.01em">Transaksi Terbaru</h2>
          <button
            type="button"
            class="text-xs font-semibold text-secondary active:text-primary transition min-h-[44px] px-1"
            @click="go('/riwayat')"
          >
            Lihat semua
          </button>
        </div>

        <div v-if="recent.length" class="divide-y divide-edge/60">
          <transaction-item v-for="tx in recent" :key="tx.id" :tx="tx" />
        </div>

        <div
          v-else
          class="rounded-panel bg-surface border border-edge p-6 text-center"
        >
          <p class="text-sm font-semibold mb-1">Belum ada transaksi</p>
          <p class="text-xs text-secondary mb-4">Tekan tombol + untuk mencatat transaksi pertama Anda.</p>
          <button
            type="button"
            class="bg-primary text-background text-xs font-semibold rounded-full px-5 min-h-[40px] active:opacity-80 transition"
            @click="go('/transaksi')"
          >
            Tambah transaksi
          </button>
        </div>
      </section>
    </main>
  `,
};
