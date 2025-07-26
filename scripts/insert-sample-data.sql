-- This script will insert sample data for the authenticated user
-- Note: This should be run after a user is authenticated

-- Sample credit cards (these will be inserted with the current user's ID)
INSERT INTO public.credit_cards (user_id, name, bank, last_four_digits, credit_limit, current_balance, due_date, min_payment, interest_rate, reward_type, color) VALUES
(auth.uid(), 'HDFC Regalia', 'HDFC Bank', '1234', 500000.00, 45000.00, '2024-02-15', 4500.00, 3.49, 'reward_points', '#dc2626'),
(auth.uid(), 'SBI SimplyCLICK', 'State Bank of India', '5678', 200000.00, 15000.00, '2024-02-20', 1500.00, 3.99, 'cashback', '#ef4444'),
(auth.uid(), 'ICICI Amazon Pay', 'ICICI Bank', '9012', 300000.00, 25000.00, '2024-02-25', 2500.00, 3.75, 'cashback', '#f87171');

-- Sample offers (will be linked to the cards above)
INSERT INTO public.offers (card_id, title, description, category, cashback, expiry_date, is_active, min_spend) 
SELECT 
    cc.id,
    'Grocery Cashback',
    '5% cashback on grocery purchases',
    'grocery',
    5.00,
    '2024-03-31',
    true,
    2000.00
FROM public.credit_cards cc WHERE cc.name = 'HDFC Regalia' AND cc.user_id = auth.uid();

INSERT INTO public.offers (card_id, title, description, category, cashback, expiry_date, is_active, min_spend) 
SELECT 
    cc.id,
    'Online Shopping Bonus',
    '10% cashback on online shopping',
    'shopping',
    10.00,
    '2024-04-15',
    true,
    1000.00
FROM public.credit_cards cc WHERE cc.name = 'SBI SimplyCLICK' AND cc.user_id = auth.uid();

INSERT INTO public.offers (card_id, title, description, category, cashback, expiry_date, is_active, min_spend) 
SELECT 
    cc.id,
    'Amazon Purchases',
    '5% unlimited cashback on Amazon',
    'shopping',
    5.00,
    '2024-12-31',
    true,
    500.00
FROM public.credit_cards cc WHERE cc.name = 'ICICI Amazon Pay' AND cc.user_id = auth.uid();

-- Sample expenses
INSERT INTO public.expenses (card_id, user_id, amount, description, category, date, merchant)
SELECT 
    cc.id,
    auth.uid(),
    2500.00,
    'Monthly groceries',
    'grocery',
    '2024-01-15',
    'Big Bazaar'
FROM public.credit_cards cc WHERE cc.name = 'HDFC Regalia' AND cc.user_id = auth.uid();

INSERT INTO public.expenses (card_id, user_id, amount, description, category, date, merchant)
SELECT 
    cc.id,
    auth.uid(),
    1200.00,
    'Online shopping',
    'shopping',
    '2024-01-18',
    'Flipkart'
FROM public.credit_cards cc WHERE cc.name = 'SBI SimplyCLICK' AND cc.user_id = auth.uid();

INSERT INTO public.expenses (card_id, user_id, amount, description, category, date, merchant)
SELECT 
    cc.id,
    auth.uid(),
    800.00,
    'Amazon purchase',
    'shopping',
    '2024-01-20',
    'Amazon'
FROM public.credit_cards cc WHERE cc.name = 'ICICI Amazon Pay' AND cc.user_id = auth.uid();
