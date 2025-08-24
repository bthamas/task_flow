# Supabase Kapcsolódási Hiba Javítása

## 🚨 Aktuális Hiba

Az alkalmazás "Invalid API key" hibát ad, ami azt jelenti, hogy a Supabase API kulcs nem érvényes vagy a projekt nincs megfelelően beállítva.

## 🔧 Megoldási Lépések

### 1. Supabase Projekt Ellenőrzése

1. **Menj a [supabase.com](https://supabase.com)-ra**
2. **Jelentkezz be** a fiókodba
3. **Ellenőrizd**, hogy a `yynboyamdtsdcfxtmilo` projekt létezik-e
4. **Ha nem létezik**, hozz létre egy új projektet

### 2. Új Projekt Létrehozása (ha szükséges)

1. Kattints a **"New project"** gombra
2. Add meg a projekt nevét: `taskflow`
3. Válaszd ki a régiót (pl. West Europe)
4. Add meg egy jelszót az adatbázishoz
5. Kattints a **"Create new project"** gombra

### 3. API Kulcsok Lekérése

1. A projekt dashboard-on kattints a **"Settings"** menüpontra
2. Kattints az **"API"** almenüpontra
3. Másold ki a következő értékeket:
   - **Project URL** (pl. `https://your-project-id.supabase.co`)
   - **anon public** kulcs (hosszú string, `eyJ...` kezdettel)

### 4. Környezeti Változók Frissítése

Frissítsd a `.env.local` fájlt a helyes értékekkel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 5. Adatbázis Séma Létrehozása

1. A Supabase dashboard-on kattints a **"SQL Editor"** menüpontra
2. Kattints a **"New query"** gombra
3. Másold be és futtasd le a `database-setup.sql` fájl tartalmát

### 6. Alkalmazás Újraindítása

```bash
# Állítsd le a fejlesztői szervert (Ctrl+C)
# Majd indítsd újra
npm run dev
```

## 🧪 Tesztelés

### 1. Adatbázis Kapcsolat Tesztelése

Nyisd meg a böngészőben: `http://localhost:3000/clients`

Ha nincs hiba, akkor a kapcsolat működik.

### 2. Ügyfél Létrehozás Tesztelése

1. Kattints az **"Új Ügyfél"** gombra
2. Töltsd ki az adatokat
3. Kattints a **"Létrehozás"** gombra

Ha sikeres, akkor minden rendben van.

## 🐛 Hibaelhárítás

### "Invalid API key" hiba

**Ok**: Rossz vagy lejárt API kulcs
**Megoldás**: 
1. Ellenőrizd a Supabase dashboard-on az API kulcsokat
2. Frissítsd a `.env.local` fájlt
3. Indítsd újra az alkalmazást

### "relation 'clients' does not exist" hiba

**Ok**: Az adatbázis táblák nem léteznek
**Megoldás**:
1. Futtasd le a `database-setup.sql` szkriptet
2. Ellenőrizd a Supabase Table Editor-ben, hogy a táblák létrejöttek-e

### "RLS policy" hiba

**Ok**: Row Level Security blokkolja a hozzáférést
**Megoldás**:
1. Ellenőrizd a Supabase Authentication > Policies menüpontot
2. Győződj meg róla, hogy a RLS policy-k helyesen vannak beállítva

## 📋 Ellenőrzőlista

- [ ] Supabase projekt létezik és aktív
- [ ] API kulcsok helyesen vannak másolva
- [ ] `.env.local` fájl frissítve
- [ ] `database-setup.sql` szkript lefutott
- [ ] Alkalmazás újraindítva
- [ ] Ügyfél létrehozás működik

## 🔗 Hasznos Linkek

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Documentation](https://supabase.com/docs)
- [Database Setup Guide](SUPABASE_SETUP.md)

---

**Megjegyzés**: Ha továbbra is problémák vannak, ellenőrizd a böngésző konzolját (F12) a részletes hibaüzenetekért.
