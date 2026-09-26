window.HistoryView = {
  name: 'HistoryView',
  components: {
    TransactionItem: window.TransactionItem,
  },
  data: function () {
    return {
      query: '',
      limit: 20, // FR-04: 20 data terbaru, muat lebih banyak untuk pagination
      icons: Icons,
    };
  },
  computed: {
    filtered: function () {
      var q = this.query.trim().toLowerCase();
      var list = this.store.transactions;
      if (q) {
        list = list.filter(function (t) {
          return (
            String(t.note || '').toLowerCase().indexOf(q) !== -1 ||
            String(t.category || '').toLowerCase().indexOf(q) !== -1
          );
        });
      }
      return list;
    },
    visible: function () {
      return this.filtered.slice(0, this.limit);
    },
    groups: function () {
      var map = {};
      var order = [];
      this.visible.forEach(function (t) {
        if (!map[t.date]) {
          map[t.date] = [];
          order.push(t.date);
        }
        map[t.date].push(t);
      });
      return order.map(function (date) {
        return { date: date, items: map[date] };
      });
    },
    hasMore: function () {
      return this.filtered.length > this.limit;
    },
    total: function () {
      return this.filtered.length;
    },
  },
  methods: {
    loadMore: function () {
      this.limit += 20;
    },
    onDelete: function (tx) {
      var self = this;
      this.actions.askConfirm({
        title: 'Hapus transaksi?',
        icon: 'trash',
        tone: 'danger',
        message:
          'Transaksi "' +
          (tx.note || tx.category) +
          ' (' +
          this.$fmt.rupiah(tx.amount) +
          ')'
          + ' akan dihapus permanen.',
        confirmLabel: 'Hapus',
        onConfirm: async function () {
          try {
            await self.actions.removeTransaction(tx.id);
            self.actions.showToast('Transaksi dihapus', 'success');
          } catch (err) {
            self.actions.showToast(err.message || 'Gagal menghapus transaksi.', 'error');
          }
        },
      });
    },
  },
  template: `
    <main class="px-5 pt-4">
      <header style="margin-top:12px" class="mb-5">
        <h1 class="font-bold mb-4" style="font-size:32px;letter-spacing:-0.02em">Riwayat</h1>

        <div class="relative">
          <span
            class="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-secondary pointer-events-none"
            v-html="icons.search"
          ></span>
          <input
            v-model="query"
            type="search"
            placeholder="Cari catatan atau kategori…"
            class="w-full bg-surface border border-edge rounded-box pl-11 pr-4 py-3.5 text-sm text-primary
                   placeholder:text-secondary/70 outline-none focus:border-chart transition"
            aria-label="Cari transaksi"
          />
        </div>
        <p class="text-[11px] text-secondary mt-2">
          {{ total }} transaksi ditemukan · menampilkan {{ visible.length }}
        </p>
      </header>

      <div v-if="groups.length" class="pb-4">
        <section v-for="g in groups" :key="g.date" class="mb-2">
          <h2 class="text-xs font-semibold text-secondary uppercase tracking-wide py-2">
            {{ $fmt.dateLabel(g.date) }}
          </h2>
          <div class="divide-y divide-edge/60 bg-surface border border-edge rounded-panel px-4">
            <transaction-item
              v-for="tx in g.items"
              :key="tx.id"
              :tx="tx"
              deletable
              @delete="onDelete"
            />
          </div>
        </section>

        <div v-if="hasMore" class="text-center pt-2">
          <button
            type="button"
            class="bg-surface border border-edge text-sm font-semibold rounded-full px-6 active:opacity-70 transition"
            @click="loadMore"
          >
            Muat lebih banyak
          </button>
        </div>
      </div>

      <div v-else class="rounded-panel bg-surface border border-edge p-8 text-center mt-4">
        <p class="text-sm font-semibold mb-1">Tidak ada hasil</p>
        <p class="text-xs text-secondary">
          {{ query ? 'Coba kata kunci lain.' : 'Belum ada transaksi tercatat.' }}
        </p>
      </div>
    </main>
  `,
};
