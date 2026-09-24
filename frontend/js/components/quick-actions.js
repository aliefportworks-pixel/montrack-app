window.QuickActions = {
  name: 'QuickActions',
  data: function () {
    return { icons: Icons };
  },
  methods: {
    open: function (type) {
      window.location.hash = '/transaksi' + (type ? '?type=' + type : '');
    },
  },
  template: `
    <section class="grid grid-cols-3 gap-3" aria-label="Aksi cepat">
      <button
        type="button"
        class="bg-surface border border-edge rounded-box flex flex-col items-center justify-center gap-1.5
               py-4 min-h-[76px] active:opacity-70 transition"
        @click="open('out')"
      >
        <span class="w-5 h-5 text-primary" v-html="icons.arrowUpRight"></span>
        <span class="text-xs font-semibold">Keluar</span>
      </button>

      <button
        type="button"
        class="bg-surface border border-edge rounded-box flex flex-col items-center justify-center gap-1.5
               py-4 min-h-[76px] active:opacity-70 transition"
        @click="open('in')"
      >
        <span class="w-5 h-5 text-primary" v-html="icons.arrowDownLeft"></span>
        <span class="text-xs font-semibold">Masuk</span>
      </button>

      <button
        type="button"
        class="bg-primary text-background rounded-box flex flex-col items-center justify-center gap-1.5
               py-4 min-h-[76px] font-semibold active:opacity-80 transition"
        @click="open('')"
      >
        <span class="w-5 h-5" v-html="icons.plus"></span>
        <span class="text-xs font-semibold">Tambah</span>
      </button>
    </section>
  `,
};
