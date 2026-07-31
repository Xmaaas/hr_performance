-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Ápr 22. 07:09
-- Kiszolgáló verziója: 8.0.45
-- PHP verzió: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `hr_performance`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `audit_log`
--

CREATE TABLE `audit_log` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `action` varchar(255) NOT NULL,
  `target_employee_number` varchar(50) DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- A tábla adatainak kiíratása `audit_log`
--

INSERT INTO `audit_log` (`id`, `user_id`, `action`, `target_employee_number`, `timestamp`) VALUES
(1, 28, 'Státusz módosítás: Passive', '1133', '2026-02-22 16:27:18'),
(2, 28, 'Státusz módosítás: Active', '1133', '2026-02-22 16:51:53'),
(3, 16, 'Státusz módosítás: Passive', '1133', '2026-02-22 16:52:36'),
(4, 16, 'Státusz módosítás: Active', '1133', '2026-02-22 16:52:43'),
(5, 28, 'Excel feltöltés', NULL, '2026-02-22 16:54:27'),
(6, 17, 'Státusz módosítás: Active', '1133', '2026-02-22 16:54:50'),
(7, 17, 'Státusz módosítás: Passive', '1122', '2026-02-22 16:54:57'),
(8, 17, 'Státusz módosítás: Active', '1122', '2026-02-22 16:54:58'),
(9, 16, 'Jelszó reset link kiküldése', '1133', '2026-02-22 17:01:58'),
(10, 28, 'Státusz módosítás: Passive', '1133', '2026-02-24 17:26:57'),
(11, 28, 'Státusz módosítás: Active', '1133', '2026-02-24 17:26:57'),
(12, 28, 'Státusz módosítás: Passive', '1111', '2026-02-24 17:27:04'),
(13, 28, 'Státusz módosítás: Active', '1111', '2026-02-24 17:27:06'),
(14, 28, 'Státusz módosítás: Passive', '1114', '2026-03-04 18:04:27'),
(15, 28, 'Státusz módosítás: Active', '1114', '2026-03-04 18:04:28'),
(16, 16, 'Jelszó reset link kiküldése', '1133', '2026-03-08 08:27:22'),
(17, 16, 'Jelszó reset link kiküldése', '1132', '2026-03-28 10:17:49'),
(18, 16, 'Excel feltöltés', NULL, '2026-03-28 10:47:11'),
(19, 17, 'Státusz módosítás: Active', '1133', '2026-03-28 13:43:19'),
(20, 16, 'Excel feltöltés', NULL, '2026-03-28 14:15:50'),
(21, 16, 'Excel feltöltés', NULL, '2026-03-28 14:16:19'),
(22, 16, 'Excel feltöltés', NULL, '2026-03-28 14:19:09'),
(23, 16, 'Státusz módosítás: Active', '1133', '2026-03-28 14:19:12'),
(24, 16, 'Excel feltöltés', NULL, '2026-03-28 14:27:55'),
(25, 16, 'Excel feltöltés', NULL, '2026-03-28 14:28:26'),
(26, 16, 'Státusz módosítás: Active', '1133', '2026-03-28 14:32:39'),
(27, 16, 'Excel feltöltés', NULL, '2026-03-28 14:37:20'),
(28, 16, 'Státusz módosítás: Active', '1133', '2026-03-28 14:37:26'),
(29, 16, 'Excel feltöltés', NULL, '2026-03-28 14:38:32'),
(30, 16, 'Státusz módosítás: Active', '1133', '2026-03-28 14:38:43'),
(31, 16, 'Excel feltöltés', NULL, '2026-03-28 14:39:53'),
(32, 16, 'Státusz módosítás: Active', '1133', '2026-03-28 14:54:30'),
(33, 16, 'Excel feltöltés', NULL, '2026-03-28 14:57:36'),
(34, 16, 'Státusz módosítás: Active', '1133', '2026-03-28 15:06:46'),
(35, 16, 'Státusz módosítás: Passive', '1133', '2026-03-29 11:37:55'),
(36, 16, 'Státusz módosítás: Active', '1133', '2026-03-29 11:37:56'),
(37, 16, 'Excel feltöltés', NULL, '2026-03-29 11:49:46'),
(38, 16, 'Státusz módosítás: Active', '1133', '2026-03-29 11:52:05'),
(39, 16, 'Excel feltöltés', NULL, '2026-03-29 11:53:35'),
(40, 16, 'Jelszó reset link kiküldése', '1133', '2026-04-11 12:00:29'),
(41, 16, 'Jelszó reset link kiküldése', '1133', '2026-04-11 12:11:38'),
(42, 16, 'Jelszó reset link kiküldése', '1133', '2026-04-11 12:16:46'),
(43, 16, 'Jelszó reset link kiküldése', '1133', '2026-04-11 12:19:47'),
(44, 16, 'Jelszó reset link kiküldése', '1133', '2026-04-11 12:27:54'),
(45, 16, 'Jelszó reset link kiküldése', '1133', '2026-04-11 12:30:27'),
(46, 17, 'Jelszó reset link kiküldése', '1133', '2026-04-11 12:40:46'),
(47, 16, 'Jelszó reset link kiküldése', '1133', '2026-04-11 12:56:22'),
(48, 28, 'Státusz módosítás: Active', '1143', '2026-04-11 12:58:10'),
(49, 28, 'Státusz módosítás: Passive', '1143', '2026-04-11 12:58:11');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `employees`
--

CREATE TABLE `employees` (
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `salary` int DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `hire` varchar(50) DEFAULT NULL,
  `employee_number` varchar(50) NOT NULL,
  `role` varchar(50) DEFAULT NULL,
  `leader_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- A tábla adatainak kiíratása `employees`
--

INSERT INTO `employees` (`name`, `email`, `department`, `salary`, `status`, `hire`, `employee_number`, `role`, `leader_id`) VALUES
('Marcus', 'gihraz@eldobhato-level.hu', 'Human Resources', 5830, 'Active', '2021-12-31 01:00:00.000', '1111', 'hr', NULL),
('Brian', 'Brian@demomail.com', 'Sales', 4000, 'Active', '2021-12-31 01:00:00.000', '1112', 'leader', NULL),
('Alan', 'Alan@demomail.com', 'Legal', 5500, 'Active', '2022-01-14 01:00:00.000', '1113', 'leader', NULL),
('Tony', 'Tony@demomail.com', 'Retail', 3000, 'Active', '2022-01-14 01:00:00.000', '1114', 'leader', NULL),
('Agatha', 'Agatha@demomail.com', 'Sales', 3450, 'Active', '2022-02-01 01:00:00.000', '1115', 'user', '1112'),
('Lana', 'livas28677@bitoini.com', 'Accounting', 3500, 'Active', '2022-02-01 01:00:00.000', '1116', 'leader', NULL),
('Heather', 'Heather@demomail.com', 'Accounting', 3125, 'Active', '2022-08-04 02:00:00.000', '1117', 'user', '1116'),
('Ben', 'Ben@demomail.com', 'Sales', 3450, 'Active', '2022-08-04 02:00:00.000', '1118', 'user', '1112'),
('Caitlyn', 'Caitlyn@demomail.com', 'Retail', 2785, 'Active', '2022-03-01 01:00:00.000', '1119', 'user', '1114'),
('Gibbs', 'Gibbs@demomail.com', 'Retail', 2785, 'Active', '2022-03-01 01:00:00.000', '1120', 'user', '1114'),
('Anderson', 'Anderson@demomail.com', 'Sales', 3450, 'Active', '2022-03-01 01:00:00.000', '1121', 'user', '1112'),
('Michael', 'Michael@demomail.com', 'Retail', 2785, 'Active', '2022-03-01 01:00:00.000', '1122', 'user', '1114'),
('David', 'David@demomail.com', 'Sales', 3450, 'Active', '2022-03-15 01:00:00.000', '1123', 'user', '1112'),
('Jacob', 'sodfej@eldobhato-level.hu', 'Support', 3000, 'Active', '2022-03-15 01:00:00.000', '1124', 'leader', '1116'),
('John', 'John@demomail.com', 'Business Development', 3500, 'Active', '2022-04-01 02:00:00.000', '1125', 'leader', NULL),
('Leonardo', 'Leonardo@demomail.com', 'Business Development', 3100, 'Active', '2022-04-01 02:00:00.000', '1126', 'user', '1125'),
('Matthew', 'Matthew@demomail.com', 'Human Resources', 5830, 'Active', '2022-04-17 02:00:00.000', '1127', 'hr', NULL),
('Joana', 'Joana@demomail.com', 'Business Development', 3100, 'Active', '2022-06-01 02:00:00.000', '1128', 'user', '1125'),
('Ross', 'Ross@demomail.com', 'Legal', 4920, 'Active', '2022-07-02 02:00:00.000', '1129', 'user', '1113'),
('Joey', 'Joey@demomail.com', 'Business Development', 3100, 'Active', '2022-07-15 02:00:00.000', '1130', 'user', '1125'),
('Jack', 'Jack@demomail.com', 'Support', 2500, 'Active', '2022-01-03 01:00:00.000', '1131', 'user', '1124'),
('GaborA', 'karacsony.gabor.istvan@gmail.com', 'IT', 5500, 'Active', '2022-01-03 01:00:00.000', '1132', 'admin', NULL),
('GaborU', 'karacsony.gabor.istvan.yt@gmail.com', 'IT', 5000, 'Active', '2022-01-03 01:00:00.000', '1133', 'user', '1116'),
('Winston', 'Winston@demomail.com', 'Accounting', 3125, 'Active', '2022-02-01 01:00:00.000', '1134', 'user', '1116'),
('Ashley', 'Ashley@demomail.com', 'Support', 2500, 'Active', '2025-03-25 01:00:00.000', '1135', 'user', '1124'),
('Bob', 'Bob@demomail.com', 'Support', 2500, 'Active', '2025-03-26 01:00:00.000', '1136', 'user', '1124'),
('Alex', 'Alex@demomail.com', 'IT', 2500, 'Active', '2025-03-27 01:00:00.000', '1137', 'user', '1132'),
('John', 'John@demomail.com', 'IT', 2500, 'Active', '2025-03-28 01:00:00.000', '1138', 'user', '1132'),
('Steven', 'Steven@demomail.com', 'Accounting', 2500, 'Passive', '2025-03-29 01:00:00.000', '1139', 'user', '1116'),
('Johnas', 'Johnas@demomail.com', 'Accounting', 2500, 'Passive', '2025-03-30 01:00:00.000', '1140', 'user', '1116'),
('Matthias', 'Matthias@demomail.com', 'Legal', 2500, 'Active', '2025-03-31 02:00:00.000', '1141', 'user', '1113'),
('Ben', 'Ben@demomail.com', 'Legal', 2500, 'Active', '2025-04-01 02:00:00.000', '1142', 'user', '1113'),
('Marcus', 'Marcus@demomail.com', 'Human Resources', 2500, 'Passive', '2025-04-02 02:00:00.000', '1143', 'hr', NULL),
('Mark', 'Mark@demomail.com', 'Retail', 2500, 'Active', '2025-04-03 02:00:00.000', '1144', 'user', '1114'),
('Toby', 'Toby@demomail.com', 'Retail', 2500, 'Active', '2025-04-04 02:00:00.000', '1145', 'user', '1114'),
('Admin', 'admin@admin.com', 'ADMIN', 1, 'Active', '2022-01-04 01:00:00.000', '9999', 'admin', NULL);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `goals`
--

CREATE TABLE `goals` (
  `id` int UNSIGNED NOT NULL,
  `leader_id` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `is_team_goal` tinyint(1) DEFAULT '0',
  `created_at` date DEFAULT NULL,
  `closed_at` date DEFAULT NULL,
  `final_score` int DEFAULT NULL,
  `final_comment` text,
  `priority` varchar(20) DEFAULT 'medium',
  `deadline` date DEFAULT NULL,
  `progress_frequency` varchar(50) DEFAULT NULL,
  `progress_days` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- A tábla adatainak kiíratása `goals`
--

INSERT INTO `goals` (`id`, `leader_id`, `name`, `description`, `is_team_goal`, `created_at`, `closed_at`, `final_score`, `final_comment`, `priority`, `deadline`, `progress_frequency`, `progress_days`) VALUES
(49, '1116', 'a4gaeg', 'gsese', 0, '2026-04-18', NULL, NULL, NULL, 'high', '2027-11-18', 'monthly', 'Monday,Wednesday'),
(50, '1116', 'esífí', 'esíygíseg', 0, '2026-04-18', NULL, NULL, NULL, 'high', '2026-04-23', 'monthly', 'Monday');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `goal_assignments`
--

CREATE TABLE `goal_assignments` (
  `id` int UNSIGNED NOT NULL,
  `goal_id` int UNSIGNED NOT NULL,
  `employee_number` varchar(50) NOT NULL,
  `visible_to_employee` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- A tábla adatainak kiíratása `goal_assignments`
--

INSERT INTO `goal_assignments` (`id`, `goal_id`, `employee_number`, `visible_to_employee`) VALUES
(84, 49, '1139', 1),
(85, 49, '1124', 1),
(86, 49, '1133', 1),
(87, 50, '1134', 1),
(88, 50, '1133', 1);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `goal_updates`
--

CREATE TABLE `goal_updates` (
  `id` int UNSIGNED NOT NULL,
  `goal_id` int UNSIGNED NOT NULL,
  `employee_number` varchar(50) NOT NULL,
  `progress` int DEFAULT NULL,
  `comment` text,
  `created_at` date DEFAULT NULL,
  `created_real` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- A tábla adatainak kiíratása `password_resets`
--

INSERT INTO `password_resets` (`id`, `user_id`, `token`, `expires_at`, `created_at`) VALUES
(1, 18, '3f30f338db30c3cd87311ae17cdf04436f9dc7252a8ebf31951f255f43fd8adb', '2026-04-11 11:36:55', '2026-04-11 09:06:55'),
(2, 18, 'a4819be4c532a93892af3e1fbea266345897e95162bf2dc6d4d8cacfcd71a62e', '2026-04-11 11:37:57', '2026-04-11 09:07:56'),
(3, 18, 'b16a8b906d1795eb980efa5b568e470eacbd1bf24d0ae084dde0fb084f427e01', '2026-04-11 11:38:55', '2026-04-11 09:08:54'),
(4, 18, '6962cb6a99e3ab60bf6a526916816733d0555a282d95f0b463bad700a10571f2', '2026-04-11 11:39:27', '2026-04-11 09:09:26'),
(5, 18, 'd0fccd6d78b884d30addcb14d4105093dc337af4b004a3afed0e95f922cddc6a', '2026-04-11 11:44:00', '2026-04-11 09:14:00'),
(6, 17, '5eb44a2f47f33e06e4f08c7c81bc1571d5418b369d393210f101e3f28f0c101d', '2026-04-11 11:45:54', '2026-04-11 09:15:54'),
(7, 18, '26d29063d6a5068a9f99d2044c746222841252462434f4b1df8a080d7dd46c70', '2026-04-11 11:47:39', '2026-04-11 09:17:38'),
(8, 18, 'd6ae2256389ae3a3d14e64d9788f2d2fc84212f87a8d7083dc804e0ad48ab8c7', '2026-04-11 11:52:59', '2026-04-11 09:22:58'),
(9, 18, '1cf971f577751463f8675cc7bdae53b006eb322348be333be330976c53a281b1', '2026-04-11 11:54:57', '2026-04-11 09:24:56'),
(10, 18, '485082f42108fe7b40b74f7e7d090eff3afee26dd8b26208fccc4ea67288a266', '2026-04-11 11:55:36', '2026-04-11 09:25:35'),
(11, 18, '3250d2859381f20cc9f20c1f56f5bb4707dc6b134cbddbe06058912c5e729b85', '2026-04-11 11:59:26', '2026-04-11 09:29:25'),
(14, 18, '06fa1e853bdba87d15870b72525b047aaec4b1a5cf5618f18b47ea57cf71b5e8', '2026-04-11 12:47:11', '2026-04-11 10:17:11'),
(15, 18, '2a877b0624dfa4937be923417f70529bfeb3b26159edfffa27c595f4aed361ff', '2026-04-11 12:50:09', '2026-04-11 10:20:09'),
(16, 17, '96fafcd32ee674956c2dd5654d5cc733fda0e3a562bab5987f207590ef2d9974', '2026-04-11 12:50:44', '2026-04-11 10:20:44');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `users`
--

CREATE TABLE `users` (
  `id` int UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('admin','hr','leader','user') NOT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `employee_number` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- A tábla adatainak kiíratása `users`
--

INSERT INTO `users` (`id`, `email`, `name`, `password`, `role`, `reset_token`, `reset_expires`, `created_at`, `updated_at`, `employee_number`) VALUES
(16, 'admin@admin.com', 'Admin', '$2b$10$nMxTrBZhZfDjf7vTAn/wbefpW7vpQ.2F96j.GMKTp6.kU5ar.boHe', 'admin', NULL, NULL, '2026-02-20 14:29:56', '2026-03-28 13:28:26', '9999'),
(17, 'karacsony.gabor.istvan@gmail.com', 'Gabor', '$2b$10$MI0eeo76mtqKpoE/MaAlVOZ7YOvqtX2e4YzAVF150UOXf9cjFIEXO', 'admin', 'e13b05110ef8b285c7b32023d41df64ee8c4ed6bce8c7cc60ea9eb1c4e8f24c0', '2026-03-28 11:17:49', '2026-02-20 14:32:18', '2026-03-28 13:28:26', '1132'),
(18, 'karacsony.gabor.istvan.yt@gmail.com', 'Gaboru', '$2b$10$bEtfXX3T5nwh71M5PVMh.OZeYRJ8BtSL6Q/0ipWbne/vYcJ6MrXB6', 'user', NULL, NULL, '2026-02-20 14:32:48', '2026-04-11 10:56:30', '1133'),
(27, 'livas28677@bitoini.com', 'Lana', '$2b$10$s.R24bwdabKKSzs1K6OHiuFWeTEwY5.fX7PHb/Jhtseh7n.S4UCo6', 'leader', NULL, NULL, '2026-02-20 14:58:24', '2026-03-28 13:28:26', '1116'),
(28, 'gihraz@eldobhato-level.hu', 'Marcus', '$2b$10$HtXA.LvYGe2W1qMDWVWHC.NvKC6uhuvpzx/KB8CaSe/vg.yy.ooNC', 'hr', NULL, NULL, '2026-02-20 18:31:10', '2026-03-28 13:28:26', '1111'),
(39, 'sodfej@eldobhato-level.hu', 'Jacob', '$2b$10$jwIF9UfMou2xFJ11.26EzekUnZMDlyFTf5LABrGTrpOigKXjmZ5I.', 'leader', NULL, NULL, '2026-03-28 09:17:13', '2026-03-28 13:28:26', '1124');

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`employee_number`);

--
-- A tábla indexei `goals`
--
ALTER TABLE `goals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leader_id` (`leader_id`);

--
-- A tábla indexei `goal_assignments`
--
ALTER TABLE `goal_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `goal_id` (`goal_id`),
  ADD KEY `employee_number` (`employee_number`);

--
-- A tábla indexei `goal_updates`
--
ALTER TABLE `goal_updates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `goal_id` (`goal_id`),
  ADD KEY `employee_number` (`employee_number`);

--
-- A tábla indexei `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_employee` (`employee_number`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT a táblához `goals`
--
ALTER TABLE `goals`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT a táblához `goal_assignments`
--
ALTER TABLE `goal_assignments`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;

--
-- AUTO_INCREMENT a táblához `goal_updates`
--
ALTER TABLE `goal_updates`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT a táblához `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `goal_assignments`
--
ALTER TABLE `goal_assignments`
  ADD CONSTRAINT `goal_assignments_ibfk_1` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`),
  ADD CONSTRAINT `goal_assignments_ibfk_2` FOREIGN KEY (`employee_number`) REFERENCES `employees` (`employee_number`);

--
-- Megkötések a táblához `goal_updates`
--
ALTER TABLE `goal_updates`
  ADD CONSTRAINT `goal_updates_ibfk_1` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`),
  ADD CONSTRAINT `goal_updates_ibfk_2` FOREIGN KEY (`employee_number`) REFERENCES `employees` (`employee_number`);

--
-- Megkötések a táblához `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_employee` FOREIGN KEY (`employee_number`) REFERENCES `employees` (`employee_number`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
