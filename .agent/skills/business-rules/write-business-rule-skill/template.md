# Mẫu Business-Rule Skill

## 1. Mục tiêu và actor

| Actor | Mục tiêu | Phạm vi dữ liệu | Quyền |
| --- | --- | --- | --- |
| Client/user | `<hành động self-service>` | `<dữ liệu do actor sở hữu>` | `RequirePermission()` hoặc policy tương ứng |
| Admin | `<hành động quản trị>` | `<phạm vi quản trị>` | `PERMISSION_CODES.<FEATURE>.<ACTION>` |
| External provider | `<webhook/callback>` | `<payload có chữ ký>` | Chữ ký/API key/HMAC, không JWT user |

## 2. Luồng tổng quát

```text
FE Admin                 BE                         FE Client              External provider
  | <action>              |                             |                         |
  |---------------------->| <use case + transaction>    |                         |
  |<----------------------|                             |                         |
  |                        |                             | <self-service action>   |
  |                        |<----------------------------|                         |
  |                        |---------------------------->| <state/result>          |
  |                        |                             |                         |
  |                        |<------------------------------------------------------|
  |                        | <verify/idempotency/dispatch>                        |
```

## 3. Luồng BE chi tiết

1. Trigger/actor: `<...>`.
2. Input tin cậy và DTO: `<...>`.
3. Precondition/ownership: `<...>`.
4. Unit of Work và persist: `<...>`.
5. State transition: `<from → to>`.
6. Side effect sau commit: `<audit/notification/event>`.
7. Rejection/idempotency/retry: `<...>`.

## 4. API dự kiến

| Method/path | Actor/bảo vệ | Input | Response | Use case/side effect |
| --- | --- | --- | --- | --- |
| `GET /...` | `<actor/permission>` | `<query/param DTO>` | `<response DTO>` | `<read>` |
| `POST /...` | `<actor/permission>` | `<body DTO>` | `<response DTO>` | `<create/transition/audit>` |
| `POST /webhooks/...` | `<HMAC/API key>` | `<raw payload>` | `2xx contract` | `<idempotent process>` |

## 5. Thiết kế schema dự kiến

| Bảng/enum | Thay đổi | Lý do | Relation/index/migration |
| --- | --- | --- | --- |
| `<existing table>` | `<field/enum thay đổi tối thiểu>` | `<rule cần lưu>` | `<FK/onDelete/index/backfill>` |
| `<new table>` | `<field lifecycle riêng>` | `<audit/idempotency/ledger>` | `<unique/index/retention>` |
| `<enum>` | `<values>` | `<state machine>` | `<shared export/Prisma migration>` |

## 6. Ma trận trạng thái và lỗi

| Aggregate | From | Trigger | To | Từ chối khi |
| --- | --- | --- | --- | --- |
| `<aggregate>` | `<state>` | `<use case>` | `<state>` | `<condition>` |

## 7. FE client và FE admin

| Bề mặt | Hành động | Dữ liệu BE là nguồn sự thật | Pending/error |
| --- | --- | --- | --- |
| FE client | `<...>` | `<API/status>` | `<loading/retry/message>` |
| FE admin | `<...>` | `<list/detail/audit>` | `<permission/manual resolution>` |

## 8. Quyết định cần chốt

1. `<policy chưa rõ>`
2. `<data/migration/ownership chưa rõ>`
3. `<edge case/retry/refund/retention chưa rõ>`
