package database

const ddlCreateAccount = `
CREATE TABLE IF NOT EXISTS account (
	id          INT UNSIGNED   NOT NULL AUTO_INCREMENT,
	username    VARCHAR(40)    NOT NULL,
	name        VARCHAR(80)    NOT NULL,
	password    BINARY(60)     NOT NULL,
	permission  JSON           NOT NULL DEFAULT '{}',
	PRIMARY KEY (id),
	UNIQUE KEY account_username_UNIQUE (username))
	CHARACTER SET utf8mb4
`
