-- Final setup script for credit card tracker
-- This script ensures all tables and policies are properly configured

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can insert own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can update own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can delete own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can manage own credit cards" ON public.credit_cards;

DROP POLICY IF EXISTS "Users can view offers for own cards" ON public.offers;
DROP POLICY IF EXISTS "Users can insert offers for own cards" ON public.offers;
DROP POLICY IF EXISTS "Users can update offers for own cards" ON public.offers;
DROP POLICY IF EXISTS "Users can delete offers for own cards" ON public.offers;
DROP POLICY IF EXISTS "Users can manage offers for own cards" ON public.offers;

DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can manage own expenses" ON public.expenses;

-- Create comprehensive RLS policies
CREATE POLICY "Users can manage own credit cards" ON public.credit_cards
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage offers for own cards" ON public.offers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.credit_cards 
            WHERE credit_cards.id = offers.card_id 
            AND credit_cards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own expenses" ON public.expenses
    FOR ALL USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create or update indexes
DROP INDEX IF EXISTS idx_credit_cards_user_id;
DROP INDEX IF EXISTS idx_offers_card_id;
DROP INDEX IF EXISTS idx_expenses_user_id;
DROP INDEX IF EXISTS idx_expenses_card_id;
DROP INDEX IF EXISTS idx_expenses_date;

CREATE INDEX idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX idx_offers_card_id ON public.offers(card_id);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_card_id ON public.expenses(card_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.credit_cards TO anon, authenticated;
GRANT ALL ON public.offers TO anon, authenticated;
GRANT ALL ON public.expenses TO anon, authenticated;
