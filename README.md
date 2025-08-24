# TaskFlow

TaskFlow egy modern, web-alapú projekt- és feladatkezelő alkalmazás, amely segít a csapatoknak hatékonyan kezelni a projekteket, ügyfeleket és feladatokat.

## 🚀 Funkciók

- **Projekt Kezelés**: Projektek létrehozása, szerkesztése és nyomon követése
- **Ügyfél Kezelés**: Ügyfelek adatainak kezelése és kapcsolattartás
- **Feladat Kezelés**: Feladatok létrehozása, prioritás beállítása és haladás követése
- **Dashboard**: Áttekintés a projektekről és feladatokról
- **Valós idejű frissítések**: Automatikus adatfrissítés és valós idejű változások
- **Reszponzív design**: Mobilbarát felület

## 🛠️ Technológiai stack

- **Frontend**: Next.js 13, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand, React Query
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Custom component library
- **Forms**: React Hook Form, Zod validation

## 📋 Előfeltételek

- Node.js 18+ 
- npm vagy yarn
- Supabase fiók és projekt

## 🚀 Telepítés

1. **Repository klónozása**
   ```bash
   git clone https://github.com/yourusername/task_flow.git
   cd task_flow
   ```

2. **Függőségek telepítése**
   ```bash
   npm install
   ```

3. **Környezeti változók beállítása**
   Hozz létre egy `.env.local` fájlt a projekt gyökerében:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Fejlesztői szerver indítása**
   ```bash
   npm run dev
   ```

5. **Böngészőben megnyitás**
   Nyisd meg a [http://localhost:3000](http://localhost:3000) címet

## 🗄️ Adatbázis beállítás

Az alkalmazás használja a Supabase-t adatbázisként. A szükséges táblák létrehozásához futtasd a következő SQL szkripteket:

- `database-setup.sql` - Alapvető táblák létrehozása
- `setup-notes-tables.sql` - Jegyzetek táblái
- `RLS_SETUP.md` - Row Level Security beállítások

## 📱 Használat

### Dashboard
- Áttekintés a projektekről és feladatokról
- Statisztikák és haladás követése
- Gyors navigáció a különböző funkciókhoz

### Projektek
- Új projektek létrehozása
- Meglévő projektek szerkesztése
- Ügyfelek hozzárendelése
- Határidők és prioritások beállítása

### Ügyfelek
- Ügyféladatok kezelése
- Kapcsolattartási információk
- Projekt-ügyfél kapcsolatok

### Feladatok
- Feladatok létrehozása és kezelése
- Prioritás beállítás
- Haladás követése
- Drag & Drop rendezés

## 🔧 Fejlesztés

### Parancsok
```bash
# Fejlesztői szerver
npm run dev

# Production build
npm run build

# Production szerver
npm start

# Linting
npm run lint

# Type checking
npm run type-check
```

### Projekt struktúra
```
taskflow/
├── app/                    # Next.js app router
├── components/            # React komponensek
├── services/              # API szolgáltatások
├── stores/                # Zustand store-ok
├── types/                 # TypeScript típusok
├── lib/                   # Segédfüggvények
└── utils/                 # Utility függvények
```

## 🤝 Hozzájárulás

1. Fork-ald a projektet
2. Hozz létre egy feature branch-et (`git checkout -b feature/amazing-feature`)
3. Commit-old a változásokat (`git commit -m 'Add amazing feature'`)
4. Push-old a branch-et (`git push origin feature/amazing-feature`)
5. Nyiss egy Pull Request-et

## 📄 Licenc

Ez a projekt MIT licenc alatt van kiadva. Lásd a [LICENSE](LICENSE) fájlt a részletekért.

## 📞 Kapcsolat

- **GitHub**: [@yourusername](https://github.com/yourusername)
- **Email**: your.email@example.com

## 🙏 Köszönet

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend szolgáltatások
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animációk
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
