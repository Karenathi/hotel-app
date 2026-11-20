# Gestion hôtelière (React + Express + MySQL)

## Lancer en local (MAMP)

1. Démarre MAMP (Start Servers).
2. phpMyAdmin (http://localhost:8888/phpMyAdmin) > onglet "Importer" > choisis `backend/database.sql` > Exécuter.
3. Backend :
   cd backend && npm install && npm run seed && npm run dev
4. Frontend (autre terminal) :
   cd frontend && npm install && npm run dev
5. Ouvre http://localhost:5173
   Admin : admin@hotel.com / admin123
   Réceptionniste : recep@hotel.com / recep123

Si MAMP utilise un autre port MySQL, modifie `backend/.env` (DB_PORT, DB_PASSWORD).
Sur Windows : port 3306 et mot de passe vide.

## Mise en ligne
 base MySQL hébergée + backend Render + frontend Vercel.
