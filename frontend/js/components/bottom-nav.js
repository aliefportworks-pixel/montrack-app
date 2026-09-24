window.BottomNav = {
  name: 'BottomNav',
  data: function () {
    return { icons: Icons };
  },
  computed: {
    path: function () {
      return this.store.route.path;
    },
  },
  methods: {
    go: function (path) {
      window.location.hash = path;
    },
    isActive: function (path) {
      if (path === '/') return this.path === '/';
      return this.path.indexOf(path) === 0;
    },
  },
  template: `
    <nav class="fixed bottom-5 left-1/2 -translate-x-1/2 z-40" aria-label="Navigasi utama">
      <div class="flex items-center gap-1 bg-surface/95 border border-edge rounded-full px-3 py-2 shadow-glow backdrop-blur-md">
        <button
          type="button"
          class="w-12 h-12 rounded-full flex items-center justify-center transition"
          :class="isActive('/') ? 'bg-primary text-background' : 'text-secondary'"
          aria-label="Beranda"
          @click="go('/')"
        >
          <span class="w-[22px] h-[22px]" v-html="icons.home"></span>
        </button>

        <button
          type="button"
          class="w-12 h-12 rounded-full flex items-center justify-center transition"
          :class="isActive('/riwayat') ? 'bg-primary text-background' : 'text-secondary'"
          aria-label="Riwayat"
          @click="go('/riwayat')"
        >
          <span class="w-[22px] h-[22px]" v-html="icons.wallet"></span>
        </button>

        <button
          type="button"
          class="w-14 h-14 -mt-8 mx-1 rounded-full bg-primary text-background flex items-center justify-center shadow-glow active:scale-95 transition min-w-[56px]"
          aria-label="Tambah transaksi"
          @click="go('/transaksi')"
        >
          <span class="w-6 h-6" v-html="icons.plus"></span>
        </button>

        <button
          type="button"
          class="w-12 h-12 rounded-full flex items-center justify-center transition"
          :class="isActive('/analitik') ? 'bg-primary text-background' : 'text-secondary'"
          aria-label="Analitik"
          @click="go('/analitik')"
        >
          <span class="w-[22px] h-[22px]" v-html="icons.chart"></span>
        </button>

        <button
          type="button"
          class="w-12 h-12 rounded-full flex items-center justify-center transition"
          :class="isActive('/pengaturan') ? 'bg-primary text-background' : 'text-secondary'"
          aria-label="Pengaturan"
          @click="go('/pengaturan')"
        >
          <span class="w-[22px] h-[22px]" v-html="icons.gear"></span>
        </button>
      </div>
    </nav>
  `,
};
