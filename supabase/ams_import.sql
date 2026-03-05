-- ============================================
-- AMS CLIENT PORTAL - SCHEMA UPDATE + DATA IMPORT
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add new columns to ams_clients
ALTER TABLE public.ams_clients 
  ADD COLUMN IF NOT EXISTS agreement_type TEXT,
  ADD COLUMN IF NOT EXISTS agreement_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'Monthly',
  ADD COLUMN IF NOT EXISTS contract_start DATE,
  ADD COLUMN IF NOT EXISTS contract_end DATE;

-- 2. Insert all 34 AMS clients
INSERT INTO public.ams_clients 
  (company_name, agreement_type, agreement_name, contact_name, contact_email, monthly_amount, billing_cycle, contract_start, contract_end, users_contracted, price_per_user, status)
VALUES
  ('ABL Employment', 'AMS - Remote Support', 'Audcomp Managed Services - Silver', 'Jeff Aran', 'jeffa@ablemployment.com', 3230.00, 'Monthly', '2024-10-01', '2027-11-30', 0, 0, 'active'),
  ('Anne M. Beattie Medicine Professional', 'AMS - Remote Support', 'AMS - Anne M. Beattie', 'Anne Beattie', 'dr.anne.beattie@gmail.com', 1139.00, 'Monthly', '2022-03-01', '2025-02-28', 0, 0, 'active'),
  ('Bible League of Canada', 'AMS - Remote Support', 'Audcomp Managed Services - Unlimited Remote', 'Jordan Stuive', 'JStuive@bibleleague.ca', 1249.00, 'Monthly', '2023-05-01', '2026-04-30', 0, 0, 'active'),
  ('Black Creek Community Health Centers', 'AMS - Remote/Onsite Support', 'Audcomp Managed Services - Platinum Support', 'Savitri Outar', 'Savitri.Outar@bcchc.com', 10369.50, 'Monthly', '2024-06-01', '2027-05-31', 0, 0, 'active'),
  ('Cravo Equipment Ltd', 'AMS - Remote w/Monthly Maintenance', 'Audcomp Managed Services (AMS)', 'Paul Vollebregt', 'paulv@cravo.com', 1335.00, 'Monthly', '2023-12-01', '2026-10-31', 0, 0, 'active'),
  ('Custom Injection Molders Corp.', 'AMS - Remote Support', 'Audcomp Managed Services - Unlimited Remote Support', 'Oliver Duerr', 'okduerr@custommolders.com', 1964.00, 'Monthly', '2023-08-01', '2026-07-31', 0, 0, 'active'),
  ('Flux Mechanical', 'AMS - Essentials', 'Audcomp Managed Services - Essentials', 'Nik Hall', 'nhall@fluxmech.com', 599.00, 'Monthly', '2023-05-01', '2026-04-30', 0, 0, 'active'),
  ('Ford Performance Centre', 'AMS - Remote w/Monthly Maintenance', 'AMS - Ford Performance Centre', 'Graham Cocking', 'gcocking@lakeshorearena.ca', 820.00, 'Monthly', '2021-09-01', '2025-08-31', 0, 0, 'active'),
  ('Go Direct Supply Chain Solutions Inc.', 'AMS - Remote Support', 'Audcomp Managed Services', 'John Martin', 'john.martin@godirectsolutions.com', 1600.00, 'Monthly', '2023-12-01', '2026-11-30', 0, 0, 'active'),
  ('Grand Lodge of Canada', 'AMS - Remote w/Monthly Maintenance', 'AMS - Grand Lodge of Canada', 'Lou Domjan', 'grandsecretary@grandlodge.on.ca', 0.00, 'Monthly', '2021-08-01', '2025-04-30', 0, 0, 'active'),
  ('Hamilton Police Association', 'AMS - Essentials', 'Audcomp Managed Services - Essentials', 'Belchior Arruda', 'barruda@hpa.on.ca', 742.70, 'Monthly', '2023-12-01', '2026-12-31', 0, 0, 'active'),
  ('Hamilton Wentworth Elementary Teachers'' Local', 'AMS - Monitoring Only', 'Audcomp Managed Services - Onsite Maintenance', 'Carleigh Hochheimer', 'office@hwetl.ca', 420.00, 'Quarterly', '2022-11-29', '2025-11-30', 0, 0, 'active'),
  ('Hamilton/Burlington SPCA', 'AMS - Remote/Onsite Support', 'AMS - PLATINUM - Remote & Onsite Support', 'Andrea Matecki', 'amatecki@hbspca.com', 5625.00, 'Monthly', '2024-02-01', '2027-01-31', 0, 0, 'active'),
  ('Hasty Market Corp', 'AMS - Essentials', 'AMS-Essentials - Hasty Marketing Corp', 'Mahassen Farah', 'mfarah@hastymarketcorp.com', 0.00, 'Monthly', '2021-09-01', '2025-08-31', 0, 0, 'active'),
  ('Huntsman Building Solutions - Head Office', 'AMS - Remote Support', 'Audcomp Managed Services', 'Clay Dark', 'cdark@huntsmanbuilds.com', 2397.50, 'Monthly', '2022-02-01', '2026-01-31', 0, 0, 'active'),
  ('Ivan Franko Homes', 'AMS - Remote Support', 'AMS - Remote Support (Cloud Servers Only)', 'Tatiana Tonkovich', 'tatiana.tonkovich@ivanfrankohomes.com', 0.00, 'Monthly', '2019-12-01', '2026-01-31', 0, 0, 'active'),
  ('John G. Hofland Ltd', 'AMS - Monitoring Only', 'Audcomp Managed Services - Monitoring', 'Rahim Khan', 'rahimk@hofland.com', 0.00, 'Monthly', '2021-09-01', '2025-08-31', 0, 0, 'active'),
  ('Karen Cerello CPA', 'AMS - Remote Support', 'Audcomp Managed Services', 'Karen Cerello', 'karen@cerellocga.com', 315.00, 'Monthly', '2023-12-01', '2025-11-30', 0, 0, 'active'),
  ('Keypoint Carriers Ltd.', 'AMS - Remote w/Monthly Maintenance', 'Audcomp Managed Services - Unlimited Remote', 'Ted Tar', 'ttar@keypointcarriers.com', 1335.00, 'Monthly', '2024-12-01', '2027-11-30', 0, 0, 'active'),
  ('Lac-Mac Limited', 'AMS - Remote w/Monthly Maintenance', 'Audcomp Managed Services - Unlimited Remote Support', 'Jeff White', 'jeff.white@lac-mac.com', 3434.00, 'Monthly', '2023-02-01', '2026-01-31', 0, 0, 'active'),
  ('LIUNA Local 3000', 'AMS - Remote Support', 'Audcomp Managed Services - Silver', 'Ken Sharpe', 'ksharpe@liuna3000.ca', 2200.00, 'Monthly', '2024-10-01', '2027-09-30', 0, 0, 'active'),
  ('Load Covering Solutions Ltd', 'AMS - Remote Support', 'Audcomp Managed Services - Unlimited Remote - Kentucky', 'Linda Petelka', 'lindap@loadcovering.com', 55.53, 'Monthly', '2022-11-01', '2025-10-31', 0, 0, 'active'),
  ('Mississaugas of the Credit Business Corporation', 'AMS - Essentials', 'Audcomp Managed Services - Essentials', 'Warren Sault', 'wsault@mncbc.ca', 799.00, 'Monthly', '2024-11-01', '2027-10-31', 0, 0, 'active'),
  ('Mississaugas of the Credit First Nation', 'AMS - Remote/Onsite Support', 'Audcomp Managed Services - Gold', 'Ashley Sault', 'ashley@mncfn.ca', 18275.00, 'Monthly', '2024-11-01', '2027-10-31', 0, 0, 'active'),
  ('Nor-Cam Management Inc.', 'AMS - Remote w/Monthly Maintenance', 'Audcomp Managed Services w/Monthly Maintenance', 'Sherry Picklyk', 'info@waterfordgroup.ca', 2499.00, 'Monthly', '2024-04-01', '2027-03-31', 0, 0, 'active'),
  ('Northbridge Consultants', 'AMS - Monitoring Only', 'AMS - Monitoring (Cloud Servers Only)', 'Gerry Fung', 'gerry@northbridgeconsultants.com', 310.00, 'Monthly', '2023-12-01', '2025-11-30', 0, 0, 'active'),
  ('Ogwadeni:deo', 'AMS - Remote w/Monthly Maintenance', 'Audcomp Managed Services - Unlimited Remote', 'Donald Gibson', 'donald.gibson@ogwadenideotco.org', 4210.00, 'Monthly', '2023-10-01', '2026-09-30', 0, 0, 'active'),
  ('Pro-Flange Limited', 'AMS - Remote Support', 'Audcomp Managed Services - Silver', 'Janak Handa', 'janakh@proflange.com', 0.00, 'Monthly', '2024-11-01', '2027-10-31', 0, 0, 'active'),
  ('Six Nations Natural Gas Co.', 'AMS - Remote Support', 'Audcomp Managed Services - Remote Support', 'Tracy Skye', 'tracy@sixnatgas.com', 1295.00, 'Monthly', '2024-12-01', '2027-11-30', 0, 0, 'active'),
  -- Six Nations Police: Annual $84,600 → $7,050/mo equivalent
  ('Six Nations Police Dept.', 'AMS - Remote Support', 'Audcomp Managed Services - Unlimited Remote Support', 'Dale Davis', 'DDavis@SNPolice.ca', 7050.00, 'Annual', '2023-03-31', '2026-03-30', 0, 0, 'active'),
  ('SteriMax Inc', 'AMS - Remote/Onsite Support', 'Audcomp Managed Services - Unlimited Remote Support', 'John Miniaci', 'jminiaci@sterimaxinc.com', 12910.00, 'Monthly', '2024-04-01', '2027-03-31', 0, 0, 'active'),
  ('TechElectric Automation Inc.', 'AMS - Essentials', 'Audcomp Managed Services - Essentials', 'Jay Fitzpatrick', 'jay@techelectricautomation.com', 0.00, 'Monthly', '2021-04-01', '2025-03-31', 0, 0, 'active'),
  ('The Ontario Aggregate Resources Corp.', 'AMS - Remote Support', 'Audcomp Managed Services - Unlimited Remote Support', 'John DeRick', 'JRDeRick@toarc.com', 960.00, 'Monthly', '2024-08-01', '2027-07-31', 0, 0, 'active'),
  ('Vision Truck Group - Cambridge', 'AMS - Remote/Onsite Support', 'Audcomp Managed Services - Unlimited Remote & Onsite', 'John Slotegraaf', 'jslotegraaf@visiontruckgroup.com', 7804.00, 'Monthly', '2024-02-01', '2027-01-31', 0, 0, 'active'),
  ('Zip Signs Ltd.', 'AMS - Remote w/Monthly Maintenance', 'Audcomp Managed Services - Unlimited Remote', 'Isaac Hoogland', 'ihoogland@zipsigns.com', 1702.50, 'Monthly', '2022-02-01', '2026-01-31', 0, 0, 'active');

-- ============================================
-- DONE — 35 clients inserted
-- ============================================
