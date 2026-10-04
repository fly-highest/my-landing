// 로그인 / 회원가입 (이메일 인증 없이 바로 가입됨)
let mode = 'login';

function setMode(next) {
  mode = next;
  document.getElementById('tab-login').className = mode === 'login' ? '' : 'secondary';
  document.getElementById('tab-signup').className = mode === 'signup' ? '' : 'secondary';
  document.getElementById('submit').textContent = mode === 'login' ? '로그인' : '회원가입';
  document.getElementById('message').textContent = '';
}

document.getElementById('tab-login').addEventListener('click', () => setMode('login'));
document.getElementById('tab-signup').addEventListener('click', () => setMode('signup'));

document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const message = document.getElementById('message');

  const { error } = mode === 'login'
    ? await sb.auth.signInWithPassword({ email, password })
    : await sb.auth.signUp({ email, password });

  if (error) {
    message.className = 'message';
    message.textContent = error.message === 'Invalid login credentials'
      ? '이메일 또는 비밀번호가 맞지 않습니다.'
      : error.message;
    return;
  }
  location.href = email === ADMIN_EMAIL ? 'admin.html' : 'index.html';
});
