# TOR Assistant Online

เวอร์ชันออนไลน์ของระบบช่วยตรวจ TOR และเตรียมเอกสารยื่นประมูลภาครัฐ

## วิธีรันบนเครื่อง

```bash
node server.js
```

จากนั้นเปิด:

```text
http://localhost:8080
```

## วิธีตั้งรหัสแก้ไข

ถ้าจะเปิดออนไลน์จริง แนะนำตั้งรหัสก่อนรัน:

```bash
TOR_APP_PIN=123456 node server.js
```

เมื่อมีการบันทึกข้อมูล ระบบจะถามรหัสจากผู้ใช้

## วิธี deploy แบบง่าย

### Render

1. สร้าง GitHub repo แล้วอัปโหลดโฟลเดอร์นี้
2. เข้า Render แล้วเลือก New Web Service
3. เลือก repo นี้
4. Build Command เว้นว่างไว้ หรือใส่ `npm install`
5. Start Command ใส่ `npm start`
6. Environment Variables แนะนำให้เพิ่ม `TOR_APP_PIN`

### Railway

1. สร้างโปรเจกต์ใหม่จาก GitHub repo
2. Railway จะตรวจ Node.js ให้อัตโนมัติ
3. ตั้ง Start Command เป็น `npm start`
4. เพิ่มตัวแปร `TOR_APP_PIN` ถ้าต้องการรหัสแก้ไข

### VPS

```bash
node server.js
```

ถ้าต้องการให้เปิดตลอดเวลา ให้ใช้ process manager เช่น PM2 หรือ systemd

## หมายเหตุสำหรับใช้งานจริง

เวอร์ชันนี้เป็นต้นแบบออนไลน์แบบไฟล์ JSON กลาง เหมาะสำหรับทีมเล็กหรือการทดลองระบบ ถ้าใช้จริงระดับองค์กรควรต่อฐานข้อมูล เช่น PostgreSQL, เพิ่มระบบสมาชิก, แยกสิทธิ์ผู้ใช้, สำรองข้อมูล และรองรับไฟล์ PDF/OCR
