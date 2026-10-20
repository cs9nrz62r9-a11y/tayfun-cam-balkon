# Tayfun Cam Balkon - Web Uygulaması

Modern, web tabanlı cam balkon tasarım sistemi. SvelteKit 5, Supabase, ve Pyodide ile oluşturulmuştur.

## 🎯 Özellikler

- **5-Adım Sihirbaz**: Sistem → Özellikler → Ölçüler → Aksesuarlar → Sonuçlar
- **Python Hesaplama Motoru**: Pyodide ile browser'da çalışan drawing_engine
- **Real-time Sync**: Supabase ile çok cihaz senkronizasyonu
- **Responsive Design**: Desktop, tablet, mobil uyumlu
- **Type-Safe**: TypeScript ile tam tip güvenliği

## 🚀 Başlangıç

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
# Açılır: http://localhost:5173
```

### Production Build
```bash
npm run build
npm run preview
```

## 📁 Proje Yapısı

```
src/
├── lib/
│   ├── calculation/      # Python engine integration
│   ├── worker/           # Pyodide Web Worker
│   ├── stores/           # Auth & Data state
│   └── supabase.ts       # Database client
├── routes/
│   ├── auth/             # Login/Signup pages
│   ├── customers/        # Customer management
│   ├── projects/         # Project list
│   ├── systems/          # Systems catalog
│   └── wizard/           # 5-step drawing wizard
└── app.css              # Global styles
```

## 🔧 Konfigürasyon

### .env.local
```env
VITE_SUPABASE_URL=https://rphczgyzyptpuanturcc.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## 🚢 Deployment

### Vercel
```bash
git push origin main
# Vercel automatically deploys on push
```

See [DEPLOYMENT.md](./claude/vercel-deployment-guide.md) for detailed instructions.

## 📚 Dokümantasyon

- [Test Listesi](./claude/web-uygulama-test-listesi.md)
- [Vercel Dağıtım Rehberi](./claude/vercel-deployment-guide.md)

## 🧪 Testing

```bash
npm run build    # Build test
npm run preview  # Preview test
npx tsc --noEmit # Type check
```

## 📄 License

Tayfun Yapı Cam Balkon Sistemleri - All rights reserved

## 👤 Developer

- **Owner**: Tolga
- **Updated**: 2026-10-15
- **Status**: Production Ready
