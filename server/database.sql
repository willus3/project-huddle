-- database.sql

-- 1. Create the Database (You already did this!)
-- CREATE DATABASE project_huddle;

-- 2. Create the Organization (Tenant)
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'contributor', -- admin, manager, contributor
    full_name VARCHAR(100)
);

-- 4. Create Boards (The Huddle Boards)
CREATE TABLE boards (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- 5. Create Ideas (The Sticky Notes)
CREATE TABLE ideas (
    id SERIAL PRIMARY KEY,
    board_id INTEGER REFERENCES boards(id),
    user_id INTEGER REFERENCES users(id),
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Lean Manufacturing Metrics
    category VARCHAR(50), -- Safety, Quality, Delivery, Cost, Morale
    impact VARCHAR(20),   -- High, Medium, Low
    effort VARCHAR(20),   -- High, Medium, Low
    
    status VARCHAR(50) DEFAULT 'New',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. SEED DATA (Starter data so the app isn't empty)
-- We need this so you can test the app without building a Registration page first.

INSERT INTO organizations (name) VALUES ('Acme Manufacturing');

-- This assumes the organization ID is 1
INSERT INTO users (organization_id, email, password_hash, full_name, role) 
VALUES (1, 'demo@acme.com', 'hashed_secret', 'Demo User', 'manager');

INSERT INTO boards (organization_id, name, description) 
VALUES (1, 'Main Assembly Huddle', 'Daily operational review');