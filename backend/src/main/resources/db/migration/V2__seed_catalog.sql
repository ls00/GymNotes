INSERT INTO exercises (id, name, muscle_group, equipment, description) VALUES
    ('10000000-0000-4000-8000-000000000001', 'Agachamento livre', 'QUADRICEPS', 'BARBELL', 'Agachamento com barra'),
    ('10000000-0000-4000-8000-000000000002', 'Supino reto com barra', 'CHEST', 'BARBELL', 'Supino horizontal com barra'),
    ('10000000-0000-4000-8000-000000000003', 'Remada curvada', 'BACK', 'BARBELL', 'Remada inclinada com barra'),
    ('10000000-0000-4000-8000-000000000004', 'Levantamento terra', 'BACK', 'BARBELL', 'Levantamento terra convencional'),
    ('10000000-0000-4000-8000-000000000005', 'Desenvolvimento com halteres', 'SHOULDERS', 'DUMBBELL', 'Desenvolvimento de ombros com halteres'),
    ('10000000-0000-4000-8000-000000000006', 'Rosca direta', 'BICEPS', 'BARBELL', 'Flexão de cotovelos com barra'),
    ('10000000-0000-4000-8000-000000000007', 'Tríceps na polia', 'TRICEPS', 'CABLE', 'Extensão de cotovelos na polia'),
    ('10000000-0000-4000-8000-000000000008', 'Leg press', 'QUADRICEPS', 'MACHINE', 'Leg press na máquina'),
    ('10000000-0000-4000-8000-000000000009', 'Mesa flexora', 'HAMSTRINGS', 'MACHINE', 'Flexão de joelhos na máquina'),
    ('10000000-0000-4000-8000-000000000010', 'Elevação lateral', 'SHOULDERS', 'DUMBBELL', 'Elevação lateral com halteres'),
    ('10000000-0000-4000-8000-000000000011', 'Prancha', 'CORE_ABS', 'BODYWEIGHT', 'Prancha isométrica'),
    ('10000000-0000-4000-8000-000000000012', 'Corrida na esteira', 'CARDIO', 'CARDIO_MACHINE', 'Corrida em esteira');

INSERT INTO foods (
    id, name, brand, calories_per_100g, protein_per_100g,
    carbs_per_100g, fats_per_100g, is_verified
) VALUES
    ('20000000-0000-4000-8000-000000000001', 'Peito de frango grelhado', NULL, 165, 31, 0, 3.6, FALSE),
    ('20000000-0000-4000-8000-000000000002', 'Arroz branco cozido', NULL, 130, 2.7, 28.2, 0.3, FALSE),
    ('20000000-0000-4000-8000-000000000003', 'Ovo inteiro cozido', NULL, 155, 12.6, 1.1, 10.6, FALSE),
    ('20000000-0000-4000-8000-000000000004', 'Banana', NULL, 89, 1.1, 22.8, 0.3, FALSE),
    ('20000000-0000-4000-8000-000000000005', 'Aveia em flocos', NULL, 389, 16.9, 66.3, 6.9, FALSE),
    ('20000000-0000-4000-8000-000000000006', 'Batata-doce cozida', NULL, 76, 1.4, 17.7, 0.1, FALSE),
    ('20000000-0000-4000-8000-000000000007', 'Feijão carioca cozido', NULL, 76, 4.8, 13.6, 0.5, FALSE),
    ('20000000-0000-4000-8000-000000000008', 'Iogurte natural integral', NULL, 61, 3.5, 4.7, 3.3, FALSE),
    ('20000000-0000-4000-8000-000000000009', 'Tilápia grelhada', NULL, 128, 26.2, 0, 2.7, FALSE),
    ('20000000-0000-4000-8000-000000000010', 'Abacate', NULL, 160, 2, 8.5, 14.7, FALSE);
