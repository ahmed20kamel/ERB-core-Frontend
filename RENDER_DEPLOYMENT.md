# نشر Frontend على Render

## ✅ المشاكل التي تم حلها

### 1. خطأ TypeScript - material_images
**المشكلة**: 
```
Type error: Object literal may only specify known properties, and 'material_images' does not exist in the expected type.
File: /app/goods-receiving/new/page.tsx:213
```

**الحل**:
- تم تعريف نوع صريح `GRNCreateData` يتضمن جميع الحقول المطلوبة بما فيها `material_images?: File[]`
- تم تحديث `mutationFn` لاستخدام هذا النوع الجديد

## 📋 إعدادات Render

### Environment Variables المطلوبة:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
NEXT_PUBLIC_WS_URL=wss://your-backend-url.onrender.com
```

### Build Settings:
- **Root Directory**: `frontend`
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Node Version**: 20.x

## 📝 ملاحظات

1. تأكد من تعيين `NEXT_PUBLIC_API_URL` إلى عنوان الـ Backend على Render
2. تأكد من تعيين `NEXT_PUBLIC_WS_URL` للـ WebSocket connections
3. ملف `render.yaml` موجود في مجلد `frontend` ويمكن استخدامه للنشر التلقائي

## 🔍 التحقق من البناء

تم التحقق من أن البناء ينجح بدون أخطاء TypeScript.

