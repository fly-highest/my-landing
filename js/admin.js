// 관리자 페이지: 모든 회원의 결제 내역
// 화면 접근 확인은 편의용이고, 실제 데이터 보호는 DB 보안 규칙(is_admin)이 담당합니다.
async function loadAll() {
  const user = await requireLogin();
  if (!user) return;
  if (user.email !== ADMIN_EMAIL) {
    alert('관리자만 볼 수 있는 페이지입니다.');
    location.href = 'index.html';
    return;
  }

  const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false });
  const rows = document.getElementById('rows');
  if (error) {
    rows.innerHTML = '<tr><td colspan="6">내역을 불러오지 못했습니다.</td></tr>';
    return;
  }

  const paid = data.filter((o) => o.status === 'paid');
  document.getElementById('paid-count').textContent = paid.length + '건';
  document.getElementById('total').textContent = won(paid.reduce((sum, o) => sum + o.amount, 0));

  if (data.length === 0) {
    rows.innerHTML = '<tr><td colspan="6">아직 결제 내역이 없습니다.</td></tr>';
    return;
  }
  rows.innerHTML = data.map((o) => `
    <tr>
      <td>${formatDate(o.created_at)}</td>
      <td>${escapeHtml(o.user_email)}</td>
      <td>${escapeHtml(o.product_name)}</td>
      <td>${won(o.amount)}</td>
      <td>${statusBadge(o.status)}</td>
      <td>${escapeHtml(o.order_id)}</td>
    </tr>`).join('');
}

loadAll();
