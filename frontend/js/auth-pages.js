(async function authPages() {
  await App.initAuth();
  if (App.user) {
    const next = new URLSearchParams(window.location.search).get('next') || '/';
    window.location.href = next;
    return;
  }

  const loginForm = App.qs('#loginForm');
  const registerForm = App.qs('#registerForm');
  const alertBox = App.qs('#alert');

  function showError(msg) {
    if (!alertBox) return;
    alertBox.innerHTML = `<div class="alert alert-error">${App.escape(msg)}</div>`;
  }

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await Api.post('/auth/login', {
        email: App.qs('#email').value.trim(),
        password: App.qs('#password').value,
      });
      Api.setToken(res.data.token);
      App.toast('Login successful', 'success');
      const next = new URLSearchParams(window.location.search).get('next') || '/';
      window.location.href = next;
    } catch (err) {
      showError(err.message);
      btn.disabled = false;
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = registerForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await Api.post('/auth/register', {
        name: App.qs('#name').value.trim(),
        email: App.qs('#email').value.trim(),
        password: App.qs('#password').value,
      });
      Api.setToken(res.data.token);
      App.toast('Welcome to MARQUEE!', 'success');
      window.location.href = '/';
    } catch (err) {
      showError(err.message);
      btn.disabled = false;
    }
  });
})();
