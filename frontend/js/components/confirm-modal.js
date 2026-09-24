window.ConfirmModal = {
  name: 'ConfirmModal',
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
          <div class="w-11 h-11 rounded-full bg-variant flex items-center justify-center mb-4 text-danger">
            <span class="w-5 h-5" v-html="icons.trash"></span>
          </div>
          <h3 class="font-semibold mb-1.5" style="font-size:20px;letter-spacing:-0.01em">
            Hapus transaksi?
          </h3>
          <p class="text-sm text-secondary leading-relaxed mb-6">
            {{ store.confirm ? store.confirm.message : '' }}
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
              class="flex-1 rounded-box bg-danger text-white font-semibold text-sm min-h-[44px] active:opacity-70 transition"
              @click="confirm"
            >
              {{ store.confirm ? store.confirm.confirmLabel : 'Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  `,
};
