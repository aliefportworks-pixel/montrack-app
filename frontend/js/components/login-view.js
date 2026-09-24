window.LoginView = {
  name: 'LoginView',
  data: function () {
    return {
      email: '',
      error: '',
      submitting: false,
      icons: Icons,
    };
  },
  methods: {
    submit: async function () {
      this.error = '';
      var email = this.email.trim();
      if (!email) {
        this.error = 'Email wajib diisi.';
        return;
      }
      if (!this.$fmt.isValidEmail(email)) {
        this.error = 'Format email tidak valid.';
        return;
      }
      this.submitting = true;
      try {
        await this.actions.login(email);
      } catch (err) {
        this.error = err.message || 'Gagal masuk. Coba lagi.';
      } finally {
        this.submitting = false;
      }
    },
  },
  template: `
    <main class="min-h-screen flex flex-col justify-center px-5 py-10">
      <div class="w-full max-w-sm mx-auto">
        <div class="w-16 h-16 rounded-card gradient-fill flex items-center justify-center shadow-glow mb-6">
          <span class="text-background font-bold text-2xl">M</span>
        </div>

        <h1 class="font-bold leading-tight" style="font-size:32px;letter-spacing:-0.02em">
          Montrack
        </h1>
        <p class="text-secondary text-sm mt-2 mb-8 leading-relaxed">
          Catat keuangan pribadi dalam hitungan detik. Data Anda tersimpan di Google Sheets milik Anda sendiri.
        </p>

        <form @submit.prevent="submit" novalidate>
          <label for="email" class="block text-xs font-medium text-secondary mb-2">Email</label>
          <div class="relative mb-2">
            <input
              id="email"
              v-model="email"
              type="email"
              inputmode="email"
              autocomplete="email"
              placeholder="nama@email.com"
              class="w-full bg-surface border rounded-box px-4 py-3.5 text-sm text-primary placeholder:text-secondary/70
                     outline-none focus:border-chart transition"
              :class="error ? 'border-danger' : 'border-edge'"
            />
          </div>
          <p v-if="error" class="text-xs text-danger mb-4">{{ error }}</p>
          <div v-else class="h-4"></div>

          <button
            type="submit"
            class="w-full bg-primary text-background font-semibold text-sm rounded-box min-h-[48px]
                   flex items-center justify-center gap-2 active:opacity-80 transition"
            :disabled="submitting"
          >
            <spinner-component v-if="submitting" />
            <span v-else>Masuk</span>
          </button>
        </form>

        <p class="text-[11px] text-secondary text-center mt-6 leading-relaxed">
          FR-01 · Identifikasi berbasis email unik.<br />
          Tidak ada password — cukup email yang sama untuk memuat data Anda.
        </p>
      </div>
    </main>
  `,
};
