package database

const ddlCreateUser = `
CREATE TABLE IF NOT EXISTS user (
	id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
	username VARCHAR(40)  NOT NULL,
	name     VARCHAR(80)  NOT NULL,
	password BINARY(60)   NOT NULL,
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

const ddlCreateCategory = `
CREATE TABLE IF NOT EXISTS category (
	id					INT UNSIGNED  NOT NULL AUTO_INCREMENT,
	account_id			INT UNSIGNED NOT NULL,
	name				VARCHAR(80)  NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY category_account_id_FK (account_id) REFERENCES account (id)
		ON UPDATE CASCADE ON DELETE CASCADE)
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
	category            INT UNSIGNED  DEFAULT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY entry_account_id_FK (account_id) REFERENCES account (id)
		ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY entry_affected_account_id_FK (affected_account_id) REFERENCES account (id)
		ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY entry_category_FK (category) REFERENCES category(id)
		ON UPDATE CASCADE ON DELETE SET NULL,
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

const ddlCreateViewCumulativeAmount = `
CREATE VIEW IF NOT EXISTS cumulative_amount AS
	WITH entry_list AS (
		SELECT id, account_id, affected_account_id, type,
			description, amount, DATE_FORMAT(date, "%Y-%m") month
		FROM entry),
	account_list AS (
		SELECT DISTINCT account_id id, month
		FROM entry_list),
	income AS (
		SELECT account_id id, month, SUM(amount) amount 
		FROM entry_list
		WHERE type = 1
		GROUP BY account_id, month),
	expense AS (
		SELECT account_id id, month, SUM(amount) amount 
		FROM entry_list
		WHERE type = 2
		GROUP BY account_id, month),
	moved AS (
		SELECT account_id id, month, SUM(amount) amount 
		FROM entry_list
		WHERE type = 3
		GROUP BY account_id, month),
	received AS (
		SELECT affected_account_id id, month, SUM(amount) amount 
		FROM entry_list
		WHERE type = 3
		GROUP BY affected_account_id, month),
	monthly_profit AS (
		SELECT al.id account_id, al.month, 
			a.name, a.initial_amount,
			IFNULL(i.amount, 0) income,
			IFNULL(e.amount, 0) expense,
			IFNULL(m.amount, 0) moved,
			IFNULL(r.amount, 0) received,
			IFNULL(i.amount, 0) - 
			IFNULL(e.amount, 0) - 
			IFNULL(m.amount, 0) + 
			IFNULL(r.amount, 0) profit
		FROM account_list al
		LEFT JOIN account a ON al.id = a.id
		LEFT JOIN income i ON i.id = al.id AND i.month = al.month
		LEFT JOIN expense e ON e.id = al.id AND e.month = al.month
		LEFT JOIN moved m ON m.id = al.id AND m.month = al.month
		LEFT JOIN received r ON r.id = al.id AND r.month = al.month)
	SELECT account_id, month, 
		SUM(profit) OVER (PARTITION BY account_id ORDER BY month) + initial_amount amount
	FROM monthly_profit
`
