window.BalanceCard = {
  name: 'BalanceCard',
  data: function () {
    return { icons: Icons };
  },
  computed: {
    stats: function () {
      return this.store.stats;
    },
    shown: function () {
      return this.store.showBalance;
    },
    balanceLabel: function () {
      return this.shown ? this.$fmt.rupiah(this.stats.balance) : 'Rp ••••••';
    },
    incomeLabel: function () {
      return this.shown ? this.$fmt.rupiah(this.stats.income) : 'Rp •••';
    },
    expenseLabel: function () {
      return this.shown ? this.$fmt.rupiah(this.stats.expense) : 'Rp •••';
    },
  },
  template: `
    <section class="mesh-card rounded-card p-5 shadow-glow aspect-[1.6/1] flex flex-col justify-between"
             aria-label="Ringkasan saldo">
      <div class="flex items-start justify-between">
        <button
          type="button"
          class="flex items-center gap-1.5 bg-black/35 backdrop-blur-sm text-white text-xs font-semibold
                 px-3 py-2 rounded-full min-h-[36px] active:opacity-70 transition"
          @click="actions.showToast('Hanya satu dompet untuk saat ini', 'info')"
        >
          Dompet Utama •••• 6510
          <span class="w-3.5 h-3.5" v-html="icons.chevronDown"></span>
        </button>
        <button
          type="button"
          class="w-9 h-9 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center text-white active:opacity-70 transition"
          :aria-label="shown ? 'Sembunyikan saldo' : 'Tampilkan saldo'"
          @click="actions.toggleBalance()"
        >
          <span class="w-4.5 h-4.5 w-[18px] h-[18px]" v-html="shown ? icons.eye : icons.eyeOff"></span>
        </button>
      </div>

      <div>
        <p class="text-xs font-medium text-white/85 mb-1">Total Saldo</p>
        <p class="text-white font-bold leading-none"
           style="font-size:32px;letter-spacing:-0.02em;text-shadow:0 2px 12px rgba(0,0,0,0.35)">
          {{ balanceLabel }}
        </p>
        <div class="flex gap-4 mt-3">
          <p class="text-[11px] font-medium text-white/85">
            Masuk <span class="text-white">{{ incomeLabel }}</span>
          </p>
          <p class="text-[11px] font-medium text-white/85">
            Keluar <span class="text-white">{{ expenseLabel }}</span>
          </p>
        </div>
      </div>
    </section>
  `,
};
