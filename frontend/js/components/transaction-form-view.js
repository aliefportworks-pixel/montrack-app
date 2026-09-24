window.TransactionFormView = {
  name: 'TransactionFormView',
  data: function () {
    var queryType = this.store.route.query.type;
    return {
      type: queryType === 'in' ? 'in' : 'out',
      amountRaw: '',
      category: '',
      date: this.$fmt.todayISO(),
      note: '',
      error: '',
      saving: false,
      icons: Icons,
    };
  },
  computed: {
    categories: function () {
      return this.store.categories;
    },
    amountNumber: function () {
      var digits = String(this.amountRaw).replace(/[^\d]/g, '');
      return digits ? Number(digits) : 0;
    },
    amountDisplay: function () {
      if (!this.amountNumber) return 'Rp 0';
      return this.$fmt.rupiah(this.amountNumber);
    },
    typeLabel: function () {
      return this.type === 'in' ? 'Pemasukan' : 'Pengeluaran';
    },
    dateLabel: function () {
      if (this.date === this.$fmt.todayISO()) return 'Hari ini, ' + this.$fmt.shortDate(this.date);
      return this.$fmt.dateLabel(this.date);
    },
  },
  watch: {
    amountRaw: function (val) {
      var digits = String(val).replace(/[^\d]/g, '');
      this.amountRaw = digits ? String(Number(digits)) : '';
    },
  },
  methods: {
    setType: function (t) {
      this.type = t;
    },
    cancel: function () {
      window.location.hash = '/';
    },
    attach: function () {
      this.actions.showToast('Lampiran belum tersedia di MVP', 'info');
    },
    submit: async function () {
      this.error = '';
      if (!(this.amountNumber > 0)) {
        this.error = 'Nominal harus lebih dari 0.';
        return;
      }
      if (!this.category) {
        this.error = 'Kategori wajib dipilih.';
        return;
      }
      if (!this.date) {
        this.error = 'Tanggal wajib diisi.';
        return;
      }

      this.saving = true;
      try {
        await this.actions.saveTransaction({
          type: this.type,
          category: this.category,
          date: this.date,
          amount: this.amountNumber,
          note: this.note.trim(),
        });
        this.actions.showToast('Transaksi berhasil disimpan', 'success');
        window.location.hash = '/';
      } catch (err) {
        // US-08: form TIDAK dikosongkan saat gagal kirim
        this.error = err.message || 'Gagal menyimpan data. Periksa koneksi Anda.';
        this.actions.showToast(this.error, 'error');
      } finally {
        this.saving = false;
      }
    },
  },
  template: `
    <main class="min-h-screen flex flex-col px-5 pt-4 pb-6">
      <header class="flex items-center justify-between mb-6" style="margin-top:12px">
        <button
          type="button"
          class="w-11 h-11 rounded-full bg-surface border border-edge flex items-center justify-center active:opacity-60 transition"
          aria-label="Batal"
          @click="cancel"
        >
          <span class="w-5 h-5" v-html="icons.x"></span>
        </button>
        <h1 class="text-base font-semibold">Transaksi Baru</h1>
        <div class="w-11"></div>
      </header>

      <div class="grid grid-cols-2 gap-2 p-1 bg-surface border border-edge rounded-full mb-5">
        <button
          type="button"
          class="rounded-full text-sm font-semibold min-h-[40px] transition"
          :class="type === 'out' ? 'bg-primary text-background' : 'text-secondary'"
          @click="setType('out')"
        >
          Pengeluaran
        </button>
        <button
          type="button"
          class="rounded-full text-sm font-semibold min-h-[40px] transition"
          :class="type === 'in' ? 'bg-primary text-background' : 'text-secondary'"
          @click="setType('in')"
        >
          Pemasukan
        </button>
      </div>

      <div class="mesh-card rounded-card px-5 py-6 mb-6 shadow-glow text-center">
        <p class="text-xs font-medium text-white/85 mb-2">Nominal · {{ typeLabel }}</p>
        <input
          v-model="amountRaw"
          type="text"
          inputmode="numeric"
          placeholder="Rp 0"
          class="w-full bg-transparent text-center text-white font-bold outline-none placeholder:text-white/50"
          style="font-size:32px;letter-spacing:-0.02em"
          aria-label="Nominal transaksi"
        />
      </div>

      <div class="space-y-4 flex-1">
        <div>
          <label for="category" class="block text-xs font-medium text-secondary mb-2">Kategori</label>
          <div class="relative">
            <select
              id="category"
              v-model="category"
              class="w-full bg-surface border border-edge rounded-box px-4 py-3.5 pr-11 text-sm text-primary
                     outline-none focus:border-chart transition"
            >
              <option value="" disabled>Pilih kategori</option>
              <option v-for="c in categories" :key="c.id" :value="c.name">
                {{ c.icon }} {{ c.name }}
              </option>
            </select>
            <span
              class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none"
              v-html="icons.chevronDown"
            ></span>
          </div>
        </div>

        <div>
          <label for="date" class="block text-xs font-medium text-secondary mb-2">Tanggal</label>
          <div class="relative">
            <input
              id="date"
              v-model="date"
              type="date"
              class="w-full bg-surface border border-edge rounded-box px-4 py-3.5 pr-11 text-sm text-primary
                     outline-none focus:border-chart transition"
            />
            <span
              class="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px] text-secondary pointer-events-none"
              v-html="icons.calendar"
            ></span>
          </div>
          <p class="text-[11px] text-secondary mt-1.5">{{ dateLabel }}</p>
        </div>

        <div>
          <label for="note" class="block text-xs font-medium text-secondary mb-2">Catatan</label>
          <textarea
            id="note"
            v-model="note"
            rows="3"
            maxlength="200"
            placeholder="Contoh: Makan siang bersama tim"
            class="w-full bg-surface border border-edge rounded-box px-4 py-3.5 text-sm text-primary
                   placeholder:text-secondary/70 outline-none focus:border-chart transition resize-none"
          ></textarea>
        </div>

        <p v-if="error" class="text-xs text-danger flex items-center gap-1.5">
          <span class="w-4 h-4 shrink-0" v-html="icons.alert"></span>
          {{ error }}
        </p>
      </div>

      <footer class="flex items-center justify-between gap-3 pt-6">
        <button
          type="button"
          class="w-14 h-14 rounded-box bg-surface border border-edge flex items-center justify-center text-secondary
                 active:opacity-60 transition"
          aria-label="Batal"
          @click="cancel"
        >
          <span class="w-5 h-5" v-html="icons.x"></span>
        </button>

        <button
          type="button"
          class="w-14 h-14 rounded-box bg-variant border border-edge flex items-center justify-center text-secondary/50 cursor-not-allowed"
          aria-label="Lampiran (belum tersedia)"
          disabled
          @click="attach"
        >
          <span class="w-5 h-5" v-html="icons.clip"></span>
        </button>

        <button
          type="button"
          class="flex-1 h-14 rounded-box bg-primary text-background font-semibold text-sm flex items-center justify-center gap-2
                 active:opacity-80 transition disabled:opacity-60"
          :disabled="saving"
          aria-label="Simpan transaksi"
          @click="submit"
        >
          <spinner-component v-if="saving" />
          <template v-else>
            <span class="w-5 h-5" v-html="icons.check"></span>
            Simpan
          </template>
        </button>
      </footer>
    </main>
  `,
};
