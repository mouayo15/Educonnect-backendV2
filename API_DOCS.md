# EduConnect API Documentation

**Base URL**: `http://localhost:3000/api/v1`

**Version**: 1.0.0

## Table des Matières
- [Authentification](#authentification)
- [Users](#users)
- [Courses](#courses)
- [Quizzes](#quizzes)
- [Exercises](#exercises)
- [Leaderboard](#leaderboard)
- [Erreurs](#erreurs)

---

## Authentification

Toutes les routes protégées nécessitent un header `Authorization: Bearer <token>`

### POST /auth/register
Créer un nouveau compte utilisateur.

**Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "avatar": "👨"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "avatar": "👨",
      "xp": 0,
      "level": 1,
      "streak": 1
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### POST /auth/login
Se connecter avec un compte existant.

**Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "streakIncreased": true
  }
}
```

### POST /auth/refresh
Rafraîchir le token d'accès.

**Body**:
```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token"
  }
}
```

### GET /auth/me
Obtenir l'utilisateur actuellement authentifié.

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "uuid": "uuid-string",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "👨",
    "xp": 450,
    "level": 5,
    "streak": 7,
    "last_login_date": "2026-01-08",
    "math_progress": 75,
    "french_progress": 60,
    "science_progress": 85,
    "history_progress": 45,
    "total_study_time": 1200,
    "league": "silver",
    "current_level_xp": 50,
    "xp_needed_for_next_level": 100,
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

### POST /auth/logout
Se déconnecter (invalide le refresh token).

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /auth/change-password
Changer le mot de passe.

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Users

### GET /users/profile
Obtenir le profil de l'utilisateur connecté.

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "👨",
    "xp": 450,
    "level": 5,
    "streak": 7,
    "progress": {
      "math": 120,
      "french": 80
    },
    "last_login_date": "2026-01-08",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

### PATCH /users/profile
Modifier le profil.

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "username": "newusername",
  "avatar": "🚀"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "newusername",
    "avatar": "🚀",
    ...
  }
}
```

### GET /users/stats
Obtenir les statistiques détaillées.

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "username": "johndoe",
    "level": 5,
    "xp": 450,
    "streak": 7,
    "total_lessons": 12,
    "total_quizzes": 8,
    "total_exercises": 15,
    "total_achievements": 5
  }
}
```

### GET /users/achievements
Obtenir tous les succès (débloqués et verrouillés).

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "unlocked": [
      {
        "id": "uuid",
        "key": "first_login",
        "title": "Bienvenue !",
        "description": "Se connecter pour la première fois",
        "icon": "👋",
        "category": "special",
        "xp_bonus": 10,
        "rarity": "common",
        "unlocked_at": "2026-01-01T00:00:00.000Z"
      }
    ],
    "locked": [ ... ],
    "total": 14,
    "unlockedCount": 5
  }
}
```

### GET /users/activity
Obtenir l'historique d'activité.

**Headers**: `Authorization: Bearer <token>`

**Query Params**:
- `limit` (default: 20)
- `offset` (default: 0)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "uuid",
        "activity_type": "quiz",
        "activity_title": "Les fractions - Niveau débutant",
        "xp_earned": 20,
        "metadata": {
          "quiz_id": "uuid",
          "score": 2,
          "total": 3
        },
        "created_at": "2026-01-08T10:00:00.000Z"
      }
    ],
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

### GET /users/:userId
Obtenir le profil public d'un utilisateur.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "avatar": "👨",
    "level": 5,
    "streak": 7,
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

---

## Courses

### GET /courses/subjects
Obtenir toutes les matières.

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Mathématiques",
      "key": "math",
      "description": "Explorez les nombres, l'algèbre, la géométrie...",
      "emoji": "🔢",
      "color_from": "from-blue-500",
      "color_to": "to-indigo-600",
      "order_index": 1
    }
  ]
}
```

### GET /courses/subjects/:subjectId
Obtenir une matière par ID.

**Response** (200):
```json
{
  "success": true,
  "data": { ... }
}
```

### GET /courses/subjects/:subjectId/chapters
Obtenir les chapitres d'une matière.

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "subject_id": "uuid",
      "title": "Les fractions",
      "description": "Apprendre à calculer avec des fractions",
      "emoji": "🍰",
      "order_index": 1,
      "estimated_duration": 45,
      "lesson_count": 3
    }
  ]
}
```

### GET /courses/chapters/:chapterId
Obtenir un chapitre par ID.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Les fractions",
    "subject_name": "Mathématiques",
    "lesson_count": 3,
    ...
  }
}
```

### GET /courses/chapters/:chapterId/lessons
Obtenir les leçons d'un chapitre.

**Headers** (optional): `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "chapter_id": "uuid",
      "title": "Introduction aux fractions",
      "content": "<h2>Qu'est-ce qu'une fraction ?</h2>...",
      "order_index": 1,
      "estimated_duration": 15,
      "xp_reward": 10,
      "completed_at": "2026-01-08T10:00:00.000Z",
      "time_spent": 900
    }
  ]
}
```

### GET /courses/lessons/:lessonId
Obtenir une leçon par ID.

**Headers** (optional): `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Introduction aux fractions",
    "content": "<html>...</html>",
    "chapter_title": "Les fractions",
    "subject_name": "Mathématiques",
    "xp_reward": 10,
    "completed_at": null,
    ...
  }
}
```

### POST /courses/lessons/:lessonId/complete
Marquer une leçon comme complétée.

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "timeSpent": 900
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Lesson completed successfully",
  "xpEarned": 10,
  "xpResult": {
    "xpAdded": 10,
    "newXp": 460,
    "newLevel": 5,
    "leveledUp": false,
    "levelsGained": 0,
    "xpToNextLevel": 600,
    "league": "Silver"
  },
  "achievements": [
    {
      "id": 1,
      "key": "first_lesson",
      "title": "Première Leçon !",
      "description": "Complétez votre première leçon",
      "icon": "📚",
      "category": "lesson",
      "xp_bonus": 10,
      "rarity": "common"
    }
  ]
}
```

**Note**: Le champ `achievements` contient les succès nouvellement débloqués (peut être un tableau vide).

---

## Quizzes

### GET /quizzes
Obtenir tous les quiz.

**Query Params**:
- `subjectId` (optional)
- `difficulty` (optional): easy, medium, hard

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "subject_id": "uuid",
      "title": "Les fractions - Niveau débutant",
      "description": "Testez vos connaissances...",
      "emoji": "🔢",
      "difficulty": "easy",
      "estimated_duration": 15,
      "xp_base_reward": 10,
      "subject_name": "Mathématiques",
      "subject_emoji": "🔢",
      "question_count": 3,
      "attempt_count": 2
    }
  ]
}
```

### GET /quizzes/:quizId
Obtenir un quiz par ID.

**Response** (200):
```json
{
  "success": true,
  "data": { ... }
}
```

### GET /quizzes/:quizId/questions
Obtenir les questions d'un quiz (sans les réponses correctes).

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "question_text": "Combien font 1/2 + 1/4 ?",
      "option_a": "1/6",
      "option_b": "2/6",
      "option_c": "3/4",
      "option_d": "1/3",
      "order_index": 1
    }
  ]
}
```

### POST /quizzes/:quizId/submit
Soumettre une tentative de quiz.

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "answers": [2, 1, 0],
  "timeSpent": 840
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Quiz completed!",
  "data": {
    "attemptId": "uuid",
    "score": 2,
    "totalQuestions": 3,
    "percentage": 67,
    "xpEarned": 20,
    "isFirstAttempt": true,
    "correctAnswers": [2, 1, 0],
    "timeSpent": 840,
    "xpResult": {
      "xpAdded": 20,
      "newXp": 480,
      "newLevel": 5,
      "leveledUp": false,
      ...
    },
    "achievements": [
      {
        "id": 2,
        "key": "first_quiz",
        "title": "Premier Quiz !",
        "description": "Complétez votre premier quiz",
        "icon": "🎯",
        "category": "quiz",
        "xp_bonus": 15,
        "rarity": "common"
      }
    ]
  }
}
```

**Note**: Si `isFirstAttempt: false`, alors `xpEarned: 0` (quiz blanc) et `achievements: []`.

### GET /quizzes/attempts/history
Obtenir l'historique des tentatives de quiz.

**Headers**: `Authorization: Bearer <token>`

**Query Params**:
- `quizId` (optional)

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "quiz_id": "uuid",
      "score": 2,
      "total_questions": 3,
      "percentage": 67,
      "xp_earned": 20,
      "time_spent": 840,
      "is_first_attempt": true,
      "answers": [2, 1, 0],
      "created_at": "2026-01-08T10:00:00.000Z",
      "title": "Les fractions - Niveau débutant",
      "difficulty": "easy",
      "emoji": "🔢"
    }
  ]
}
```

### GET /quizzes/:quizId/leaderboard
Obtenir le classement d'un quiz.

**Query Params**:
- `limit` (default: 10)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "quiz": {
      "id": "uuid",
      "title": "Les fractions - Niveau débutant"
    },
    "leaderboard": [
      {
        "id": "uuid",
        "username": "sarah",
        "avatar": "👧",
        "level": 5,
        "score": 3,
        "total_questions": 3,
        "percentage": 100,
        "time_spent": 600,
        "created_at": "2026-01-08T09:00:00.000Z"
      }
    ]
  }
}
```

---

## Exercises

### GET /exercises
Obtenir tous les exercices.

**Query Params**:
- `subjectId` (optional)
- `difficulty` (optional): easy, medium, hard

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "subject_id": "uuid",
      "title": "Pratique des fractions",
      "description": "Entraînez-vous avec les fractions",
      "difficulty": "easy",
      "xp_reward": 15,
      "subject_name": "Mathématiques",
      "subject_emoji": "🔢",
      "question_count": 3,
      "attempt_count": 5
    }
  ]
}
```

### GET /exercises/:exerciseId
Obtenir un exercice par ID.

**Response** (200):
```json
{
  "success": true,
  "data": { ... }
}
```

### GET /exercises/:exerciseId/questions
Obtenir les questions d'un exercice.

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "question_text": "Combien font 1/2 + 1/4 ?",
      "emoji": "🔢",
      "option_a": "1/6",
      "option_b": "2/6",
      "option_c": "3/4",
      "option_d": "1/3",
      "order_index": 1
    }
  ]
}
```

### POST /exercises/:exerciseId/submit
Soumettre une tentative d'exercice.

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "answers": [2, 1, 0],
  "timeSpent": 600
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Exercise completed!",
  "data": {
    "attemptId": "uuid",
    "score": 2,
    "totalQuestions": 3,
    "percentage": 67,
    "xpEarned": 10,
    "correctAnswers": [2, 1, 0],
    "timeSpent": 600,
    "xpResult": { ... }
  }
}
```

**Note**: Les exercices donnent toujours des XP (répétables).

### GET /exercises/attempts/history
Obtenir l'historique des tentatives d'exercice.

**Headers**: `Authorization: Bearer <token>`

**Query Params**:
- `exerciseId` (optional)

**Response** (200):
```json
{
  "success": true,
  "data": [ ... ]
}
```

---

## Leaderboard

### GET /leaderboard/global
Obtenir le classement global.

**Query Params**:
- `limit` (default: 50)
- `offset` (default: 0)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user_id": "uuid",
        "username": "maxime",
        "avatar": "🧑",
        "xp": 1150,
        "level": 12,
        "league": "Diamond"
      }
    ],
    "total": 1000,
    "limit": 50,
    "offset": 0,
    "userRank": 42
  }
}
```

### GET /leaderboard/weekly
Obtenir le classement hebdomadaire.

**Query Params**:
- `limit` (default: 50)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "id": "uuid",
        "username": "sarah",
        "avatar": "👧",
        "level": 5,
        "weekly_xp": 120,
        "weekly_activities": 8
      }
    ],
    "period": "Last 7 days",
    "userRank": 15
  }
}
```

### GET /leaderboard/streak
Obtenir le classement des streaks.

**Query Params**:
- `limit` (default: 50)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "id": "uuid",
        "username": "maxime",
        "avatar": "🧑",
        "level": 12,
        "streak": 15
      }
    ],
    "type": "Streak",
    "userRank": 8
  }
}
```

### GET /leaderboard/subject/:subjectId
Obtenir le classement par matière.

**Query Params**:
- `limit` (default: 50)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "subject": {
      "name": "Mathématiques"
    },
    "leaderboard": [
      {
        "rank": 1,
        "id": "uuid",
        "username": "sarah",
        "avatar": "👧",
        "level": 5,
        "xp": 450,
        "subject_progress": 120
      }
    ],
    "userRank": 3
  }
}
```

### POST /leaderboard/cache/update
Mettre à jour le cache du leaderboard (admin uniquement).

**Headers**: `Authorization: Bearer <admin-token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Leaderboard cache updated successfully"
}
```

---

## Erreurs

Toutes les erreurs suivent ce format:

```json
{
  "success": false,
  "error": "Message d'erreur"
}
```

### Codes HTTP

- **200**: Succès
- **201**: Créé
- **400**: Requête invalide (validation échouée)
- **401**: Non authentifié (token manquant/invalide)
- **403**: Interdit (compte verrouillé, admin requis)
- **404**: Ressource non trouvée
- **429**: Trop de requêtes (rate limit)
- **500**: Erreur serveur

### Exemples d'erreurs

**Validation**:
```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

**Token expiré**:
```json
{
  "success": false,
  "error": "Token expired"
}
```

**Rate limit**:
```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

**Compte verrouillé**:
```json
{
  "success": false,
  "error": "Account is locked until 2026-01-08T11:30:00.000Z. Too many failed login attempts."
}
```

---

## Rate Limits

- **Auth routes** (`/auth/register`, `/auth/login`): 5 requêtes / 15 min
- **Submission routes** (`/quizzes/:id/submit`, `/exercises/:id/submit`): 10 requêtes / minute
- **General API**: 100 requêtes / 15 min

---

## Notes

1. **Quiz Blanc**: Les quiz ne donnent des XP que lors de la première tentative. Les tentatives suivantes ont `xpEarned: 0` et `isFirstAttempt: false`.

2. **Exercises**: Contrairement aux quiz, les exercices donnent toujours des XP (répétables pour l'entraînement).

3. **Streaks**: Mis à jour automatiquement lors du login. Augmente si connexion quotidienne, reset à 1 si pause > 1 jour.

4. **XP & Levels**: 100 XP par niveau. XP reset à chaque level up. Formule: `xpForNextLevel = (level + 1) * 100`.

5. **Leagues**: Bronze (0-4), Silver (5-9), Gold (10-14), Diamond (15+).

6. **Achievements**: Se débloquent automatiquement lors des actions. Bonus XP ajouté immédiatement.

7. **Tokens**: Access token expire en 15min, refresh token en 7 jours.
