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

const ddlCreateViewAccountTotal = `
CREATE VIEW IF NOT EXISTS account_total AS 
	WITH income AS (
		SELECT account_id id, SUM(amount) amount FROM entry
		WHERE type = 1
		GROUP BY account_id),
	expense AS (
		SELECT account_id id, SUM(amount) amount FROM entry
		WHERE type = 2
		GROUP BY account_id),
	moved AS (
		SELECT account_id id, SUM(amount) amount FROM entry
		WHERE type = 3
		GROUP BY account_id),
	received AS (
		SELECT affected_account_id id, SUM(amount) amount FROM entry
		WHERE type = 3
		GROUP BY affected_account_id)
	SELECT a.id, a.name, a.initial_amount,
		a.initial_amount + 
		IFNULL(i.amount, 0) - 
		IFNULL(e.amount, 0) - 
		IFNULL(m.amount, 0) + 
		IFNULL(r.amount, 0) total
	FROM account a
	LEFT JOIN income i ON i.id = a.id
	LEFT JOIN expense e ON e.id = a.id
	LEFT JOIN moved m ON m.id = a.id
	LEFT JOIN received r ON r.id = a.id
`
