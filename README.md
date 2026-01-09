# EduConnect Backend API

Backend complet pour l'application EduConnect - Plateforme d'apprentissage gamifiée.

## 🚀 Fonctionnalités

### Authentification & Sécurité
- Inscription/Connexion avec JWT
- Refresh tokens pour sessions persistantes
- Hachage de mots de passe avec bcrypt (12 rounds)
- Verrouillage de compte après 5 tentatives échouées
- Rate limiting sur toutes les routes
- Protection CORS, Helmet, validation des entrées

### Système de Gamification
- **XP & Niveaux**: 100 XP par niveau, progression infinie
- **Leagues**: Bronze, Silver, Gold, Diamond (basées sur le niveau)
- **Streaks**: Suivi quotidien de connexion
- **Achievements**: 14 succès à débloquer avec bonus XP
- **Leaderboards**: Global, par matière, hebdomadaire, streak

### Contenu Éducatif
- **Subjects** (Matières): Maths, Français, Sciences, Histoire
- **Chapters** (Chapitres): Organisés par matière
- **Lessons** (Leçons): Contenu HTML enrichi, XP à la complétion
- **Quizzes**: Questions à choix multiples
  - XP uniquement à la première tentative
  - "Quiz Blanc" (0 XP) lors des reprises
- **Exercises**: Pratique répétable avec XP à chaque fois

### API Endpoints

#### Auth (`/api/v1/auth`)
```
POST   /register          - Créer un compte
POST   /login             - Se connecter
POST   /refresh           - Rafraîchir le token
POST   /logout            - Se déconnecter
POST   /change-password   - Changer le mot de passe
```

#### Users (`/api/v1/users`)
```
GET    /profile           - Profil utilisateur
PATCH  /profile           - Modifier profil
GET    /stats             - Statistiques détaillées
GET    /achievements      - Succès débloqués/verrouillés
GET    /activity          - Historique d'activité
GET    /:userId           - Profil public
```

#### Courses (`/api/v1/courses`)
```
GET    /subjects                      - Liste des matières
GET    /subjects/:id                  - Détails matière
GET    /subjects/:id/chapters         - Chapitres par matière
GET    /chapters/:id                  - Détails chapitre
GET    /chapters/:id/lessons          - Leçons par chapitre
GET    /lessons/:id                   - Détails leçon
POST   /lessons/:id/complete          - Compléter leçon
```

#### Quizzes (`/api/v1/quizzes`)
```
GET    /                       - Liste des quiz
GET    /:id                    - Détails quiz
GET    /:id/questions          - Questions (sans réponses)
POST   /:id/submit             - Soumettre tentative
GET    /attempts/history       - Historique utilisateur
GET    /:id/leaderboard        - Classement quiz
```

#### Exercises (`/api/v1/exercises`)
```
GET    /                       - Liste des exercices
GET    /:id                    - Détails exercice
GET    /:id/questions          - Questions
POST   /:id/submit             - Soumettre tentative
GET    /attempts/history       - Historique utilisateur
```

#### Leaderboard (`/api/v1/leaderboard`)
```
GET    /global                 - Classement global
GET    /weekly                 - Classement hebdomadaire
GET    /streak                 - Classement streaks
GET    /subject/:id            - Classement par matière
POST   /cache/update           - MAJ cache (admin)
```

## 📦 Installation

### Prérequis
- Node.js 18+
- PostgreSQL 14+

### Configuration

1. **Cloner et installer**
```bash
cd Educonnect-backend
npm install
```

2. **Configurer la base de données**

Créer une base PostgreSQL:
```sql
CREATE DATABASE educonnect;
```

3. **Variables d'environnement**

Copier `.env.example` vers `.env` et configurer:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=votre_password
DB_NAME=educonnect

# JWT
JWT_SECRET=votre_secret_super_long_et_securise
JWT_REFRESH_SECRET=autre_secret_different_aussi_long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

4. **Initialiser la base de données**

```bash
# Créer les tables
psql -U postgres -d educonnect -f database/schema.sql

# Insérer les données de test
psql -U postgres -d educonnect -f database/seed.sql
```

5. **Démarrer le serveur**

```bash
# Développement (avec nodemon)
npm run dev

# Production
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests avec couverture
npm test -- --coverage

# Tests en mode watch
npm test -- --watch
```

Tests inclus:
- ✅ Authentification (register, login, refresh, logout)
- ✅ Gestion utilisateurs (profil, stats, achievements)
- ✅ Quizzes (get, submit, XP gating, quiz blanc)
- ✅ Leaderboards (global, weekly, streak, subject)

## 🗄️ Base de Données

### Tables Principales

- **users**: Comptes utilisateurs avec XP/level/streak
- **subjects**: Matières (Maths, Français, etc.)
- **chapters**: Chapitres par matière
- **lessons**: Leçons avec contenu HTML
- **lesson_completions**: Tracking leçons complétées
- **quizzes**: Définition des quiz
- **quiz_questions**: Questions de quiz
- **quiz_attempts**: Tentatives utilisateur
- **exercises**: Définition des exercices
- **exercise_questions**: Questions d'exercice
- **exercise_attempts**: Tentatives utilisateur
- **achievements**: Succès disponibles
- **user_achievements**: Succès débloqués
- **activity_history**: Timeline d'activité
- **leaderboard_cache**: Cache pour performance
- **refresh_tokens**: Tokens de session

### Vues

- **user_stats**: Statistiques complètes par utilisateur
- **global_leaderboard**: Classement global optimisé

## 🔒 Sécurité

- **Helmet**: Headers de sécurité HTTP
- **CORS**: Origine contrôlée
- **Rate Limiting**: 
  - Auth: 5 tentatives / 15 min
  - API: 100 requêtes / 15 min
  - Submissions: 10 / minute
- **Validation**: express-validator sur toutes les entrées
- **JWT**: Tokens courts (15min) + refresh tokens (7 jours)
- **Passwords**: bcrypt avec 12 salt rounds
- **Account Locking**: 15 min après 5 échecs login

## 📊 Performances

- Connection pooling PostgreSQL (20 connexions max)
- Leaderboard cache avec mise à jour périodique
- Index sur toutes les foreign keys
- Vues matérialisées pour queries complexes
- Compression gzip des réponses

## 🛠️ Scripts NPM

```bash
npm run dev        # Développement avec nodemon
npm start          # Production
npm test           # Tests Jest
npm run migrate    # Appliquer schema.sql
npm run seed       # Insérer données seed.sql
```

## 📝 Données de Test

Utilisateurs de test (password: `admin123` pour tous):
- **admin@educonnect.fr**: Administrateur
- **sarah@test.com**: Utilisateur avec progression
- **lucas@test.com**: Utilisateur basique
- **emma@test.com**: Utilisateur avancé
- **maxime@test.com**: Utilisateur expert

## 🐛 Debugging

Mode développement: erreurs détaillées avec stack trace
Mode production: erreurs minimales sans leak d'info

Logs:
- Morgan: HTTP requests
- Console: Database queries avec timing

## 🚀 Déploiement

### Production Checklist
- [ ] Variables d'env configurées
- [ ] `NODE_ENV=production`
- [ ] Base de données sécurisée
- [ ] CORS_ORIGIN défini
- [ ] JWT secrets forts (32+ chars)
- [ ] Rate limits ajustés si besoin
- [ ] Backups DB configurés
- [ ] Monitoring activé

### Variables d'environnement Production
```env
NODE_ENV=production
DB_HOST=your-db-host
DB_PASSWORD=strong-password
JWT_SECRET=long-random-string-at-least-32-chars
CORS_ORIGIN=https://your-frontend-domain.com
```

## 📄 License

Projet éducatif - EduConnect

## 👤 Auteur

Développé pour EduConnect - Plateforme d'apprentissage gamifiée

---

**API Version**: 1.0.0
**Last Updated**: Janvier 2026
