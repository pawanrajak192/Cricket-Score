CREATE DATABASE IF NOT EXISTS cricket_scorecard
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE cricket_scorecard;

CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(40) PRIMARY KEY,
  name          VARCHAR(120)     NOT NULL,
  email         VARCHAR(190)     NULL,
  mobile        VARCHAR(20)      NULL,
  password_hash VARCHAR(255)     NOT NULL,
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email  (email),
  UNIQUE KEY uq_users_mobile (mobile)
) ENGINE=InnoDB;

-- Matches store teams/innings/result as JSON: the ball-by-ball engine on the
-- frontend (src/engine/scoringEngine.js) is the single source of truth for
-- how an event log turns into a score, so the server just persists whatever
-- shape the client sends and hands it back unchanged. See server/README.md
-- for the tradeoffs and how to normalize into an `events` table later.
CREATE TABLE IF NOT EXISTS matches (
  id               VARCHAR(40)  PRIMARY KEY,
  owner_id         VARCHAR(40)  NOT NULL,
  name             VARCHAR(190) NOT NULL,
  date             DATE         NOT NULL,
  match_type       VARCHAR(20)  NOT NULL,
  overs_limit      INT          NULL,
  wickets_limit    INT          NOT NULL DEFAULT 10,
  powerplay_overs  INT          NULL,
  status           VARCHAR(20)  NOT NULL DEFAULT 'draft',
  team_a           JSON         NOT NULL,
  team_b           JSON         NOT NULL,
  toss             JSON         NULL,
  innings          JSON         NOT NULL,
  result           JSON         NULL,
  created_at       BIGINT       NOT NULL,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_matches_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_matches_owner (owner_id),
  INDEX idx_matches_status (status),
  INDEX idx_matches_type (match_type)
) ENGINE=InnoDB;
