-- Reference data only: the rows the schema itself depends on.
-- No fighters, events, fights, or articles. Those are Phase 2+ and are exactly
-- what the homepage empty states are waiting for.
-- Weight limits are integers in grams.

INSERT INTO promotions (id, name, slug, website, created_at) VALUES
  ('1b8f2a10-0000-4000-8000-000000000001', 'UFC', 'ufc', 'https://www.ufc.com', 1735689600000),
  ('1b8f2a10-0000-4000-8000-000000000002', 'ONE Championship', 'one-championship', 'https://www.onefc.com', 1735689600000),
  ('1b8f2a10-0000-4000-8000-000000000003', 'PFL', 'pfl', 'https://www.thepfl.com', 1735689600000),
  ('1b8f2a10-0000-4000-8000-000000000004', 'Bellator', 'bellator', 'https://www.bellator.com', 1735689600000);

INSERT INTO divisions (id, promotion_id, name, gender, weight_limit, slug) VALUES
  -- UFC: 8 men's
  ('2c9f3b20-0000-4000-8000-000000000001', '1b8f2a10-0000-4000-8000-000000000001', 'Flyweight', 'MALE', 56700, 'flyweight'),
  ('2c9f3b20-0000-4000-8000-000000000002', '1b8f2a10-0000-4000-8000-000000000001', 'Bantamweight', 'MALE', 61200, 'bantamweight'),
  ('2c9f3b20-0000-4000-8000-000000000003', '1b8f2a10-0000-4000-8000-000000000001', 'Featherweight', 'MALE', 65800, 'featherweight'),
  ('2c9f3b20-0000-4000-8000-000000000004', '1b8f2a10-0000-4000-8000-000000000001', 'Lightweight', 'MALE', 70300, 'lightweight'),
  ('2c9f3b20-0000-4000-8000-000000000005', '1b8f2a10-0000-4000-8000-000000000001', 'Welterweight', 'MALE', 77100, 'welterweight'),
  ('2c9f3b20-0000-4000-8000-000000000006', '1b8f2a10-0000-4000-8000-000000000001', 'Middleweight', 'MALE', 84000, 'middleweight'),
  ('2c9f3b20-0000-4000-8000-000000000007', '1b8f2a10-0000-4000-8000-000000000001', 'Light Heavyweight', 'MALE', 93000, 'light-heavyweight'),
  ('2c9f3b20-0000-4000-8000-000000000008', '1b8f2a10-0000-4000-8000-000000000001', 'Heavyweight', 'MALE', 120200, 'heavyweight'),
  -- UFC: 4 women's
  ('2c9f3b20-0000-4000-8000-000000000009', '1b8f2a10-0000-4000-8000-000000000001', 'Women''s Strawweight', 'FEMALE', 47600, 'womens-strawweight'),
  ('2c9f3b20-0000-4000-8000-00000000000a', '1b8f2a10-0000-4000-8000-000000000001', 'Women''s Flyweight', 'FEMALE', 52200, 'womens-flyweight'),
  ('2c9f3b20-0000-4000-8000-00000000000b', '1b8f2a10-0000-4000-8000-000000000001', 'Women''s Bantamweight', 'FEMALE', 56700, 'womens-bantamweight'),
  ('2c9f3b20-0000-4000-8000-00000000000c', '1b8f2a10-0000-4000-8000-000000000001', 'Women''s Featherweight', 'FEMALE', 61200, 'womens-featherweight'),
  -- ONE Championship: 4 men's
  ('3daf4c30-0000-4000-8000-000000000001', '1b8f2a10-0000-4000-8000-000000000002', 'Flyweight', 'MALE', 56700, 'flyweight'),
  ('3daf4c30-0000-4000-8000-000000000002', '1b8f2a10-0000-4000-8000-000000000002', 'Lightweight', 'MALE', 70300, 'lightweight'),
  ('3daf4c30-0000-4000-8000-000000000003', '1b8f2a10-0000-4000-8000-000000000002', 'Welterweight', 'MALE', 77100, 'welterweight'),
  ('3daf4c30-0000-4000-8000-000000000004', '1b8f2a10-0000-4000-8000-000000000002', 'Heavyweight', 'MALE', 120200, 'heavyweight'),
  -- ONE Championship: 4 women's
  ('3daf4c30-0000-4000-8000-000000000005', '1b8f2a10-0000-4000-8000-000000000002', 'Women''s Atomweight', 'FEMALE', 45000, 'womens-atomweight'),
  ('3daf4c30-0000-4000-8000-000000000006', '1b8f2a10-0000-4000-8000-000000000002', 'Women''s Strawweight', 'FEMALE', 47600, 'womens-strawweight'),
  ('3daf4c30-0000-4000-8000-000000000007', '1b8f2a10-0000-4000-8000-000000000002', 'Women''s Flyweight', 'FEMALE', 52200, 'womens-flyweight'),
  ('3daf4c30-0000-4000-8000-000000000008', '1b8f2a10-0000-4000-8000-000000000002', 'Women''s Bantamweight', 'FEMALE', 56700, 'womens-bantamweight'),
  -- PFL: 6 men's
  ('4eb05d40-0000-4000-8000-000000000001', '1b8f2a10-0000-4000-8000-000000000003', 'Featherweight', 'MALE', 65800, 'featherweight'),
  ('4eb05d40-0000-4000-8000-000000000002', '1b8f2a10-0000-4000-8000-000000000003', 'Lightweight', 'MALE', 70300, 'lightweight'),
  ('4eb05d40-0000-4000-8000-000000000003', '1b8f2a10-0000-4000-8000-000000000003', 'Welterweight', 'MALE', 77100, 'welterweight'),
  ('4eb05d40-0000-4000-8000-000000000004', '1b8f2a10-0000-4000-8000-000000000003', 'Middleweight', 'MALE', 84000, 'middleweight'),
  ('4eb05d40-0000-4000-8000-000000000005', '1b8f2a10-0000-4000-8000-000000000003', 'Light Heavyweight', 'MALE', 93000, 'light-heavyweight'),
  ('4eb05d40-0000-4000-8000-000000000006', '1b8f2a10-0000-4000-8000-000000000003', 'Heavyweight', 'MALE', 120200, 'heavyweight'),
  -- Bellator: 6 men's
  ('5fc16e50-0000-4000-8000-000000000001', '1b8f2a10-0000-4000-8000-000000000004', 'Featherweight', 'MALE', 65800, 'featherweight'),
  ('5fc16e50-0000-4000-8000-000000000002', '1b8f2a10-0000-4000-8000-000000000004', 'Lightweight', 'MALE', 70300, 'lightweight'),
  ('5fc16e50-0000-4000-8000-000000000003', '1b8f2a10-0000-4000-8000-000000000004', 'Welterweight', 'MALE', 77100, 'welterweight'),
  ('5fc16e50-0000-4000-8000-000000000004', '1b8f2a10-0000-4000-8000-000000000004', 'Middleweight', 'MALE', 84000, 'middleweight'),
  ('5fc16e50-0000-4000-8000-000000000005', '1b8f2a10-0000-4000-8000-000000000004', 'Light Heavyweight', 'MALE', 93000, 'light-heavyweight'),
  ('5fc16e50-0000-4000-8000-000000000006', '1b8f2a10-0000-4000-8000-000000000004', 'Heavyweight', 'MALE', 120200, 'heavyweight');
