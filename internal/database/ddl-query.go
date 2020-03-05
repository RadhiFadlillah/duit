package database

const ddlCreateUser = `
CREATE TABLE IF NOT EXISTS user (
	id          INT UNSIGNED   NOT NULL AUTO_INCREMENT,
	username    VARCHAR(40)    NOT NULL,
	name        VARCHAR(80)    NOT NULL,
	password    BINARY(60)     NOT NULL,
	permission  JSON           NOT NULL DEFAULT '{}',
	PRIMARY KEY (id),
	UNIQUE KEY user_username_UNIQUE (username))
	CHARACTER SET utf8mb4
`
