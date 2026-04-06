# Web Quản Lý BlueMoon

Đây là ứng dụng web quản lý chung cư BlueMoon (bản phục vụ đồ án), xây dựng bằng Next.js + Prisma + SQLite, hỗ trợ song ngữ Việt/Anh và dữ liệu động theo API backend.

## 1) Yêu cầu môi trường

- Node.js `>= 22`
- npm `>= 10`
- Git

Kiểm tra nhanh:

```bash
node -v
npm -v
git --version
```

## 2) Cài đặt

Chạy trong thư mục `webapp`:

```bash
npm install
npm run db:generate
npx prisma migrate deploy
npm run db:seed
```

## 3) Chạy local

```bash
npm run dev
```

Mở trình duyệt tại:

- `http://localhost:3000`

## 4) Build production

```bash
npm run lint
npm run build
npm run start
```

## 5) Biến môi trường

Mặc định đang dùng SQLite local:

```env
DATABASE_URL="file:./dev.db"
```

Tệp hiện có: `webapp/.env`

## 6) Tài liệu hướng dẫn sử dụng

- Hướng dẫn tiếng Việt: `webapp/docs/HANDBOOK_VI.md`
- English handbook: `webapp/docs/HANDBOOK_EN.md`

## 7) Tài liệu triển khai và kiểm thử

- Kế hoạch E2E: `webapp/docs/E2E_REGRESSION_PLAN.md`
- Checklist bảo mật: `webapp/docs/SECURITY_CHECKLIST.md`
- Checklist deploy Vercel: `webapp/docs/VERCEL_DEPLOYMENT_CHECKLIST.md`

## 8) Lưu ý cho agent/automation

Quy tắc thao tác dự án nằm tại:

- `webapp/AGENTS.md`

Trong đó có lưu ý quan trọng: không được kill toàn bộ tiến trình Node toàn hệ thống vì có thể làm dừng runtime của công cụ agent.
