-- 상품
create table public.products (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  price integer not null check (price > 0),
  image_url text,
  created_at timestamptz not null default now()
);

-- 주문 (결제 내역)
create table public.orders (
  id bigint generated always as identity primary key,
  order_id text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  product_id bigint not null references public.products(id),
  product_name text not null,
  amount integer not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  payment_key text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index orders_user_id_idx on public.orders(user_id);
create index orders_product_id_idx on public.orders(product_id);

-- 관리자 판별
create function public.is_admin() returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'admin@admin.com';
$$;

-- 보안 규칙 (RLS)
alter table public.products enable row level security;
alter table public.orders enable row level security;

create policy "누구나 상품 조회" on public.products
  for select to anon, authenticated using (true);

create policy "본인 주문 또는 관리자 조회" on public.orders
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

-- 주문 생성: 가격은 DB에서 가져오므로 사용자가 조작할 수 없음
create function public.create_order(p_product_id bigint)
returns table (order_id text, amount integer, product_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products;
  v_order_id text;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;

  select * into v_product from public.products where id = p_product_id;
  if not found then
    raise exception '상품을 찾을 수 없습니다';
  end if;

  v_order_id := 'order_' || replace(gen_random_uuid()::text, '-', '');

  insert into public.orders (order_id, user_id, user_email, product_id, product_name, amount)
  values (v_order_id, auth.uid(), auth.jwt() ->> 'email', v_product.id, v_product.name, v_product.price);

  return query select v_order_id, v_product.price, v_product.name;
end;
$$;

revoke execute on function public.create_order(bigint) from public, anon;
grant execute on function public.create_order(bigint) to authenticated;

-- 예시 상품
insert into public.products (name, description, price, image_url) values
  ('굿즈 스티커 세트', '귀여운 캐릭터 스티커 10종 세트', 3000, 'https://placehold.co/400x400/ffd6e0/333?text=Sticker'),
  ('아크릴 키링', '양면 인쇄 아크릴 키링', 8000, 'https://placehold.co/400x400/d6ecff/333?text=Keyring'),
  ('캐릭터 머그컵', '350ml 세라믹 머그컵', 15000, 'https://placehold.co/400x400/fff3c4/333?text=Mug'),
  ('로고 티셔츠', '면 100% 오버핏 티셔츠', 25000, 'https://placehold.co/400x400/d9f7d6/333?text=T-shirt');
