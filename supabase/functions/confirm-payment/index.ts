// 토스 결제 승인 함수
// - { paymentKey, orderId, amount } : 결제 승인 → 주문을 paid 로 변경
// - { orderId, fail: true }         : 결제 실패/취소 → 주문을 failed 로 변경
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 요청한 사용자 확인
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ message: "로그인이 필요합니다" }, 401);

  const { paymentKey, orderId, amount, fail } = await req.json();

  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .single();
  if (!order) return json({ message: "주문을 찾을 수 없습니다" }, 404);
  if (order.status !== "pending") return json({ message: "이미 처리된 주문입니다", status: order.status }, 400);

  if (fail) {
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    return json({ status: "failed" });
  }

  // 금액 조작 방지: DB의 주문 금액과 비교
  if (Number(amount) !== order.amount) {
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    return json({ message: "결제 금액이 주문 금액과 다릅니다" }, 400);
  }

  const secretKey = Deno.env.get("TOSS_SECRET_KEY")!;
  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(secretKey + ":"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount: order.amount }),
  });
  const result = await res.json();

  if (!res.ok) {
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    return json({ message: result.message ?? "결제 승인에 실패했습니다" }, 400);
  }

  await admin
    .from("orders")
    .update({ status: "paid", payment_key: paymentKey, paid_at: new Date().toISOString() })
    .eq("id", order.id);

  return json({ status: "paid", orderName: order.product_name, amount: order.amount });
});
