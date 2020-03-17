package database

const ddlCreateUser = `
CREATE TABLE IF NOT EXISTS user (
	id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
	username    VARCHAR(40)  NOT NULL,
	name        VARCHAR(80)  NOT NULL,
	password    BINARY(60)   NOT NULL,
	permission  JSON         NOT NULL DEFAULT '{}',
	PRIMARY KEY (id),
	UNIQUE KEY user_username_UNIQUE (username))
	CHARACTER SET utf8mb4
`

const ddlCreateAccount = `
CREATE TABLE IF NOT EXISTS account (
	id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
	name           VARCHAR(100)  NOT NULL,
	initial_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
	creation_date  DATE          NOT NULL,
	PRIMARY KEY (id))
	CHARACTER SET utf8mb4
`

const ddlCreateEntry = `
CREATE TABLE IF NOT EXISTS entry (
	id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
	account_id          INT UNSIGNED  NOT NULL,
	affected_account_id INT UNSIGNED  DEFAULT NULL,
	type                INT UNSIGNED  NOT NULL,
	description         VARCHAR(150)  DEFAULT NULL,
	amount              DECIMAL(20,4) NOT NULL,
	date                DATE          NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY entry_account_id_FK (account_id) REFERENCES account (id)
		ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY entry_affected_account_id_FK (affected_account_id) REFERENCES account (id)
		ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT CHECK (affected_account_id <> account_id),
	CONSTRAINT CHECK (type >= 1 AND type <= 3))
	CHARACTER SET utf8mb4
`
