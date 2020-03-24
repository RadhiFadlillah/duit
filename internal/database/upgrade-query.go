package database

const ddlUpgradeUserAddAdmin = `
	ALTER TABLE user
	ADD COLUMN IF NOT EXISTS admin BOOLEAN NOT NULL DEFAULT 1
`
