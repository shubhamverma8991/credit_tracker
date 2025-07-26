-- Simple setup script for credit card tracker
-- This creates the basic structure needed for the app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create credit_cards table
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    bank VARCHAR(100) NOT NULL,
    last_four_digits VARCHAR(4) NOT NULL,
    credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    min_payment DECIMAL(12,2) NOT NULL DEFAULT 0,
    interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    reward_type VARCHAR(50) NOT NULL DEFAULT 'cashback',
    color VARCHAR(20) NOT NULL DEFAULT '#ef4444',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offers table
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    cashback DECIMAL(5,2) NOT NULL DEFAULT 0,
    expiry_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    min_spend DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    description VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    merchant VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own credit cards" ON public.credit_cards
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage offers for own cards" ON public.offers
    USING (
        EXISTS (
            SELECT 1 FROM public.credit_cards 
            WHERE credit_cards.id = offers.card_id 
            AND credit_cards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own expenses" ON public.expenses
    USING (auth.uid() = user_id);
