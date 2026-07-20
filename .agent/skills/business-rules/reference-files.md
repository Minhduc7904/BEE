# Tài liệu tham chiếu Business Rules

| Nhu cầu | Đọc |
| --- | --- |
| Rule application, audit, transaction | `.agent/skills/create-application-use-case/SKILL.md` |
| API, actor, permission, DTO HTTP | `.agent/skills/create-presentation-controller/SKILL.md` |
| DTO/validation | `.agent/skills/create-dto/SKILL.md` |
| Enum trạng thái/type | `.agent/skills/create-enum/SKILL.md` |
| Schema/migration | `.agent/skills/database-schema-changes/SKILL.md` |
| Repository/relation options | `.agent/skills/create-prisma-repository/SKILL.md` |
| Viết business skill mới | `write-business-rule-skill/SKILL.md` |
| Học phí, payment core, SePay | `tuition-payment-sepay-business-rules/SKILL.md` |

Trước khi đề xuất rule mới, mở module gần nhất trong `src/application/use-cases/`, entity/domain repository liên quan và controller đang gọi use case đó. Với external provider, chỉ dùng tài liệu chính thức mới nhất và lưu link trong business skill chuyên biệt.
