-- ============================================
-- EduConnect Seed Data
-- ============================================

-- ============================================
-- SUBJECTS
-- ============================================
INSERT INTO subjects (name, key, description, emoji, color_from, color_to, order_index) VALUES
('Mathématiques', 'math', 'Explorez les nombres, l''algèbre, la géométrie et plus encore', '🔢', 'from-blue-500', 'to-indigo-600', 1),
('Français', 'french', 'Maîtrisez la grammaire, l''orthographe et la littérature', '📖', 'from-purple-500', 'to-pink-600', 2),
('Sciences', 'science', 'Découvrez la physique, la chimie et la biologie', '🔬', 'from-green-500', 'to-teal-600', 3),
('Histoire', 'history', 'Voyagez à travers le temps et les civilisations', '🏛️', 'from-orange-500', 'to-red-600', 4);

-- ============================================
-- CHAPTERS - MATHÉMATIQUES
-- ============================================
INSERT INTO chapters (subject_id, title, description, emoji, order_index, estimated_duration) VALUES
(1, 'Les fractions', 'Apprendre à calculer avec des fractions', '🍰', 1, 45),
(1, 'Géométrie', 'Les formes et leurs propriétés', '📐', 2, 60),
(1, 'Algèbre', 'Introduction aux équations', '🧮', 3, 90),
(1, 'Statistiques', 'Analyse de données et probabilités', '📊', 4, 75);

-- ============================================
-- CHAPTERS - FRANÇAIS
-- ============================================
INSERT INTO chapters (subject_id, title, description, emoji, order_index, estimated_duration) VALUES
(2, 'Grammaire', 'Les règles de la langue française', '📝', 1, 60),
(2, 'Conjugaison', 'Les temps et modes verbaux', '⏰', 2, 75),
(2, 'Orthographe', 'Écrire sans fautes', '✍️', 3, 45),
(2, 'Littérature', 'Les grands auteurs et œuvres', '📚', 4, 90);

-- ============================================
-- CHAPTERS - SCIENCES
-- ============================================
INSERT INTO chapters (subject_id, title, description, emoji, order_index, estimated_duration) VALUES
(3, 'La photosynthèse', 'Comment les plantes produisent leur énergie', '🌱', 1, 40),
(3, 'Le corps humain', 'Anatomie et physiologie', '🫀', 2, 80),
(3, 'La chimie', 'Atomes, molécules et réactions', '⚗️', 3, 70),
(3, 'La physique', 'Forces, énergie et mouvement', '⚛️', 4, 85);

-- ============================================
-- CHAPTERS - HISTOIRE
-- ============================================
INSERT INTO chapters (subject_id, title, description, emoji, order_index, estimated_duration) VALUES
(4, 'L''Antiquité', 'Égypte, Grèce et Rome', '🏺', 1, 60),
(4, 'Le Moyen Âge', 'Châteaux, chevaliers et royaumes', '🏰', 2, 70),
(4, 'La Renaissance', 'Art, science et découvertes', '🎨', 3, 55),
(4, 'L''époque moderne', 'Révolutions et monde contemporain', '🌍', 4, 90);

-- ============================================
-- LESSONS - Les fractions (Math Chapter 1)
-- ============================================
INSERT INTO lessons (chapter_id, title, content, order_index, estimated_duration, xp_reward) VALUES
(1, 'Introduction aux fractions', 
'<h2>Qu''est-ce qu''une fraction ?</h2>
<p>Une fraction représente une partie d''un tout. Elle est composée de deux nombres :</p>
<ul>
<li><strong>Le numérateur</strong> (en haut) : indique combien de parts on prend</li>
<li><strong>Le dénominateur</strong> (en bas) : indique en combien de parts on divise le tout</li>
</ul>
<h3>Exemple</h3>
<p>3/4 signifie que l''on prend 3 parts d''un tout divisé en 4 parts égales.</p>
<h3>Visualisation</h3>
<p>Imagine une pizza coupée en 4 parts égales. Si tu en manges 3 parts, tu as mangé 3/4 de la pizza !</p>', 
1, 15, 10),

(1, 'Additionner des fractions', 
'<h2>Addition de fractions</h2>
<h3>Même dénominateur</h3>
<p>Si les fractions ont le même dénominateur, on additionne simplement les numérateurs :</p>
<p><strong>1/4 + 2/4 = 3/4</strong></p>
<h3>Dénominateurs différents</h3>
<p>Il faut d''abord trouver un dénominateur commun :</p>
<p><strong>1/2 + 1/4</strong></p>
<ol>
<li>Convertir 1/2 en quarts : 1/2 = 2/4</li>
<li>Additionner : 2/4 + 1/4 = 3/4</li>
</ol>', 
2, 20, 10),

(1, 'Soustraire des fractions', 
'<h2>Soustraction de fractions</h2>
<p>La soustraction fonctionne comme l''addition :</p>
<h3>Même dénominateur</h3>
<p><strong>3/5 - 1/5 = 2/5</strong></p>
<h3>Dénominateurs différents</h3>
<p><strong>3/4 - 1/2</strong></p>
<ol>
<li>Convertir : 1/2 = 2/4</li>
<li>Soustraire : 3/4 - 2/4 = 1/4</li>
</ol>', 
3, 20, 10);

-- ============================================
-- QUIZZES - MATHÉMATIQUES
-- ============================================
INSERT INTO quizzes (subject_id, title, description, emoji, difficulty, estimated_duration, xp_base_reward) VALUES
(1, 'Les fractions - Niveau débutant', 'Testez vos connaissances sur les fractions de base', '🔢', 'easy', 15, 10),
(1, 'Le théorème de Pythagore', 'Maîtrisez le célèbre théorème', '📐', 'hard', 25, 40),
(1, 'Algèbre niveau 1', 'Résoudre des équations simples', '🧮', 'medium', 20, 20);

-- ============================================
-- QUIZ QUESTIONS - Les fractions
-- ============================================
INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, order_index) VALUES
(1, 'Combien font 1/2 + 1/4 ?', '1/6', '2/6', '3/4', '1/3', 2, 
'Pour additionner, on met au même dénominateur : 1/2 = 2/4, donc 2/4 + 1/4 = 3/4', 1),

(1, 'Quelle fraction est la plus grande ?', '1/3', '1/2', '2/5', '3/8', 1,
'En convertissant au même dénominateur, 1/2 = 12/24, 1/3 = 8/24, 2/5 = 9.6/24, 3/8 = 9/24. Donc 1/2 est la plus grande.', 2),

(1, 'Combien font 3/4 - 1/4 ?', '1/2', '1/4', '2/4', '3/8', 0,
'Avec le même dénominateur, on soustrait les numérateurs : 3/4 - 1/4 = 2/4 = 1/2', 3);

-- ============================================
-- QUIZ QUESTIONS - Pythagore
-- ============================================
INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, order_index) VALUES
(2, 'Dans le théorème de Pythagore, a² + b² = ?', 'c²', '2ab', 'a+b', 'ab', 0,
'Le théorème de Pythagore dit que a² + b² = c² où c est l''hypoténuse', 1),

(2, 'Pour quel type de triangle ce théorème s''applique-t-il ?', 'Isocèle', 'Équilatéral', 'Rectangle', 'Quelconque', 2,
'Le théorème de Pythagore s''applique uniquement aux triangles rectangles', 2),

(2, 'Si a=3 et b=4, alors c = ?', '5', '6', '7', '4', 0,
'c² = 3² + 4² = 9 + 16 = 25, donc c = √25 = 5. C''est le célèbre triplet pythagoricien 3-4-5', 3);

-- ============================================
-- QUIZZES - FRANÇAIS
-- ============================================
INSERT INTO quizzes (subject_id, title, description, emoji, difficulty, estimated_duration, xp_base_reward) VALUES
(2, 'Grammaire française', 'Les bases de la grammaire', '📖', 'medium', 20, 20),
(2, 'Conjugaison - Présent', 'Les verbes au présent', '⏰', 'easy', 15, 10);

-- ============================================
-- QUIZ QUESTIONS - Grammaire française
-- ============================================
INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, order_index) VALUES
(4, 'Quel est le sujet dans "Pierre mange une pomme" ?', 'Pierre', 'mange', 'pomme', 'une', 0,
'Le sujet est celui qui fait l''action. C''est Pierre qui mange.', 1),

(4, 'Quel temps est utilisé dans "Elle ira" ?', 'Passé', 'Présent', 'Futur', 'Conditionnel', 2,
'"Ira" est le futur simple du verbe "aller"', 2),

(4, 'Quel est le féminin de "acteur" ?', 'acteuse', 'actrice', 'acteur', 'actée', 1,
'Le féminin de "acteur" est "actrice"', 3);

-- ============================================
-- QUIZZES - SCIENCES
-- ============================================
INSERT INTO quizzes (subject_id, title, description, emoji, difficulty, estimated_duration, xp_base_reward) VALUES
(3, 'La photosynthèse', 'Comment les plantes se nourrissent', '🌱', 'easy', 10, 10);

-- ============================================
-- QUIZ QUESTIONS - La photosynthèse
-- ============================================
INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, order_index) VALUES
(6, 'Où se produit la photosynthèse ?', 'Racines', 'Feuilles', 'Fleurs', 'Tronc', 1,
'La photosynthèse se produit principalement dans les feuilles, grâce à la chlorophylle', 1),

(6, 'Quel gaz est absorbé lors de la photosynthèse ?', 'Oxygène', 'Azote', 'Dioxyde de carbone', 'Argon', 2,
'Les plantes absorbent le CO2 (dioxyde de carbone) et rejettent de l''oxygène', 2),

(6, 'Quel gaz est rejeté ?', 'Oxygène', 'Dioxyde de carbone', 'Helium', 'Hydrogène', 0,
'Les plantes rejettent de l''oxygène, c''est pourquoi elles purifient l''air', 3);

-- ============================================
-- EXERCISES - MATHÉMATIQUES
-- ============================================
INSERT INTO exercises (subject_id, title, description, difficulty, xp_reward) VALUES
(1, 'Pratique des fractions', 'Entraînez-vous avec les fractions', 'easy', 15);

-- ============================================
-- EXERCISE QUESTIONS
-- ============================================
INSERT INTO exercise_questions (exercise_id, question_text, emoji, option_a, option_b, option_c, option_d, correct_option, explanation, order_index) VALUES
(1, 'Combien font 1/2 + 1/4 ?', '🔢', '1/6', '2/6', '3/4', '1/3', 2,
'Pour additionner des fractions, il faut avoir le même dénominateur. 1/2 = 2/4, donc 2/4 + 1/4 = 3/4', 1),

(1, 'Dans un triangle rectangle, quel est le nom du côté le plus long ?', '📐', 'Le côté adjacent', 'L''hypoténuse', 'Le côté opposé', 'La base', 1,
'L''hypoténuse est toujours le côté le plus long d''un triangle rectangle. C''est le côté opposé à l''angle droit.', 2),

(1, 'Combien font 25% de 80 ?', '💯', '15', '20', '25', '30', 1,
'25% = 1/4, donc 80 ÷ 4 = 20', 3);

-- ============================================
-- ACHIEVEMENTS
-- ============================================
INSERT INTO achievements (key, title, description, icon, category, requirement_type, requirement_value, xp_bonus, rarity) VALUES
('first_login', 'Bienvenue !', 'Se connecter pour la première fois', '👋', 'special', 'login', 1, 10, 'common'),
('first_lesson', 'Premier pas', 'Compléter votre première leçon', '📚', 'lesson', 'count', 1, 20, 'common'),
('lesson_master', 'Maître des leçons', 'Compléter 10 leçons', '🎓', 'lesson', 'count', 10, 50, 'rare'),
('first_quiz', 'Explorateur', 'Compléter votre premier quiz', '🎯', 'quiz', 'count', 1, 20, 'common'),
('quiz_master', 'Maître des Quiz', 'Compléter 10 quiz', '✨', 'quiz', 'count', 10, 100, 'epic'),
('perfect_score', 'Score Parfait', 'Obtenir 100% à un quiz', '💯', 'quiz', 'score', 100, 75, 'rare'),
('speed_demon', 'Démon de vitesse', 'Compléter un quiz en moins de 5 minutes', '⚡', 'quiz', 'time', 300, 50, 'rare'),
('streak_3', 'Régularité', 'Maintenir un streak de 3 jours', '🔥', 'streak', 'streak', 3, 30, 'common'),
('streak_7', 'Engagement', 'Maintenir un streak de 7 jours', '🔥🔥', 'streak', 'streak', 7, 70, 'rare'),
('streak_30', 'Légende', 'Maintenir un streak de 30 jours', '🔥🔥🔥', 'streak', 'streak', 30, 200, 'legendary'),
('level_5', 'En progression', 'Atteindre le niveau 5', '⭐', 'special', 'level', 5, 50, 'common'),
('level_10', 'Élite', 'Atteindre le niveau 10', '💎', 'special', 'level', 10, 150, 'epic'),
('math_genius', 'Génie des maths', 'Compléter tous les quiz de mathématiques', '🧮', 'quiz', 'subject', 0, 100, 'epic'),
('all_rounder', 'Polyvalent', 'Compléter au moins un quiz dans chaque matière', '🌟', 'quiz', 'variety', 4, 80, 'rare');

-- ============================================
-- TEST USERS
-- ============================================
INSERT INTO users (username, email, password_hash, xp, level, streak, avatar, last_login_date, is_verified) VALUES
('sarah', 'sarah@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIx3CjKbRm', 450, 5, 7, '👧', CURRENT_DATE, true),
('lucas', 'lucas@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIx3CjKbRm', 280, 3, 3, '👦', CURRENT_DATE, true),
('emma', 'emma@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIx3CjKbRm', 890, 9, 12, '👩', CURRENT_DATE, true),
('maxime', 'maxime@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIx3CjKbRm', 1150, 12, 15, '🧑', CURRENT_DATE, true);

-- ============================================
-- SAMPLE COMPLETIONS FOR TEST DATA
-- ============================================
-- Sarah completes some lessons
INSERT INTO lesson_completions (user_id, lesson_id, time_spent) VALUES
(2, 1, 900),
(2, 2, 1200),
(2, 3, 1080);

-- Sarah takes quizzes
INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, xp_earned, time_spent, is_first_attempt, answers) VALUES
(2, 1, 2, 3, 20, 840, true, '[2, 1, 0]'),
(2, 6, 3, 3, 30, 600, true, '[1, 2, 0]');

-- Award achievements
INSERT INTO user_achievements (user_id, achievement_id) VALUES
(2, 1), -- first_login
(2, 2), -- first_lesson
(2, 4), -- first_quiz
(2, 8); -- streak_3

-- Activity history for Sarah
INSERT INTO activity_history (user_id, activity_type, activity_title, xp_earned, metadata) VALUES
(2, 'lesson', 'Introduction aux fractions', 10, '{"lesson_id": 1}'),
(2, 'lesson', 'Additionner des fractions', 10, '{"lesson_id": 2}'),
(2, 'quiz', 'Les fractions - Niveau débutant', 20, '{"quiz_id": 1, "score": 2, "total": 3}'),
(2, 'achievement', 'Premier pas', 20, '{"achievement_id": 2}');
