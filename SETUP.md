# ============================================
# EduConnect Backend - Guide de Démarrage
# ============================================

# 1. INSTALLATION POSTGRESQL
# Windows: Télécharger depuis https://www.postgresql.org/download/windows/
# Ou avec chocolatey: choco install postgresql

# 2. CRÉER LA BASE DE DONNÉES
psql -U postgres
CREATE DATABASE educonnect;
\q

# 3. INSTALLER LES DÉPENDANCES NODE
npm install

# 4. CONFIGURER L'ENVIRONNEMENT
# Copier .env.example vers .env et modifier:
cp .env.example .env
# Éditer .env avec vos valeurs (notamment DB_PASSWORD)

# 5. TESTER LA CONNEXION DB
npm run test:db

# 6. CRÉER LES TABLES
npm run migrate

# 7. INSÉRER LES DONNÉES DE TEST
npm run seed

# 8. DÉMARRER LE SERVEUR
npm run dev

# ============================================
# COMMANDES UTILES
# ============================================

# Démarrage développement (avec nodemon)
npm run dev

# Démarrage production
npm start

# Tests unitaires
npm test

# Tests avec couverture
npm test -- --coverage

# Réinitialiser la base de données
psql -U postgres -d educonnect -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run migrate
npm run seed

# Vérifier les tables créées
psql -U postgres -d educonnect -c "\dt"

# Voir les données d'une table
psql -U postgres -d educonnect -c "SELECT * FROM subjects;"

# Backup de la base
pg_dump -U postgres educonnect > backup.sql

# Restore backup
psql -U postgres educonnect < backup.sql

# ============================================
# STRUCTURE DES DOSSIERS
# ============================================

Educonnect-backend/
├── database/
│   ├── schema.sql          # Schéma de la base de données
│   └── seed.sql            # Données de test
├── scripts/
│   ├── migrate.js          # Script de migration
│   ├── seed.js             # Script de seed
│   └── test-db.js          # Test de connexion DB
├── src/
│   ├── config/
│   │   └── database.js     # Configuration PostgreSQL
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── courseController.js
│   │   ├── quizController.js
│   │   ├── exerciseController.js
│   │   └── leaderboardController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── courses.js
│   │   ├── quizzes.js
│   │   ├── exercises.js
│   │   └── leaderboard.js
│   ├── services/
│   │   ├── userService.js
│   │   └── quizService.js
│   └── server.js
├── tests/
│   ├── auth.test.js
│   ├── user.test.js
│   ├── quiz.test.js
│   └── leaderboard.test.js
├── .env.example
├── .gitignore
├── package.json
├── jest.config.js
└── README.md

# ============================================
# DÉPANNAGE
# ============================================

# Erreur: "database does not exist"
Solution: CREATE DATABASE educonnect;

# Erreur: "password authentication failed"
Solution: Vérifier DB_PASSWORD dans .env

# Erreur: "relation does not exist"
Solution: npm run migrate

# Port 3000 déjà utilisé
Solution: Changer PORT dans .env ou fermer l'autre serveur

# Tests échouent
Solution: Vérifier que la DB de test est créée et migrée

# ============================================
# DÉVELOPPEMENT
# ============================================

# Ajouter une nouvelle route
1. Créer controller dans src/controllers/
2. Créer route dans src/routes/
3. Monter la route dans src/routes/index.js
4. Ajouter validation si nécessaire
5. Ajouter tests dans tests/

# Modifier le schéma DB
1. Modifier database/schema.sql
2. DROP et recreate la DB OU utiliser des migrations
3. Re-run: npm run migrate && npm run seed

# Ajouter un test
1. Créer fichier .test.js dans tests/
2. Utiliser supertest pour les requêtes HTTP
3. Utiliser Jest pour les assertions
4. Run: npm test

# ============================================
# PRODUCTION
# ============================================

# Variables d'environnement requises:
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db
DB_PASSWORD=strong-password
JWT_SECRET=long-random-string
CORS_ORIGIN=https://your-domain.com

# Ne JAMAIS commit:
- .env
- node_modules/
- coverage/
- *.log

# Toujours:
- Utiliser HTTPS
- Configurer firewall
- Backups réguliers DB
- Monitoring et logs
- Rate limits ajustés
