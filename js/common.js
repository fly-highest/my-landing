// 모든 페이지 공통: 상단 메뉴, 로그인 확인

async function getUser() {
  const { data: { session } } = await sb.auth.getSession();
  return session ? session.user : null;
}

// 로그인 안 했으면 로그인 페이지로 보냄
async function requireLogin() {
  const user = await getUser();
  if (!user) location.href = 'login.html';
  return user;
}

function won(n) {
  return n.toLocaleString('ko-KR') + '원';
}

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleString('ko-KR') : '-';
}

const STATUS_LABEL = { pending: '결제대기', paid: '결제완료', failed: '결제실패' };

function statusBadge(status) {
  return `<span class="badge ${status}">${STATUS_LABEL[status]}</span>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

async function renderNav() {
  const user = await getUser();
  const nav = document.getElementById('nav');
  let links = '<a href="index.html">상품</a>';
  if (user) {
    links += '<a href="orders.html">내 결제 내역</a>';
    if (user.email === ADMIN_EMAIL) links += '<a href="admin.html">관리자</a>';
    links += `<span class="me">${escapeHtml(user.email)}</span><button id="logout" class="link">로그아웃</button>`;
  } else {
    links += '<a href="login.html">로그인</a>';
  }
  nav.innerHTML = `<a class="logo" href="index.html">GOODS SHOP</a><div class="links">${links}</div>`;

  const logout = document.getElementById('logout');
  if (logout) {
    logout.addEventListener('click', async () => {
      await sb.auth.signOut();
      location.href = 'index.html';
    });
  }
}

renderNav();
