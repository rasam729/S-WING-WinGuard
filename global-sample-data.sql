-- ============================================
-- Global Sample Data - Issues from Around the World
-- Distributed across USA, Europe, Asia, Africa, South America, Russia
-- ============================================

-- Insert global sample reports with road information
INSERT INTO reports (
    category, severity, description, location, status, 
    road_type, road_name, last_relaying_date, contractor_name,
    ward_name, city, country, amount_sanctioned, amount_spent, estimated_cost,
    created_at
) VALUES

-- ============================================
-- INDIA - Bangalore
-- ============================================
('Pothole', 8, 'Large pothole causing traffic hazard on main road', 
 ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography, 'In Progress',
 'MDR', 'Koramangala Main Road', '2022-03-15', 'Kumar Construction Ltd',
 'Koramangala', 'Bangalore', 'India', 50000, 35000, 50000, NOW() - INTERVAL '15 days'),

('Streetlight', 7, 'Multiple streetlights not working on residential street',
 ST_SetSRID(ST_MakePoint(77.6408, 12.9719), 4326)::geography, 'Report Received',
 'MDR', 'Indiranagar 100 Feet Road', '2021-11-20', 'Sharma Infrastructure',
 'Indiranagar', 'Bangalore', 'India', 30000, 0, 30000, NOW() - INTERVAL '5 days'),

('Pothole', 9, 'Deep pothole near school zone - urgent',
 ST_SetSRID(ST_MakePoint(77.6387, 12.9082), 4326)::geography, 'Report Received',
 'SH', 'Hosur Road', '2020-08-10', NULL,
 'HSR Layout', 'Bangalore', 'India', 0, 0, 75000, NOW() - INTERVAL '2 days'),

-- India - Mumbai
('Pothole', 7, 'Pothole cluster on highway exit',
 ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326)::geography, 'In Progress',
 'NH', 'Western Express Highway', '2021-06-15', 'Sharma Infrastructure',
 'Andheri', 'Mumbai', 'India', 120000, 80000, 120000, NOW() - INTERVAL '20 days'),

('Streetlight', 6, 'Dark spot near railway station',
 ST_SetSRID(ST_MakePoint(72.8479, 19.0596), 4326)::geography, 'Report Received',
 'MDR', 'Linking Road', '2022-01-10', NULL,
 'Bandra', 'Mumbai', 'India', 0, 0, 40000, NOW() - INTERVAL '8 days'),

-- India - Delhi
('Pothole', 8, 'Major road damage after monsoon',
 ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326)::geography, 'Resolved',
 'SH', 'Ring Road', '2019-12-05', 'Patel Roadways',
 'Connaught Place', 'Delhi', 'India', 90000, 90000, 90000, NOW() - INTERVAL '60 days'),

-- ============================================
-- USA - New York
-- ============================================
('Pothole', 9, 'Severe pothole on busy intersection',
 ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography, 'In Progress',
 'NH', 'Broadway', '2021-04-20', 'Smith & Sons Construction',
 'Manhattan', 'New York', 'USA', 15000, 10000, 15000, NOW() - INTERVAL '12 days'),

('Streetlight', 8, 'Entire block without street lighting',
 ST_SetSRID(ST_MakePoint(-73.9442, 40.6782), 4326)::geography, 'Report Received',
 'MDR', 'Atlantic Avenue', '2022-02-15', 'Garcia Infrastructure',
 'Brooklyn', 'New York', 'USA', 0, 0, 25000, NOW() - INTERVAL '7 days'),

('Pothole', 7, 'Multiple potholes on residential street',
 ST_SetSRID(ST_MakePoint(-73.7949, 40.7282), 4326)::geography, 'Report Received',
 'MDR', 'Queens Boulevard', '2021-09-10', NULL,
 'Queens', 'New York', 'USA', 0, 0, 12000, NOW() - INTERVAL '4 days'),

-- USA - Los Angeles
('Pothole', 8, 'Large pothole near freeway entrance',
 ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326)::geography, 'In Progress',
 'NH', 'Hollywood Boulevard', '2020-11-30', 'Garcia Infrastructure',
 'Hollywood', 'Los Angeles', 'USA', 18000, 12000, 18000, NOW() - INTERVAL '18 days'),

('Streetlight', 7, 'Broken streetlights in parking area',
 ST_SetSRID(ST_MakePoint(-118.4912, 34.0195), 4326)::geography, 'Report Received',
 'MDR', 'Venice Beach Boardwalk', '2022-03-01', NULL,
 'Venice', 'Los Angeles', 'USA', 0, 0, 8000, NOW() - INTERVAL '6 days'),

-- USA - Chicago
('Pothole', 9, 'Dangerous pothole on bridge',
 ST_SetSRID(ST_MakePoint(-87.6298, 41.8781), 4326)::geography, 'Report Received',
 'NH', 'Lake Shore Drive', '2021-07-15', 'Johnson Paving Co',
 'Loop', 'Chicago', 'USA', 0, 0, 22000, NOW() - INTERVAL '3 days'),

-- ============================================
-- UK - London
-- ============================================
('Pothole', 8, 'Deep pothole near Parliament',
 ST_SetSRID(ST_MakePoint(-0.1276, 51.5074), 4326)::geography, 'In Progress',
 'NH', 'Westminster Bridge Road', '2021-05-10', 'Wilson Road Services',
 'Westminster', 'London', 'UK', 8000, 5000, 8000, NOW() - INTERVAL '14 days'),

('Streetlight', 7, 'Street lighting failure in residential area',
 ST_SetSRID(ST_MakePoint(-0.1419, 51.5290), 4326)::geography, 'Report Received',
 'MDR', 'Camden High Street', '2022-01-20', 'Thompson Lighting Ltd',
 'Camden', 'London', 'UK', 0, 0, 6000, NOW() - INTERVAL '9 days'),

('Pothole', 6, 'Small pothole cluster',
 ST_SetSRID(ST_MakePoint(-0.1050, 51.5287), 4326)::geography, 'Resolved',
 'MDR', 'Upper Street', '2021-12-01', 'Wilson Road Services',
 'Islington', 'London', 'UK', 5000, 5000, 5000, NOW() - INTERVAL '45 days'),

-- UK - Manchester
('Pothole', 7, 'Road damage from heavy vehicles',
 ST_SetSRID(ST_MakePoint(-2.2426, 53.4808), 4326)::geography, 'In Progress',
 'SH', 'Oxford Road', '2021-08-15', 'Wilson Road Services',
 'City Centre', 'Manchester', 'UK', 7000, 4000, 7000, NOW() - INTERVAL '16 days'),

-- ============================================
-- GERMANY - Berlin
-- ============================================
('Pothole', 8, 'Large pothole on main boulevard',
 ST_SetSRID(ST_MakePoint(13.4050, 52.5200), 4326)::geography, 'In Progress',
 'NH', 'Unter den Linden', '2021-06-20', 'Mueller Straßenbau',
 'Mitte', 'Berlin', 'Germany', 9000, 6000, 9000, NOW() - INTERVAL '11 days'),

('Streetlight', 6, 'Streetlight malfunction in park area',
 ST_SetSRID(ST_MakePoint(13.3889, 52.5170), 4326)::geography, 'Report Received',
 'MDR', 'Kreuzberg Street', '2022-02-10', 'Schmidt Beleuchtung',
 'Kreuzberg', 'Berlin', 'Germany', 0, 0, 5500, NOW() - INTERVAL '10 days'),

-- Germany - Munich
('Pothole', 7, 'Pothole near train station',
 ST_SetSRID(ST_MakePoint(11.5820, 48.1351), 4326)::geography, 'Report Received',
 'SH', 'Maximilianstraße', '2021-10-05', NULL,
 'Altstadt', 'Munich', 'Germany', 0, 0, 8500, NOW() - INTERVAL '5 days'),

-- ============================================
-- FRANCE - Paris
-- ============================================
('Pothole', 9, 'Severe road damage near Eiffel Tower',
 ST_SetSRID(ST_MakePoint(2.3522, 48.8566), 4326)::geography, 'In Progress',
 'NH', 'Avenue des Champs-Élysées', '2020-09-15', 'Dubois Travaux',
 '1er', 'Paris', 'France', 12000, 8000, 12000, NOW() - INTERVAL '13 days'),

('Streetlight', 8, 'Multiple streetlight failures',
 ST_SetSRID(ST_MakePoint(2.3470, 48.8606), 4326)::geography, 'Report Received',
 'MDR', 'Rue de Rivoli', '2022-01-25', NULL,
 '2e', 'Paris', 'France', 0, 0, 7000, NOW() - INTERVAL '8 days'),

-- ============================================
-- SPAIN - Madrid
-- ============================================
('Pothole', 7, 'Pothole on main avenue',
 ST_SetSRID(ST_MakePoint(-3.7038, 40.4168), 4326)::geography, 'Report Received',
 'SH', 'Gran Vía', '2021-11-10', NULL,
 'Centro', 'Madrid', 'Spain', 0, 0, 6500, NOW() - INTERVAL '6 days'),

-- ============================================
-- ITALY - Rome
-- ============================================
('Pothole', 8, 'Historic road damage',
 ST_SetSRID(ST_MakePoint(12.4964, 41.9028), 4326)::geography, 'In Progress',
 'NH', 'Via del Corso', '2021-07-20', NULL,
 'Centro Storico', 'Rome', 'Italy', 8000, 5000, 8000, NOW() - INTERVAL '17 days'),

-- ============================================
-- JAPAN - Tokyo
-- ============================================
('Pothole', 6, 'Small pothole near shopping district',
 ST_SetSRID(ST_MakePoint(139.6917, 35.6895), 4326)::geography, 'Resolved',
 'MDR', 'Shinjuku Dori', '2022-01-05', 'Yamamoto Construction',
 'Shinjuku', 'Tokyo', 'Japan', 10000, 10000, 10000, NOW() - INTERVAL '50 days'),

('Streetlight', 5, 'Streetlight maintenance needed',
 ST_SetSRID(ST_MakePoint(139.7024, 35.6586), 4326)::geography, 'Report Received',
 'MDR', 'Shibuya Crossing', '2022-02-20', NULL,
 'Shibuya', 'Tokyo', 'Japan', 0, 0, 8000, NOW() - INTERVAL '7 days'),

-- ============================================
-- CHINA - Beijing
-- ============================================
('Pothole', 7, 'Road damage from construction',
 ST_SetSRID(ST_MakePoint(116.4074, 39.9042), 4326)::geography, 'In Progress',
 'NH', 'Chang\'an Avenue', '2021-09-25', 'Wei Infrastructure',
 'Chaoyang', 'Beijing', 'China', 15000, 10000, 15000, NOW() - INTERVAL '19 days'),

('Pothole', 8, 'Multiple potholes on ring road',
 ST_SetSRID(ST_MakePoint(116.2979, 39.9075), 4326)::geography, 'Report Received',
 'SH', 'West 3rd Ring Road', '2021-12-10', NULL,
 'Haidian', 'Beijing', 'China', 0, 0, 12000, NOW() - INTERVAL '4 days'),

-- ============================================
-- SOUTH KOREA - Seoul
-- ============================================
('Pothole', 7, 'Pothole near business district',
 ST_SetSRID(ST_MakePoint(126.9780, 37.5665), 4326)::geography, 'Report Received',
 'NH', 'Gangnam-daero', '2022-01-15', NULL,
 'Gangnam', 'Seoul', 'South Korea', 0, 0, 9000, NOW() - INTERVAL '5 days'),

-- ============================================
-- BRAZIL - São Paulo
-- ============================================
('Pothole', 9, 'Dangerous pothole on major avenue',
 ST_SetSRID(ST_MakePoint(-46.6333, -23.5505), 4326)::geography, 'In Progress',
 'NH', 'Avenida Paulista', '2021-10-15', 'Silva Construções',
 'Centro', 'São Paulo', 'Brazil', 8000, 5000, 8000, NOW() - INTERVAL '15 days'),

('Streetlight', 8, 'Street lighting failure in commercial area',
 ST_SetSRID(ST_MakePoint(-46.6911, -23.5629), 4326)::geography, 'Report Received',
 'MDR', 'Rua Augusta', '2022-02-05', NULL,
 'Pinheiros', 'São Paulo', 'Brazil', 0, 0, 5000, NOW() - INTERVAL '9 days'),

-- ============================================
-- ARGENTINA - Buenos Aires
-- ============================================
('Pothole', 7, 'Pothole on main street',
 ST_SetSRID(ST_MakePoint(-58.3816, -34.6037), 4326)::geography, 'Report Received',
 'SH', 'Avenida 9 de Julio', '2021-11-20', NULL,
 'Centro', 'Buenos Aires', 'Argentina', 0, 0, 6000, NOW() - INTERVAL '6 days'),

-- ============================================
-- SOUTH AFRICA - Johannesburg
-- ============================================
('Pothole', 8, 'Large pothole in business district',
 ST_SetSRID(ST_MakePoint(28.0473, -26.2041), 4326)::geography, 'In Progress',
 'NH', 'Sandton Drive', '2021-08-30', 'Mbeki Roads',
 'Sandton', 'Johannesburg', 'South Africa', 7000, 4000, 7000, NOW() - INTERVAL '14 days'),

('Streetlight', 7, 'Streetlight outage in residential area',
 ST_SetSRID(ST_MakePoint(28.0436, -26.1367), 4326)::geography, 'Report Received',
 'MDR', 'Oxford Road', '2022-01-30', NULL,
 'Rosebank', 'Johannesburg', 'South Africa', 0, 0, 4500, NOW() - INTERVAL '8 days'),

-- ============================================
-- EGYPT - Cairo
-- ============================================
('Pothole', 7, 'Road damage near pyramids area',
 ST_SetSRID(ST_MakePoint(31.2357, 30.0444), 4326)::geography, 'Report Received',
 'SH', 'Al Haram Street', '2021-12-15', NULL,
 'Giza', 'Cairo', 'Egypt', 0, 0, 5500, NOW() - INTERVAL '7 days'),

-- ============================================
-- AUSTRALIA - Sydney
-- ============================================
('Pothole', 8, 'Pothole near harbor bridge',
 ST_SetSRID(ST_MakePoint(151.2093, -33.8688), 4326)::geography, 'In Progress',
 'NH', 'George Street', '2021-09-10', 'Anderson Infrastructure',
 'CBD', 'Sydney', 'Australia', 12000, 8000, 12000, NOW() - INTERVAL '16 days'),

('Streetlight', 6, 'Streetlight maintenance required',
 ST_SetSRID(ST_MakePoint(151.2767, -33.8830), 4326)::geography, 'Report Received',
 'MDR', 'Oxford Street', '2022-02-15', NULL,
 'Surry Hills', 'Sydney', 'Australia', 0, 0, 7000, NOW() - INTERVAL '6 days'),

-- ============================================
-- AUSTRALIA - Melbourne
-- ============================================
('Pothole', 7, 'Pothole on tram route',
 ST_SetSRID(ST_MakePoint(144.9631, -37.8136), 4326)::geography, 'Report Received',
 'SH', 'Swanston Street', '2021-11-25', NULL,
 'CBD', 'Melbourne', 'Australia', 0, 0, 8500, NOW() - INTERVAL '5 days'),

-- ============================================
-- RUSSIA - Moscow
-- ============================================
('Pothole', 9, 'Severe road damage from winter',
 ST_SetSRID(ST_MakePoint(37.6173, 55.7558), 4326)::geography, 'In Progress',
 'NH', 'Tverskaya Street', '2021-04-10', 'Ivanov Construction',
 'Central', 'Moscow', 'Russia', 10000, 6000, 10000, NOW() - INTERVAL '20 days'),

('Pothole', 8, 'Multiple potholes on ring road',
 ST_SetSRID(ST_MakePoint(37.5356, 55.7522), 4326)::geography, 'Report Received',
 'SH', 'Garden Ring', '2022-01-20', NULL,
 'Western', 'Moscow', 'Russia', 0, 0, 9000, NOW() - INTERVAL '8 days'),

-- ============================================
-- RUSSIA - St. Petersburg
-- ============================================
('Pothole', 7, 'Pothole near historic center',
 ST_SetSRID(ST_MakePoint(30.3141, 59.9343), 4326)::geography, 'Report Received',
 'MDR', 'Nevsky Prospekt', '2021-12-05', NULL,
 'Central', 'St. Petersburg', 'Russia', 0, 0, 7500, NOW() - INTERVAL '6 days'),

-- ============================================
-- UAE - Dubai
-- ============================================
('Pothole', 6, 'Minor road damage',
 ST_SetSRID(ST_MakePoint(55.2708, 25.2048), 4326)::geography, 'Resolved',
 'NH', 'Sheikh Zayed Road', '2022-01-10', 'Al-Rashid Infrastructure',
 'Deira', 'Dubai', 'UAE', 15000, 15000, 15000, NOW() - INTERVAL '55 days'),

('Streetlight', 5, 'Streetlight upgrade needed',
 ST_SetSRID(ST_MakePoint(55.1713, 25.0657), 4326)::geography, 'Report Received',
 'MDR', 'Jumeirah Beach Road', '2022-02-20', NULL,
 'Jumeirah', 'Dubai', 'UAE', 0, 0, 12000, NOW() - INTERVAL '5 days'),

-- ============================================
-- SINGAPORE
-- ============================================
('Pothole', 5, 'Small pothole near shopping area',
 ST_SetSRID(ST_MakePoint(103.8198, 1.3521), 4326)::geography, 'Resolved',
 'NH', 'Orchard Road', '2022-01-15', NULL,
 'Orchard', 'Singapore', 'Singapore', 8000, 8000, 8000, NOW() - INTERVAL '48 days'),

-- ============================================
-- CANADA - Toronto
-- ============================================
('Pothole', 8, 'Winter damage pothole',
 ST_SetSRID(ST_MakePoint(-79.3832, 43.6532), 4326)::geography, 'In Progress',
 'NH', 'Yonge Street', '2021-05-15', NULL,
 'Downtown', 'Toronto', 'Canada', 10000, 6000, 10000, NOW() - INTERVAL '18 days'),

('Streetlight', 7, 'Streetlight outage',
 ST_SetSRID(ST_MakePoint(-79.4163, 43.6426), 4326)::geography, 'Report Received',
 'MDR', 'Queen Street West', '2022-02-10', NULL,
 'West End', 'Toronto', 'Canada', 0, 0, 6000, NOW() - INTERVAL '7 days'),

-- ============================================
-- MEXICO - Mexico City
-- ============================================
('Pothole', 8, 'Large pothole on main avenue',
 ST_SetSRID(ST_MakePoint(-99.1332, 19.4326), 4326)::geography, 'Report Received',
 'NH', 'Paseo de la Reforma', '2021-10-20', NULL,
 'Cuauhtémoc', 'Mexico City', 'Mexico', 0, 0, 6500, NOW() - INTERVAL '5 days'),

-- ============================================
-- NETHERLANDS - Amsterdam
-- ============================================
('Pothole', 6, 'Pothole near canal',
 ST_SetSRID(ST_MakePoint(4.9041, 52.3676), 4326)::geography, 'Report Received',
 'MDR', 'Damrak', '2022-01-25', NULL,
 'Centrum', 'Amsterdam', 'Netherlands', 0, 0, 5500, NOW() - INTERVAL '6 days'),

-- ============================================
-- SWEDEN - Stockholm
-- ============================================
('Pothole', 7, 'Winter damage on bridge',
 ST_SetSRID(ST_MakePoint(18.0686, 59.3293), 4326)::geography, 'In Progress',
 'SH', 'Drottninggatan', '2021-06-10', NULL,
 'Norrmalm', 'Stockholm', 'Sweden', 7000, 4000, 7000, NOW() - INTERVAL '15 days');

-- Update contractor assignments based on contractor_name
UPDATE reports r
SET contractor_id = c.contractor_id
FROM contractors c
WHERE r.contractor_name = c.contractor_name;

COMMENT ON TABLE reports IS 'Global road safety reports with comprehensive road and contractor information';
