CREATE USER 'app'@'localhost' IDENTIFIED BY 'KGP_m3t3r';

CREATE DATABASE kgp_meter;

USE kgp_meter;

GRANT SELECT, SHOW VIEW, INSERT, UPDATE ON * TO 'app'@'localhost';
GRANT SELECT, SHOW VIEW ON * TO 'stat'@'localhost';

# TABLES

CREATE TABLE request (
  id        INT         NOT NULL AUTO_INCREMENT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id   VARCHAR(64),
  IP        TEXT,
  tree      TEXT        NOT NULL,
  signature VARCHAR(64) NOT NULL,
  number_sequenced         INT,
  lng       VARCHAR(8)  NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE user (
  id         INT                NOT NULL AUTO_INCREMENT,
  user_id    VARCHAR(64) UNIQUE NOT NULL,
  user_agent TEXT,
  source     TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE tree (
  id        INT         NOT NULL AUTO_INCREMENT,
  tree      TEXT        NOT NULL,
  signature VARCHAR(64) NOT NULL UNIQUE,
  number_sequenced         INT,
  PRIMARY KEY (id)
);

CREATE TABLE value (
  id                INT       NOT NULL AUTO_INCREMENT,
  request_id        INT       NOT NULL,
  tree_id         INT,
  maf               REAL      NOT NULL,
  posterior_entropy REAL      DEFAULT NULL,
  exp_error         REAL      DEFAULT NULL,
  computation_time  REAL      DEFAULT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (tree_id)
  REFERENCES tree (id)
    ON DELETE SET NULL,
  FOREIGN KEY (request_id)
  REFERENCES request (id)
    ON DELETE CASCADE
);

CREATE TABLE question (
  id             INT         NOT NULL AUTO_INCREMENT,
  user_id        VARCHAR(64) NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  question       VARCHAR(64) NOT NULL,
  response       TEXT        NOT NULL,
  lng            VARCHAR(8)  NOT NULL,
  survey_trigger VARCHAR(16) NOT NULL,
  PRIMARY KEY (id)
);
