-- Studyboard Bucks: the paid currency is now called Studyboard Bucks (green bills) in the app. Safe to run again.
-- Nothing about how it works changes: the tables, functions, packs and Stripe prices keep their credit names
-- (studyboard_credit_*, studyboard_credits_me, credits_300...). This only renames the packs' labels.
-- The earned Studyboard Credits (gold coins, for companion accessories) live in each student's own settings, not here.
update public.studyboard_credit_packs set label = replace(label, 'Credits', 'Bucks') where label like '%Credits%';
