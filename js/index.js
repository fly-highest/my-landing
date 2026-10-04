// 상품 목록 + 토스 결제위젯
let widgets = null;
let selected = null;

async function loadProducts() {
  const { data, error } = await sb.from('products').select('*').order('id');
  const box = document.getElementById('products');
  if (error) {
    box.textContent = '상품을 불러오지 못했습니다.';
    return;
  }
  box.innerHTML = data.map((p) => `
    <div class="card">
      <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}">
      <div class="body">
        <div class="name">${escapeHtml(p.name)}</div>
        <div class="desc">${escapeHtml(p.description)}</div>
        <div class="price">${won(p.price)}</div>
        <button data-id="${p.id}">구매하기</button>
      </div>
    </div>`).join('');

  box.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => openCheckout(data.find((p) => p.id === Number(btn.dataset.id))));
  });
}

async function openCheckout(product) {
  const user = await requireLogin();
  if (!user) return;

  selected = product;
  document.getElementById('checkout-title').textContent = product.name;
  document.getElementById('checkout-price').textContent = won(product.price);
  document.getElementById('message').textContent = '';
  const section = document.getElementById('checkout');
  section.hidden = false;

  // 결제위젯은 처음 한 번만 그리고, 이후에는 금액만 바꿉니다
  if (!widgets) {
    widgets = TossPayments(TOSS_CLIENT_KEY).widgets({ customerKey: user.id });
    await widgets.setAmount({ currency: 'KRW', value: product.price });
    await Promise.all([
      widgets.renderPaymentMethods({ selector: '#payment-method', variantKey: 'DEFAULT' }),
      widgets.renderAgreement({ selector: '#agreement', variantKey: 'AGREEMENT' }),
    ]);
  } else {
    await widgets.setAmount({ currency: 'KRW', value: product.price });
  }
  section.scrollIntoView({ behavior: 'smooth' });
}

async function pay() {
  const message = document.getElementById('message');
  const payBtn = document.getElementById('pay');
  payBtn.disabled = true;
  message.textContent = '';

  // 주문 생성 (가격은 서버(DB)가 정함)
  const { data, error } = await sb.rpc('create_order', { p_product_id: selected.id });
  if (error) {
    message.textContent = '주문 생성 실패: ' + error.message;
    payBtn.disabled = false;
    return;
  }
  const order = data[0];
  const user = await getUser();

  try {
    await widgets.setAmount({ currency: 'KRW', value: order.amount });
    await widgets.requestPayment({
      orderId: order.order_id,
      orderName: order.product_name,
      customerEmail: user.email,
      successUrl: new URL('success.html', location.href).href,
      failUrl: new URL('fail.html', location.href).href,
    });
  } catch (e) {
    // 결제창을 닫는 등 바로 실패한 경우
    message.textContent = e.message;
    await sb.functions.invoke('confirm-payment', { body: { orderId: order.order_id, fail: true } });
    payBtn.disabled = false;
  }
}

document.getElementById('pay').addEventListener('click', pay);
document.getElementById('cancel').addEventListener('click', () => {
  document.getElementById('checkout').hidden = true;
});

loadProducts();
