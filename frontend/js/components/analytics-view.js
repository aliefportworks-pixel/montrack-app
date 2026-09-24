window.AnalyticsView = {
  name: 'AnalyticsView',
  data: function () {
    return {
      type: 'out',
      activeIndex: -1,
      period: 'week',
      icons: Icons,
    };
  },
  computed: {
    days: function () {
      return this.$fmt.weekDays();
    },
    series: function () {
      return this.$fmt.weeklySeries(this.store.transactions, this.type);
    },
    total: function () {
      return this.series.reduce(function (sum, v) {
        return sum + v;
      }, 0);
    },
    max: function () {
      return Math.max.apply(null, this.series.concat([1]));
    },
    activeIdx: function () {
      if (this.activeIndex >= 0) return this.activeIndex;
      var series = this.series;
      var maxV = 0;
      var idx = 0;
      series.forEach(function (v, i) {
        if (v > maxV) {
          maxV = v;
          idx = i;
        }
      });
      return idx;
    },
    activeValue: function () {
      return this.series[this.activeIdx] || 0;
    },
    categoryRows: function () {
      var rows = this.$fmt.byCategory(this.store.transactions, this.type).slice(0, 6);
      var cats = this.store.categories;
      return rows.map(function (r) {
        return {
          name: r.name,
          amount: r.amount,
          icon: Utils.categoryIcon(cats, r.name),
        };
      });
    },
    typeLabel: function () {
      return this.type === 'in' ? 'Pemasukan' : 'Pengeluaran';
    },
  },
  methods: {
    setType: function (t) {
      this.type = t;
      this.activeIndex = -1;
    },
    selectBar: function (i) {
      this.activeIndex = i;
    },
    barHeight: function (v) {
      if (this.max <= 0) return '8%';
      var h = Math.max(6, Math.round((v / this.max) * 100));
      return h + '%';
    },
    back: function () {
      window.location.hash = '/';
    },
  },
  template: `
    <main class="px-5 pt-4">
      <header class="flex items-center justify-between mb-6" style="margin-top:12px">
        <button
          type="button"
          class="w-11 h-11 rounded-full bg-surface border border-edge flex items-center justify-center active:opacity-60 transition"
          aria-label="Kembali"
          @click="back"
        >
          <span class="w-5 h-5" v-html="icons.chevronLeft"></span>
        </button>
        <h1 class="text-base font-semibold">Analitik</h1>
        <button
          type="button"
          class="w-11 h-11 rounded-full bg-surface border border-edge flex items-center justify-center active:opacity-60 transition"
          aria-label="Opsi lain"
          @click="actions.showToast('Opsi periode lain menyusul', 'info')"
        >
          <span class="w-5 h-5" v-html="icons.dots"></span>
        </button>
      </header>

      <div class="grid grid-cols-2 gap-2 p-1 bg-surface border border-edge rounded-full mb-6">
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

      <section class="mb-6" aria-label="Grafik mingguan">
        <div class="flex items-center justify-between mb-4">
          <p class="font-bold tabular-nums" style="font-size:32px;letter-spacing:-0.02em">
            {{ $fmt.rupiah(total) }}
          </p>
          <div class="relative">
            <select
              v-model="period"
              class="bg-surface border border-edge rounded-full pl-4 pr-9 py-2.5 text-xs font-semibold
                     text-primary outline-none min-h-[40px]"
              aria-label="Periode"
            >
              <option value="week">Minggu ini</option>
            </select>
            <span
              class="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary pointer-events-none"
              v-html="icons.chevronDown"
            ></span>
          </div>
        </div>

        <div class="rounded-panel bg-surface border border-edge p-4 pb-3">
          <div class="relative flex items-end justify-between gap-2 h-36 mb-2">
            <div
              v-if="series[activeIdx] > 0"
              class="absolute z-10 -translate-x-1/2 transition-all duration-300"
              :style="{ left: ((activeIdx + 0.5) / 7 * 100) + '%', top: '0px' }"
            >
              <span class="block bg-variant border border-edge text-[11px] font-semibold px-2.5 py-1 rounded-chip whitespace-nowrap">
                {{ $fmt.rupiah(activeValue) }}
              </span>
            </div>

            <button
              v-for="(v, i) in series"
              :key="i"
              type="button"
              class="flex-1 h-full flex items-end"
              :aria-label="days[i] + ': ' + $fmt.rupiah(v)"
              @click="selectBar(i)"
            >
              <span
                class="bar w-full rounded-t-md"
                :class="i === activeIdx && v > 0 ? 'gradient-fill' : 'bg-variant'"
                :style="{ height: barHeight(v) }"
              ></span>
            </button>
          </div>

          <div class="flex justify-between gap-2">
            <span
              v-for="(d, i) in days"
              :key="i"
              class="flex-1 text-center text-[11px] font-medium"
              :class="i === activeIdx ? 'text-primary' : 'text-secondary'"
            >
              {{ d }}
            </span>
          </div>
        </div>
        <p class="text-[11px] text-secondary mt-2">Total {{ typeLabel }} minggu ini · ketuk batang untuk detail</p>
      </section>

      <section class="pb-4" aria-label="Kategori">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold" style="letter-spacing:-0.01em">Per Kategori</h2>
        </div>

        <div v-if="categoryRows.length" class="grid grid-cols-2 gap-3">
          <div
            v-for="row in categoryRows"
            :key="row.name"
            class="bg-surface border border-edge rounded-panel p-4 aspect-[1.2/1] flex flex-col justify-between"
          >
            <div class="flex items-center justify-between">
              <span class="text-lg">{{ row.icon }}</span>
            </div>
            <div>
              <p class="text-xs text-secondary mb-1 truncate">{{ row.name }}</p>
              <p class="text-sm font-semibold tabular-nums truncate">{{ $fmt.rupiah(row.amount) }}</p>
            </div>
          </div>
        </div>

        <div v-else class="rounded-panel bg-surface border border-edge p-6 text-center">
          <p class="text-sm font-semibold mb-1">Belum ada data</p>
          <p class="text-xs text-secondary">Tidak ada {{ typeLabel.toLowerCase() }} minggu ini.</p>
        </div>
      </section>
    </main>
  `,
};
