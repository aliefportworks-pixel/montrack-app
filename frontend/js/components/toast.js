window.ToastComponent = {
  name: 'ToastComponent',
  computed: {
    toast: function () {
      return this.store.toast;
    },
  },
  template: `
    <transition name="fade">
      <div
        v-if="toast"
        class="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100%-40px)] w-fit"
        role="status"
      >
        <div
          class="flex items-center gap-2.5 px-4 py-3 rounded-panel border shadow-glow backdrop-blur-md"
          :class="toast.type === 'error'
            ? 'bg-danger/15 border-danger/40'
            : 'bg-success/15 border-success/40'"
        >
          <span
            class="w-5 h-5 shrink-0"
            :class="toast.type === 'error' ? 'text-danger' : 'text-success'"
            v-html="toast.type === 'error' ? icons.alert : icons.check"
          ></span>
          <p class="text-sm font-medium text-primary">{{ toast.message }}</p>
        </div>
      </div>
    </transition>
  `,
};
