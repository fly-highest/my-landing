// 토스 결제 성공 후 돌아오는 페이지: 서버 함수로 최종 승인 요청
async function confirmPayment() {
  const params = new URLSearchParams(location.search);
  const title = document.getElementById('title');
  const message = document.getElementById('message');

  const { data, error } = await sb.functions.invoke('confirm-payment', {
    body: {
      paymentKey: params.get('paymentKey'),
      orderId: params.get('orderId'),
      amount: Number(params.get('amount')),
    },
  });

  if (error) {
    const detail = error.context ? await error.context.json().catch(() => null) : null;
    // 새로고침 등으로 이미 승인된 주문이면 완료로 표시
    if (detail?.status === 'paid') {
      title.textContent = '결제 완료!';
      return;
    }
    title.textContent = '결제 실패';
    message.textContent = detail?.message ?? error.message;
    return;
  }
  title.textContent = '결제 완료!';
  message.className = 'message ok';
  message.textContent = `${data.orderName} · ${won(data.amount)}`;
}

confirmPayment();
