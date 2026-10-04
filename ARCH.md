# ARCH.md — 세부 구조

## 전체 구성
```
브라우저 ── GitHub Pages (HTML/CSS/JS)
   │
   ├── Supabase Auth   : 회원가입/로그인 (이메일 인증 없음)
   ├── Supabase DB     : products, orders (RLS 보안 규칙 적용)
   └── Edge Function   : confirm-payment ── 토스 결제 승인 API
```

## 파일 구조
| 파일 | 역할 |
|---|---|
| `index.html` / `js/index.js` | 상품 목록, 구매하기 → 토스 결제위젯 표시 → 결제 요청 |
| `login.html` / `js/login.js` | 로그인 / 회원가입 탭 |
| `orders.html` / `js/orders.js` | 내 결제 내역 |
| `admin.html` / `js/admin.js` | 관리자 전용 전체 결제 내역 + 결제완료 건수/총 매출 |
| `success.html` / `js/success.js` | 결제 성공 후 리다이렉트 → `confirm-payment` 호출 |
| `fail.html` | 결제 실패/취소 → 사유 표시, 주문을 `failed`로 변경 |
| `js/supabase.js` | Supabase URL, 공개용 키, 토스 클라이언트 키, 관리자 이메일 |
| `js/common.js` | 상단 메뉴, `getUser`/`requireLogin`, 금액·날짜·상태 표시 도우미 |
| `css/style.css` | 공통 스타일 |
| `supabase/migrations/001_init.sql` | 테이블, RLS, `is_admin()`, `create_order()`, 예시 상품 |
| `supabase/functions/confirm-payment/index.ts` | 결제 승인/실패 처리 (Deno) |

라이브러리는 CDN으로 불러옴: `@supabase/supabase-js@2`, `https://js.tosspayments.com/v2/standard`

## 데이터베이스
**products**: `id`, `name`, `description`, `price`(원), `image_url`, `created_at`

**orders**: `id`, `order_id`(토스 주문번호, unique), `user_id`, `user_email`, `product_id`, `product_name`, `amount`, `status`(`pending`/`paid`/`failed`), `payment_key`, `created_at`, `paid_at`

### 보안 규칙 (RLS)
| 대상 | 규칙 |
|---|---|
| products 조회 | 누구나 |
| orders 조회 | 본인 주문, 또는 `is_admin()` (JWT 이메일이 `admin@admin.com`) |
| orders 추가/수정/삭제 | 클라이언트에서 직접 불가 |
| `create_order(p_product_id)` | 로그인 사용자만 실행. 가격을 DB에서 가져와 `pending` 주문 생성 (security definer) |
| 주문 상태 변경 | `confirm-payment` 함수가 service role로만 수행 |

## 결제 흐름
1. 상품의 '구매하기' 클릭 → 로그인 확인 → 결제위젯(결제수단·약관) 표시
2. '결제하기' → `create_order` RPC → `order_id`, `amount` 받음
3. `widgets.requestPayment({ orderId, orderName, successUrl, failUrl })` → 토스 결제창
4. 성공 시 `success.html?paymentKey&orderId&amount` 로 이동
5. `confirm-payment`가 검사: 본인 주문인지, `pending` 상태인지, 금액이 DB와 같은지
6. 토스 `POST /v1/payments/confirm` (Basic 인증, 시크릿 키) → 성공 시 `paid`, 실패 시 `failed`
7. 실패/취소 시 `fail.html` → `confirm-payment`에 `{ orderId, fail: true }` → `failed`

## 설정값
| 항목 | 값 / 위치 |
|---|---|
| Supabase URL | `https://ccwjelsogvjswbawenyo.supabase.co` |
| 공개용 키 | `js/supabase.js` (`sb_publishable_...`, 공개 가능) |
| 토스 클라이언트 키 | `js/supabase.js` (문서 공개 테스트 키 `test_gck_docs_...`) |
| 토스 시크릿 키 | Supabase 함수 시크릿 `TOSS_SECRET_KEY` (저장소에 없음) |
| 이메일 인증 | Supabase Auth 설정 `mailer_autoconfirm = true` |

## 변경 방법
- DB 변경: `supabase/migrations/`에 새 SQL 파일 추가 후 Supabase에 적용
- 함수 변경: `supabase/functions/confirm-payment/index.ts` 수정 후 재배포
- 상품 변경: Supabase 대시보드 Table Editor에서 `products` 수정
