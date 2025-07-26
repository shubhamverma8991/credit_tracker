-- Enable RLS (Row Level Security)
ALTER TABLE IF EXISTS public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.expenses;
DROP TABLE IF EXISTS public.offers;
DROP TABLE IF EXISTS public.credit_cards;

-- Create credit_cards table
CREATE TABLE public.credit_cards (
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
CREATE TABLE public.offers (
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
CREATE TABLE public.expenses (
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

-- Create RLS policies
CREATE POLICY "Users can view own credit cards" ON public.credit_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit cards" ON public.credit_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credit cards" ON public.credit_cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credit cards" ON public.credit_cards
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view offers for own cards" ON public.offers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.credit_cards 
            WHERE credit_cards.id = offers.card_id 
            AND credit_cards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert offers for own cards" ON public.offers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.credit_cards 
            WHERE credit_cards.id = offers.card_id 
            AND credit_cards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update offers for own cards" ON public.offers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.credit_cards 
            WHERE credit_cards.id = offers.card_id 
            AND credit_cards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete offers for own cards" ON public.offers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.credit_cards 
            WHERE credit_cards.id = offers.card_id 
            AND credit_cards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own expenses" ON public.expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX idx_offers_card_id ON public.offers(card_id);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_card_id ON public.expenses(card_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);
