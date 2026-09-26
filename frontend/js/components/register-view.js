window.RegisterView = {
  name: 'RegisterView',
  data: function () {
    return {
      email: '',
      password: '',
      confirm: '',
      showPassword: false,
      error: '',
      submitting: false,
      icons: Icons,
    };
  },
  methods: {
    submit: async function () {
      this.error = '';
      var email = this.email.trim();
      var password = this.password;
      if (!email) {
        this.error = 'Email wajib diisi.';
        return;
      }
      if (!this.$fmt.isValidEmail(email)) {
        this.error = 'Format email tidak valid.';
        return;
      }
      if (!password) {
        this.error = 'Password wajib diisi.';
        return;
      }
      if (!this.$fmt.isValidPassword(password)) {
        this.error = 'Password minimal 8 karakter.';
        return;
      }
      if (password !== this.confirm) {
        this.error = 'Password tidak cocok.';
        return;
      }
      this.submitting = true;
      try {
        await this.actions.register(email, password);
        this.actions.showToast('Akun berhasil dibuat. Selamat datang!', 'success');
      } catch (err) {
        this.error = err.message || 'Gagal mendaftar. Coba lagi.';
      } finally {
        this.submitting = false;
      }
    },
    togglePassword: function () {
      this.showPassword = !this.showPassword;
    },
  },
  template: `
    <main class="min-h-screen flex flex-col justify-center px-5 py-10">
      <div class="w-full max-w-sm mx-auto">
        <div class="w-16 h-16 rounded-card gradient-fill flex items-center justify-center shadow-glow mb-6">
          <span class="text-background font-bold text-2xl">M</span>
        </div>

        <h1 class="font-bold leading-tight" style="font-size:32px;letter-spacing:-0.02em">
          Buat Akun
        </h1>
        <p class="text-secondary text-sm mt-2 mb-8 leading-relaxed">
          Daftar dengan email + password untuk mulai mencatat. Punya data lama dengan email sama?
          Daftar memakai email tersebut — transaksi lama otomatis terpakai.
        </p>

        <form @submit.prevent="submit" novalidate>
          <label for="reg-email" class="block text-xs font-medium text-secondary mb-2">Email</label>
          <div class="relative mb-4">
            <input
              id="reg-email"
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

          <label for="reg-password" class="block text-xs font-medium text-secondary mb-2">Password</label>
          <div class="relative mb-4">
            <input
              id="reg-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Minimal 8 karakter"
              class="w-full bg-surface border rounded-box px-4 py-3.5 pr-12 text-sm text-primary placeholder:text-secondary/70
                     outline-none focus:border-chart transition"
              :class="error ? 'border-danger' : 'border-edge'"
            />
            <button
              type="button"
              @click="togglePassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary text-xs font-semibold"
              tabindex="-1"
            >
              {{ showPassword ? 'Sembunyikan' : 'Lihat' }}
            </button>
          </div>

          <label for="reg-confirm" class="block text-xs font-medium text-secondary mb-2">Ulangi Password</label>
          <div class="relative mb-2">
            <input
              id="reg-confirm"
              v-model="confirm"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Ketik ulang password"
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
            <span v-else>Daftar</span>
          </button>
        </form>

        <p class="text-sm text-secondary text-center mt-6">
          Sudah punya akun?
          <a href="#/login" class="text-chart font-semibold">Masuk</a>
        </p>
      </div>
    </main>
  `,
};
