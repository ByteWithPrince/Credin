-- 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Credit Accounts
CREATE TABLE credit_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- references auth.users in actual supabase
    type VARCHAR(50) NOT NULL, -- 'credit_card', 'loan', 'bnpl', 'emi'
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    credit_limit DECIMAL(15, 2) NOT NULL DEFAULT 0,
    interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    opened_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    min_payment DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Income Sources
CREATE TABLE income_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    monthly_amount DECIMAL(15, 2) NOT NULL,
    frequency VARCHAR(50) NOT NULL DEFAULT 'monthly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring Expenses
CREATE TABLE recurring_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'rent', 'utility', 'subscription', 'emi'
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Profile
CREATE TABLE financial_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    credit_health_score INT NOT NULL DEFAULT 0,
    debt_load_score INT NOT NULL DEFAULT 0,
    cash_flow_score INT NOT NULL DEFAULT 0,
    emergency_fund_score INT NOT NULL DEFAULT 0,
    payment_reliability_score INT NOT NULL DEFAULT 0,
    utilization_score INT NOT NULL DEFAULT 0,
    overall_health_score INT NOT NULL DEFAULT 0,
    total_available_credit DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_used_credit DECIMAL(15, 2) NOT NULL DEFAULT 0,
    monthly_income DECIMAL(15, 2) NOT NULL DEFAULT 0,
    monthly_obligations DECIMAL(15, 2) NOT NULL DEFAULT 0,
    emergency_fund DECIMAL(15, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simulations
CREATE TABLE simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    question_text TEXT NOT NULL,
    simulation_type VARCHAR(100) NOT NULL,
    input_params JSONB NOT NULL DEFAULT '{}',
    output_results JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Action Plans
CREATE TABLE action_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    plan_type VARCHAR(100) NOT NULL, -- 'score_improvement', 'debt_payoff', 'credit_building'
    current_weaknesses JSONB NOT NULL DEFAULT '[]',
    target_score INT,
    target_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_plan_id UUID NOT NULL REFERENCES action_plans(id) ON DELETE CASCADE,
    month_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    targets JSONB NOT NULL DEFAULT '{}',
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    due_date DATE
);

-- Reminders
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'payment_due', 'milestone', 'dispute_followup', 'utilization_warning', 'checkin'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent BOOLEAN NOT NULL DEFAULT FALSE,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    reference_id UUID, -- optional link to account, milestone, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push Subscriptions
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    device_name VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
