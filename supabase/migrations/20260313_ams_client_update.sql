-- ============================================================
-- AMS CLIENT DATA UPDATE — March 2026
-- Source: ConnectWise agreements export (AMS lines only)
-- Safe to run on existing data — uses UPDATE + conditional INSERT
-- Skips Handling Fee, DAAS, and blank agreement types
-- ============================================================


-- ============================================================
-- SECTION 1: UPDATE EXISTING CLIENT RECORDS
-- Corrects amounts, dates, names, and contacts from new export
-- ============================================================

-- Black Creek CHC (was "Black Creek Community Health Centers") — amount updated to $12,675
UPDATE public.ams_clients SET
    company_name    = 'Black Creek CHC',
    agreement_type  = 'AMS - Remote/Onsite Support',
    agreement_name  = 'Audcomp Managed Services - Platinum Support',
    contact_name    = 'Savitri Outar',
    monthly_amount  = 12675.00,
    billing_cycle   = 'Monthly',
    contract_start  = '2024-06-01',
    contract_end    = '2027-05-31',
    updated_at      = NOW()
WHERE company_name ILIKE '%Black Creek%';

-- Flux Mechanical — end date extended to July 2028
UPDATE public.ams_clients SET
    agreement_type  = 'AMS - Essentials',
    agreement_name  = 'Audcomp Managed Services - Essentials',
    contact_name    = 'Nik Hall',
    monthly_amount  = 599.00,
    contract_start  = '2023-05-01',
    contract_end    = '2028-07-31',
    updated_at      = NOW()
WHERE company_name ILIKE '%Flux Mechanical%';

-- Ford Performance Centre — new agreement starting Feb 2026 at $840/mo
UPDATE public.ams_clients SET
    agreement_type  = 'AMS - Remote w/Monthly Maintenance',
    agreement_name  = 'Audcomp Managed Services - Silver Support',
    contact_name    = 'Graham Cocking',
    monthly_amount  = 840.00,
    billing_cycle   = 'Monthly',
    contract_start  = '2026-02-01',
    contract_end    = '2029-01-31',
    updated_at      = NOW()
WHERE company_name ILIKE '%Ford Performance%';

-- Hamilton Wentworth Elementary Teachers' Local — updated to Quarterly Maintenance
UPDATE public.ams_clients SET
    agreement_type  = 'AMS - Maintenance - Onsite or Remote',
    agreement_name  = 'Audcomp Managed Services - Quarterly Onsite Maintenance',
    contact_name    = 'Carleigh Hochheimer',
    monthly_amount  = 140.00,   -- $420/quarter normalized to monthly equivalent
    billing_cycle   = 'Quarterly',
    contract_start  = '2022-11-29',
    contract_end    = '2026-11-30',
    updated_at      = NOW()
WHERE company_name ILIKE '%Hamilton Wentworth Elementary%';

-- Hasty Market Corp — updated to Essentials $699/mo
UPDATE public.ams_clients SET
    agreement_type  = 'AMS - Essentials',
    agreement_name  = 'Audcomp Managed Services - Essentials',
    contact_name    = 'Mahassen Farah',
    monthly_amount  = 699.00,
    billing_cycle   = 'Monthly',
    contract_start  = '2025-09-01',
    contract_end    = '2028-08-31',
    updated_at      = NOW()
WHERE company_name ILIKE '%Hasty Market%';

-- John G. Hofland Ltd — updated to Monitoring $699/mo
UPDATE public.ams_clients SET
    agreement_type  = 'AMS - Monitoring Only',
    agreement_name  = 'Audcomp Managed Services - Monitoring',
    contact_name    = 'Rahim Khan',
    monthly_amount  = 699.00,
    billing_cycle   = 'Monthly',
    contract_start  = '2025-09-01',
    contract_end    = '2028-08-31',
    updated_at      = NOW()
WHERE company_name ILIKE '%Hofland%';

-- Karen Cerello CPA — updated contract dates
UPDATE public.ams_clients SET
    agreement_type  = 'AMS - Remote Support',
    agreement_name  = 'Audcomp Managed Services - Remote Support',
    contact_name    = 'Karen Cerello',
    monthly_amount  = 315.00,
    billing_cycle   = 'Monthly',
    contract_start  = '2025-12-01',
    contract_end    = '2027-11-30',
    updated_at      = NOW()
WHERE company_name ILIKE '%Cerello%';

-- Keypoint Carriers — normalize name, update dates
UPDATE public.ams_clients SET
    company_name    = 'Keypoint Carriers',
    agreement_type  = 'AMS - Remote w/Monthly Maintenance',
    agreement_name  = 'Audcomp Managed Services - Unlimited Remote',
    contact_name    = 'Ted Tar',
    monthly_amount  = 1335.00,
    billing_cycle   = 'Monthly',
    contract_start  = '2024-12-01',
    contract_end    = '2027-11-30',
    updated_at      = NOW()
WHERE company_name ILIKE '%Keypoint%';

-- Lac-Mac Limited — updated contract dates (renewed March 2026)
UPDATE public.ams_clients SET
    agreement_type  = 'AMS - Remote w/Monthly Maintenance',
    agreement_name  = 'Audcomp Managed Services - Unlimited Remote Support',
    contact_name    = 'Jeff White',
    monthly_amount  = 3434.00,
    billing_cycle   = 'Monthly',
    contract_start  = '2026-03-01',
    contract_end    = '2028-03-31',
    updated_at      = NOW()
WHERE company_name ILIKE '%Lac-Mac%';

-- Load Covering Solutions — normalize name, updated dates
UPDATE public.ams_clients SET
    company_name    = 'Load Covering Solutions',
    agreement_type  = 'AMS - Remote w/Monthly Maintenance',
    agreement_name  = 'Audcomp Managed Services - Unlimited Remote',
    contact_name    = 'Linda Petelka',
    monthly_amount  = 55.53,
    billing_cycle   = 'Monthly',
    contract_start  = '2020-11-01',
    contract_end    = '2027-10-31',
    updated_at      = NOW()
WHERE company_name ILIKE '%Load Covering%';

-- MCFN - Administration (was "Mississaugas of the Credit First Nation")
UPDATE public.ams_clients SET
    company_name    = 'MCFN - Administration',
    agreement_type  = 'AMS - Remote/Onsite Support',
    agreement_name  = 'Audcomp Managed Services - Gold',
    contact_name    = 'Marlene Morton',
    monthly_amount  = 18275.00,
    billing_cycle   = 'Monthly',
    contract_start  = '2024-11-01',
    contract_end    = '2027-10-31',
    updated_at      = NOW()
WHERE company_name ILIKE '%Credit First Nation%' OR company_name = 'MCFN - Administration';

-- Nor-Cam Management Inc. — amount updated to $2,659 + contact corrected
UPDATE public.ams_clients SET
    agreement_type  = 'AMS - Remote w/Monthly Maintenance',
    agreement_name  = 'Audcomp Managed Services w/Monthly Maintenance',
    contact_name    = 'Sherry Ferreira',
    monthly_amount  = 2659.00,
    billing_cycle   = 'Monthly',
    contract_start  = '2024-04-01',
    contract_end    = '2027-03-31',
    updated_at      = NOW()
WHERE company_name ILIKE '%Nor-Cam%';

-- Pro-Flange Limited — updated from $0 to $1,355/mo
UPDATE public.ams_clients SET
    agreement_type  = 'AMS - Remote Support',
    agreement_name  = 'Audcomp Managed Services - Silver',
    contact_name    = 'Janak Handa',
    monthly_amount  = 1355.00,
    billing_cycle   = 'Monthly',
    contract_start  = '2024-11-01',
    contract_end    = '2027-10-31',
    updated_at      = NOW()
WHERE company_name ILIKE '%Pro-Flange%';

-- Six Nations Natural Gas — normalize name
UPDATE public.ams_clients SET
    company_name    = 'Six Nations Natural Gas',
    agreement_type  = 'AMS - Remote Support',
    agreement_name  = 'Audcomp Managed Services - Remote Support - Silver',
    contact_name    = 'Tracy Skye',
    monthly_amount  = 1295.00,
    billing_cycle   = 'Monthly',
    contract_start  = '2024-12-01',
    contract_end    = '2027-11-30',
    updated_at      = NOW()
WHERE company_name ILIKE '%Six Nations Natural%';

-- Six Nations Police — normalize name, update dates
UPDATE public.ams_clients SET
    company_name    = 'Six Nations Police',
    agreement_type  = 'AMS - Remote Support',
    agreement_name  = 'Audcomp Managed Services - Unlimited Remote Support',
    contact_name    = 'Dale Davis',
    monthly_amount  = 7050.00,  -- Annual $84,600 ÷ 12
    billing_cycle   = 'Annual',
    contract_start  = '2023-03-31',
    contract_end    = '2026-03-31',
    updated_at      = NOW()
WHERE company_name ILIKE '%Six Nations Police%';

-- SteriMax Inc. — combined Unlimited Remote ($13,270) + Application Support ($5,166.66)
UPDATE public.ams_clients SET
    company_name    = 'SteriMax Inc.',
    agreement_type  = 'AMS - Remote/Onsite Support',
    agreement_name  = 'Audcomp Managed Services - Unlimited Remote Support',
    contact_name    = 'John Miniaci',
    monthly_amount  = 18436.66,  -- $13,270 + $5,166.66
    billing_cycle   = 'Monthly',
    contract_start  = '2024-04-01',
    contract_end    = '2027-03-31',
    updated_at      = NOW()
WHERE company_name ILIKE '%SteriMax%' AND company_name NOT ILIKE '%StreamLine%';

-- Vision Truck Group — updated to Platinum $10,730/mo, normalize name
UPDATE public.ams_clients SET
    company_name    = 'Vision Truck Group',
    agreement_type  = 'AMS - Remote/Onsite Support',
    agreement_name  = 'Audcomp Managed Services - Platinum Unlimited Remote & Onsite',
    contact_name    = 'John Slotegraaf',
    monthly_amount  = 10730.00,
    billing_cycle   = 'Monthly',
    contract_start  = '2024-02-01',
    contract_end    = '2027-01-31',
    updated_at      = NOW()
WHERE company_name ILIKE '%Vision Truck%';


-- ============================================================
-- SECTION 2: INSERT NEW CLIENTS
-- Only inserts if company does not already exist
-- ============================================================

-- Bateman MacKay Chartered Accountants ($3,090/mo, Silver Support)
INSERT INTO public.ams_clients (company_name, agreement_type, agreement_name, contact_name, monthly_amount, billing_cycle, contract_start, contract_end, users_contracted, price_per_user, status)
SELECT 'Bateman MacKay Chartered Accountants', 'AMS - Remote Support', 'Audcomp Managed Services - Silver Support', 'Lindel McLean', 3090.00, 'Monthly', '2025-07-01', '2028-06-30', 0, 0, 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.ams_clients WHERE company_name ILIKE '%Bateman MacKay%');

-- boostCX ($2,530/mo, Platinum Support)
INSERT INTO public.ams_clients (company_name, agreement_type, agreement_name, contact_name, monthly_amount, billing_cycle, contract_start, contract_end, users_contracted, price_per_user, status)
SELECT 'boostCX', 'AMS - Remote Support', 'Audcomp Managed Services - Platinum Support', 'Keith Murray', 2530.00, 'Monthly', '2025-07-01', '2028-06-30', 0, 0, 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.ams_clients WHERE company_name ILIKE '%boostCX%');

-- Crossroads Refrigeration ($1,130/mo, Silver Support)
INSERT INTO public.ams_clients (company_name, agreement_type, agreement_name, contact_name, monthly_amount, billing_cycle, contract_start, contract_end, users_contracted, price_per_user, status)
SELECT 'Crossroads Refrigeration', 'AMS - Remote Support', 'Audcomp Managed Services - Silver Support', 'April Burroughs', 1130.00, 'Monthly', '2025-07-01', '2028-06-30', 0, 0, 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.ams_clients WHERE company_name ILIKE '%Crossroads Refrigeration%');

-- Hanscomb Limited ($5,500/mo, Silver)
INSERT INTO public.ams_clients (company_name, agreement_type, agreement_name, contact_name, monthly_amount, billing_cycle, contract_start, contract_end, users_contracted, price_per_user, status)
SELECT 'Hanscomb Limited', 'AMS - Remote Support', 'Audcomp Managed Services - Silver', 'Craig Bye', 5500.00, 'Monthly', '2026-02-01', '2029-02-28', 0, 0, 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.ams_clients WHERE company_name ILIKE '%Hanscomb%');

-- Mandeville Operations Management Inc. ($425/mo, Silver)
INSERT INTO public.ams_clients (company_name, agreement_type, agreement_name, contact_name, monthly_amount, billing_cycle, contract_start, contract_end, users_contracted, price_per_user, status)
SELECT 'Mandeville Operations Management Inc.', 'AMS - Remote Support', 'Audcomp Managed Services - Silver', 'Nancy Spina', 425.00, 'Monthly', '2025-03-01', '2028-02-29', 0, 0, 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.ams_clients WHERE company_name ILIKE '%Mandeville Operations%');

-- Prusky Garcia - Mandeville PC ($170/mo, Silver)
INSERT INTO public.ams_clients (company_name, agreement_type, agreement_name, contact_name, monthly_amount, billing_cycle, contract_start, contract_end, users_contracted, price_per_user, status)
SELECT 'Prusky Garcia - Mandeville PC', 'AMS - Remote Support', 'Audcomp Managed Services - Remote Support - Silver', 'Martin L. Garcia', 170.00, 'Monthly', '2025-03-01', '2028-02-29', 0, 0, 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.ams_clients WHERE company_name ILIKE '%Prusky Garcia%');

-- TEG Wealth Management - Mandeville PC ($170/mo, Silver)
INSERT INTO public.ams_clients (company_name, agreement_type, agreement_name, contact_name, monthly_amount, billing_cycle, contract_start, contract_end, users_contracted, price_per_user, status)
SELECT 'TEG Wealth Management - Mandeville PC', 'AMS - Remote Support', 'Audcomp Managed Services - Remote Support - Silver', 'David Trudeau-Elliott', 170.00, 'Monthly', '2025-04-01', '2028-03-31', 0, 0, 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.ams_clients WHERE company_name ILIKE '%TEG Wealth%');

-- Urban & Environmental Management Inc. ($1,541/mo, Silver)
INSERT INTO public.ams_clients (company_name, agreement_type, agreement_name, contact_name, monthly_amount, billing_cycle, contract_start, contract_end, users_contracted, price_per_user, status)
SELECT 'Urban & Environmental Management Inc.', 'AMS - Remote w/Monthly Maintenance', 'Audcomp Managed Services - Silver', 'Eric D''Uva', 1541.00, 'Monthly', '2025-11-01', '2028-10-31', 0, 0, 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.ams_clients WHERE company_name ILIKE '%Urban & Environmental%');

-- Wealth Preservation Consulting Inc. ($255/mo, Silver)
INSERT INTO public.ams_clients (company_name, agreement_type, agreement_name, contact_name, monthly_amount, billing_cycle, contract_start, contract_end, users_contracted, price_per_user, status)
SELECT 'Wealth Preservation Consulting Inc. - Mandeville P', 'AMS - Remote Support', 'Audcomp Managed Services - Remote Support - Silver', 'Kaylin Fitzsimons', 255.00, 'Monthly', '2025-03-01', '2028-02-29', 0, 0, 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.ams_clients WHERE company_name ILIKE '%Wealth Preservation%');

-- Weekes Wealth - Mandeville PC ($595/mo, Silver)
INSERT INTO public.ams_clients (company_name, agreement_type, agreement_name, contact_name, monthly_amount, billing_cycle, contract_start, contract_end, users_contracted, price_per_user, status)
SELECT 'Weekes Wealth - Mandeville PC', 'AMS - Remote Support', 'Audcomp Managed Services - Remote Support - Silver', 'Victoria Weekes', 595.00, 'Monthly', '2025-04-01', '2028-03-31', 0, 0, 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.ams_clients WHERE company_name ILIKE '%Weekes Wealth%');

-- ============================================================
-- SUMMARY
-- Updated: Black Creek CHC, Flux Mechanical, Ford Performance Centre,
--          Hamilton Wentworth Teachers' Local, Hasty Market Corp,
--          John G. Hofland Ltd, Karen Cerello CPA, Keypoint Carriers,
--          Lac-Mac Limited, Load Covering Solutions, MCFN - Administration,
--          Nor-Cam Management Inc., Pro-Flange Limited,
--          Six Nations Natural Gas, Six Nations Police,
--          SteriMax Inc., Vision Truck Group
-- Inserted: Bateman MacKay, boostCX, Crossroads Refrigeration,
--           Hanscomb Limited, Mandeville Operations Management,
--           Prusky Garcia, TEG Wealth Management,
--           Urban & Environmental Management,
--           Wealth Preservation Consulting, Weekes Wealth
-- Skipped:  All Handling Fee-only and DAAS-only companies
-- ============================================================
