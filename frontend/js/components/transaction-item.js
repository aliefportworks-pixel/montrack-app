window.TransactionItem = {
  name: 'TransactionItem',
  props: {
    tx: { type: Object, required: true },
    deletable: { type: Boolean, default: false },
  },
  emits: ['delete'],
  data: function () {
    return { icons: Icons };
  },
  computed: {
    icon: function () {
      return this.$fmt.categoryIcon(this.store.categories, this.tx.category);
    },
    title: function () {
      return this.tx.note || this.tx.category;
    },
    subtitle: function () {
      return this.tx.category + ' · ' + this.$fmt.shortDate(this.tx.date);
    },
    amountLabel: function () {
      var sign = this.tx.type === 'in' ? '+' : '-';
      return sign + this.$fmt.rupiah(this.tx.amount);
    },
  },
  template: `
    <div class="flex items-center gap-3 py-3">
      <div class="w-11 h-11 shrink-0 rounded-full bg-variant border border-edge flex items-center justify-center text-lg">
        {{ icon }}
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-primary truncate">{{ title }}</p>
        <p class="text-xs text-secondary truncate mt-0.5">{{ subtitle }}</p>
      </div>

      <p class="text-sm font-semibold tabular-nums shrink-0"
         :class="tx.type === 'in' ? 'text-chart' : 'text-primary'">
        {{ amountLabel }}
      </p>

      <button
        v-if="deletable"
        type="button"
        class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-secondary
               hover:text-danger active:opacity-60 transition"
        aria-label="Hapus transaksi"
        @click="$emit('delete', tx)"
      >
        <span class="w-4.5 h-4.5 w-[18px] h-[18px]" v-html="icons.trash"></span>
      </button>
    </div>
  `,
};
