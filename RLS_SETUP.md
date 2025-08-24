# Row Level Security (RLS) Beállítás

## Probléma
A TaskFlow alkalmazás Row Level Security (RLS) hibákat ad, mert a Supabase adatbázisban nincsenek beállítva a megfelelő biztonsági szabályok.

## Megoldás

### 1. Supabase Dashboard
1. Menj a [Supabase Dashboard](https://supabase.com/dashboard)-ra
2. Válaszd ki a `yynboyamdtsdcfxtmilo` projektet
3. Menj a **Authentication** > **Policies** menüpontra

### 2. RLS Policy Hozzáadása

#### Clients tábla
```sql
-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (for testing)
CREATE POLICY "Allow all operations on clients" ON clients
FOR ALL USING (true);
```

#### Projects tábla
```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (for testing)
CREATE POLICY "Allow all operations on projects" ON projects
FOR ALL USING (true);
```

#### Simple_tasks tábla
```sql
-- Enable RLS
ALTER TABLE simple_tasks ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (for testing)
CREATE POLICY "Allow all operations on simple_tasks" ON simple_tasks
FOR ALL USING (true);
```

### 3. SQL Editor Használata
1. Menj a **SQL Editor** menüpontra
2. Másold be a fenti SQL kódokat
3. Futtasd le őket egyenként

### 4. Alternatív Megoldás (Gyors Teszteléshez)
Ha csak tesztelni szeretnéd az alkalmazást, ideiglenesen kikapcsolhatod az RLS-t:

```sql
-- Temporarily disable RLS for testing
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE simple_tasks DISABLE ROW LEVEL SECURITY;
```

**⚠️ Figyelem**: Ez csak teszteléshez ajánlott, production környezetben mindig használj RLS policy-ket!

### 5. Ellenőrzés
Miután beállítottad az RLS policy-ket:
1. Frissítsd az alkalmazást a böngészőben
2. Próbálj meg új ügyfelet létrehozni
3. Ha működik, akkor minden rendben van!

## Biztonsági Megjegyzések
- A fenti policy-k minden műveletet engedélyeznek (FOR ALL)
- Production környezetben érdemes korlátozottabb policy-ket használni
- Például: csak bejelentkezett felhasználók számára, vagy specifikus felhasználói jogosultságok alapján
