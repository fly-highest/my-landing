// 내 결제 내역 (보안 규칙 때문에 본인 주문만 내려옴)
async function loadOrders() {
  const user = await requireLogin();
  if (!user) return;

  const { data, error } = await sb
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const rows = document.getElementById('rows');
  if (error) {
    rows.innerHTML = '<tr><td colspan="4">내역을 불러오지 못했습니다.</td></tr>';
    return;
  }
  if (data.length === 0) {
    rows.innerHTML = '<tr><td colspan="4">아직 결제 내역이 없습니다.</td></tr>';
    return;
  }
  rows.innerHTML = data.map((o) => `
    <tr>
      <td>${formatDate(o.created_at)}</td>
      <td>${escapeHtml(o.product_name)}</td>
      <td>${won(o.amount)}</td>
      <td>${statusBadge(o.status)}</td>
    </tr>`).join('');
}

loadOrders();
