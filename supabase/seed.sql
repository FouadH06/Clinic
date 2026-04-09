-- ============================================================
-- Teissir Dental Inventory — Sample Seed Data
-- Run AFTER 001_init.sql
-- ============================================================

-- Suppliers
insert into suppliers (id, name, phone, email, notes) values
  ('a1000000-0000-0000-0000-000000000001', 'MedDent Supply Co.',    '+961 1 234 567', 'orders@meddent.com',   'Main PPE and consumables supplier'),
  ('a1000000-0000-0000-0000-000000000002', 'DentalPro Lebanon',     '+961 3 987 654', 'info@dentalpro.lb',    'Specialist in restorative materials'),
  ('a1000000-0000-0000-0000-000000000003', 'MedEquip Trading',      '+961 70 111 222','sales@medequip.lb',    'X-ray & equipment supplier');

-- Items
insert into items (name, icon, quantity, min_stock_threshold, unit, category, supplier_id) values
  ('Latex Gloves (S)',        '🧤', 200, 50,  'units',  'PPE',          'a1000000-0000-0000-0000-000000000001'),
  ('Latex Gloves (M)',        '🧤', 180, 50,  'units',  'PPE',          'a1000000-0000-0000-0000-000000000001'),
  ('Latex Gloves (L)',        '🧤', 150, 50,  'units',  'PPE',          'a1000000-0000-0000-0000-000000000001'),
  ('Surgical Masks',          '😷', 100, 30,  'units',  'PPE',          'a1000000-0000-0000-0000-000000000001'),
  ('Anesthetic Cartridges',   '💉', 48,  10,  'units',  'Anesthesia',   'a1000000-0000-0000-0000-000000000002'),
  ('Disposable Syringes',     '💉', 60,  15,  'units',  'Anesthesia',   'a1000000-0000-0000-0000-000000000001'),
  ('Gauze Pads 4x4',          '🩹', 500, 100, 'units',  'Consumables',  'a1000000-0000-0000-0000-000000000001'),
  ('Cotton Rolls',            '🫙', 300, 50,  'units',  'Consumables',  'a1000000-0000-0000-0000-000000000001'),
  ('Composite Resin A2',      '🦷', 8,   3,   'tubes',  'Restorative',  'a1000000-0000-0000-0000-000000000002'),
  ('Composite Resin A3',      '🦷', 6,   3,   'tubes',  'Restorative',  'a1000000-0000-0000-0000-000000000002'),
  ('Bonding Agent',           '🧴', 4,   2,   'bottles','Restorative',  'a1000000-0000-0000-0000-000000000002'),
  ('Dental Etchant Gel',      '🧪', 5,   2,   'tubes',  'Restorative',  'a1000000-0000-0000-0000-000000000002'),
  ('X-ray Film (Periapical)', '🩻', 3,   1,   'boxes',  'Imaging',      'a1000000-0000-0000-0000-000000000003'),
  ('Saliva Ejectors',         '🦷', 100, 20,  'units',  'Consumables',  'a1000000-0000-0000-0000-000000000001'),
  ('Dental Floss',            '🦷', 20,  5,   'rolls',  'Consumables',  'a1000000-0000-0000-0000-000000000001'),
  ('Prophy Paste',            '🧴', 10,  3,   'cups',   'Hygiene',      'a1000000-0000-0000-0000-000000000002'),
  ('Impression Alginate',     '🫙', 3,   2,   'kg bags','Impressions',  'a1000000-0000-0000-0000-000000000002'),
  ('Zinc Oxide Cement',       '🧪', 4,   2,   'units',  'Restorative',  'a1000000-0000-0000-0000-000000000002'),
  ('Face Shields',            '🛡', 15,  5,   'units',  'PPE',          'a1000000-0000-0000-0000-000000000001'),
  ('Biohazard Bags',          '📦', 50,  10,  'units',  'Consumables',  'a1000000-0000-0000-0000-000000000001');

-- Sample usage log
insert into usage_log (item_id, quantity_used, note)
select id, 2, 'Morning patient session'
from items where name = 'Latex Gloves (M)';

insert into usage_log (item_id, quantity_used, note)
select id, 1, 'Cavity filling - patient #12'
from items where name = 'Composite Resin A2';

insert into usage_log (item_id, quantity_used, note)
select id, 4, 'Routine checkups'
from items where name = 'Gauze Pads 4x4';
