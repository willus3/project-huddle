-- database.sql

-- 1. Create the Database (You already did this!)
-- CREATE DATABASE project_huddle;

-- 2. Create the Organization (Tenant)
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(50) DEFAULT '#2563EB',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.1 Create Teams
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    monthly_goal INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    team_id INTEGER REFERENCES teams(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'contributor', -- admin, manager, contributor
    full_name VARCHAR(100),
    monthly_goal INTEGER DEFAULT 5
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
    submitter_id INTEGER REFERENCES users(id),
    assignee_id INTEGER REFERENCES users(id),
    
    title VARCHAR(255) NOT NULL,
    problem_statement TEXT,
    proposed_solution TEXT,
    expected_benefit TEXT,
    
    category VARCHAR(50), -- Safety, Quality, Delivery, Cost, Morale
    impact INTEGER,   -- Numeric impact (1-5)
    effort INTEGER,   -- Numeric effort (1-5)
    
    status VARCHAR(50) DEFAULT 'New',
    is_archived BOOLEAN DEFAULT FALSE,
    next_review_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Monthly Goals (Historical Tracking)
CREATE TABLE monthly_goals (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    user_id INTEGER REFERENCES users(id),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    goal INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id, month, year)
);

-- 7. A3 Worksheets (Pro Tier Feature)
CREATE TABLE a3_worksheets (
    id SERIAL PRIMARY KEY,
    idea_id INTEGER REFERENCES ideas(id) UNIQUE, -- One A3 per Idea
    background TEXT,
    current_condition TEXT,
    target_condition TEXT,
    root_cause_analysis JSONB,
    countermeasures TEXT,
    implementation_plan TEXT,
    effect_confirmation TEXT,
    standardization TEXT,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. SEED DATA
INSERT INTO organizations (name) VALUES ('Acme Manufacturing');
INSERT INTO teams (organization_id, name) VALUES (1, 'Assembly Alpha');
INSERT INTO users (organization_id, team_id, email, password_hash, full_name, role) 
VALUES (1, 1, 'demo@acme.com', 'password', 'Demo User', 'manager');
