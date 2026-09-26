window.ConfirmModal = {
  name: 'ConfirmModal',
  computed: {
    conf: function () {
      var c = this.store.confirm;
      return (
        c || {
          title: 'Hapus transaksi?',
          icon: 'trash',
          tone: 'danger',
          message: '',
          confirmLabel: 'Hapus',
        }
      );
    },
    iconHtml: function () {
      return this.icons[this.conf.icon] || this.icons.trash;
    },
    confirmBtnClass: function () {
      return this.conf.tone === 'primary'
        ? 'flex-1 rounded-box bg-primary text-background font-semibold text-sm min-h-[44px] active:opacity-70 transition'
        : 'flex-1 rounded-box bg-danger text-white font-semibold text-sm min-h-[44px] active:opacity-70 transition';
    },
  },
  methods: {
    cancel: function () {
      this.actions.closeConfirm();
    },
    confirm: function () {
      var handler = this.store.confirm && this.store.confirm.onConfirm;
      this.actions.closeConfirm();
      if (handler) handler();
    },
  },
  template: `
    <transition name="fade">
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-5 bg-black/70 backdrop-blur-sm"
           @click.self="cancel">
        <div class="w-full max-w-sm bg-surface border border-edge rounded-card p-6 shadow-glow">
          <div
            class="w-11 h-11 rounded-full bg-variant flex items-center justify-center mb-4"
            :class="conf.tone === 'primary' ? 'text-chart' : 'text-danger'"
          >
            <span class="w-5 h-5" v-html="iconHtml"></span>
          </div>
          <h3 class="font-semibold mb-1.5" style="font-size:20px;letter-spacing:-0.01em">
            {{ conf.title }}
          </h3>
          <p class="text-sm text-secondary leading-relaxed mb-6">
            {{ conf.message }}
          </p>
          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-box bg-variant text-primary font-semibold text-sm min-h-[44px] active:opacity-70 transition"
              @click="cancel"
            >
              Batal
            </button>
            <button
              type="button"
              :class="confirmBtnClass"
              @click="confirm"
            >
              {{ conf.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  `,
};
