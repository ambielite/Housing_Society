-- =====================================================================
-- Migration 001: Identity, RBAC & Society Context foundation
-- Matches: "Housing Society Management Platform - Database Architecture"
--          Section 4 (Identity & RBAC) and Section 5 (Society & Physical
--          Hierarchy) - only the tables required for Phase 1
--          (Authentication, JWT, RBAC, Society context).
--
-- NOTE on scope: towers/floors/units/society_settings and the rest of the
-- physical hierarchy belong to Phase 2 ("Society, tower, floor, unit
-- foundation") per the Development Roadmap and are intentionally NOT
-- created here. Only `addresses` + `societies` are included because
-- users.society_id requires a societies table to reference.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Reusable address master (referenced by societies.address_id)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line1        VARCHAR(255),
  line2        VARCHAR(255),
  city         VARCHAR(100),
  state        VARCHAR(100),
  postal_code  VARCHAR(20),
  country      VARCHAR(100),
  latitude     NUMERIC(10, 6),
  longitude    NUMERIC(10, 6),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- societies: id, legal_name, display_name, registration_no, rera_no,
-- pan, gstin, address_id, timezone, currency, status  (exact DB-doc fields)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS societies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name        VARCHAR(255) NOT NULL,
  display_name      VARCHAR(255),
  registration_no   VARCHAR(100),
  rera_no           VARCHAR(100),
  pan               VARCHAR(20),
  gstin             VARCHAR(20),
  address_id        UUID REFERENCES addresses(id),
  timezone          VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  currency          VARCHAR(10) NOT NULL DEFAULT 'INR',
  status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- users: id, email(UNIQUE), phone, password_hash, first_name, last_name,
-- status, last_login_at, society_id  (exact DB-doc fields)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id     UUID REFERENCES societies(id) ON DELETE SET NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  phone          VARCHAR(20),
  password_hash  VARCHAR(255) NOT NULL,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100),
  status         VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- roles: id, society_id(nullable = global/system role), name, code,
-- description, is_system_role, status  (exact DB-doc fields)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id      UUID REFERENCES societies(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  code            VARCHAR(50) NOT NULL,
  description     VARCHAR(255),
  is_system_role  BOOLEAN NOT NULL DEFAULT false,
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (society_id, code)
);

-- Postgres treats NULL <> NULL, so the UNIQUE(society_id, code) constraint
-- above does NOT stop duplicate global (society_id IS NULL) role codes.
-- This partial index closes that gap for system/global roles.
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_global_code
  ON roles (code) WHERE society_id IS NULL;

-- ---------------------------------------------------------------------
-- permissions: id, code(UNIQUE), name, module, action, description
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         VARCHAR(100) NOT NULL UNIQUE,
  name         VARCHAR(150) NOT NULL,
  module       VARCHAR(50) NOT NULL,
  action       VARCHAR(50) NOT NULL,
  description  VARCHAR(255),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- user_roles: user_id(PK/FK), role_id(PK/FK), society_id(FK),
-- assigned_at, assigned_by(FK)  (exact DB-doc fields/PK)
--
-- IMPORTANT (matches the doc's stated PK exactly): the primary key is
-- (user_id, role_id) ONLY - society_id is a plain FK column, not part of
-- the key. Practical effect: a given user can hold a given role code only
-- once overall; assigning it again just moves/updates the society_id on
-- that same row (see rbac.repository.js assignRoleToUser). If your team
-- later needs the SAME role held independently across multiple societies
-- for one user, the PK will need to be widened to include society_id.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id      UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  society_id   UUID REFERENCES societies(id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by  UUID REFERENCES users(id),
  PRIMARY KEY (user_id, role_id)
);

-- ---------------------------------------------------------------------
-- role_permissions: role_id(PK/FK), permission_id(PK/FK)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id        UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id  UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ---------------------------------------------------------------------
-- refresh_tokens: id, user_id, token_hash(UNIQUE), expires_at,
-- revoked_at, device_info, ip_address  (exact DB-doc fields, plus
-- created_at per the doc's own general table convention in Section 3)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   VARCHAR(255) NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  device_info  VARCHAR(255),
  ip_address   VARCHAR(64),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- login_history: id, user_id, login_at, logout_at, ip_address,
-- user_agent, success, failure_reason  (exact DB-doc fields)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  login_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  logout_at       TIMESTAMPTZ,
  ip_address      VARCHAR(64),
  user_agent      VARCHAR(255),
  success         BOOLEAN NOT NULL,
  failure_reason  VARCHAR(100)
);

-- ---------------------------------------------------------------------
-- password_reset_tokens: id, user_id, token_hash(UNIQUE), expires_at,
-- used_at  (exact DB-doc fields)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   VARCHAR(255) NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- user_society_access: user_id(PK/FK), society_id(PK/FK), access_level,
-- active_from, active_until  (exact DB-doc fields). Scaffolded now for
-- Phase 18 (multi-society/cluster); no API endpoints yet in Phase 1.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_society_access (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  society_id    UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  access_level  VARCHAR(30) NOT NULL DEFAULT 'MEMBER',
  active_from   TIMESTAMPTZ NOT NULL DEFAULT now(),
  active_until  TIMESTAMPTZ,
  PRIMARY KEY (user_id, society_id)
);

-- ---------------------------------------------------------------------
-- Indexes for auth/RBAC hot paths
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_society        ON users(society_id);
CREATE INDEX IF NOT EXISTS idx_users_status          ON users(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user        ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_society     ON user_roles(society_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role  ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user    ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user     ON login_history(user_id, login_at DESC);
CREATE INDEX IF NOT EXISTS idx_pw_reset_user          ON password_reset_tokens(user_id);
