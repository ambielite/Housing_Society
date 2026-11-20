DO $$
DECLARE
  delivery_row RECORD;
  resident_id UUID;
  gate_id UUID;
  profile_id UUID;
  created_pass_id UUID;
BEGIN
  FOR delivery_row IN
    SELECT * FROM deliveries
     WHERE visitor_pass_id IS NULL
       AND status IN ('EXPECTED', 'ARRIVED')
     ORDER BY created_at
  LOOP
    SELECT owner_id INTO resident_id
      FROM owner_units
     WHERE society_id = delivery_row.society_id
       AND unit_id = delivery_row.unit_id
       AND status = 'ACTIVE'
       AND effective_from <= CURRENT_DATE
       AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
     ORDER BY effective_from DESC
     LIMIT 1;

    IF resident_id IS NULL THEN
      SELECT o.resident_id INTO resident_id
        FROM occupancies o
       WHERE o.society_id = delivery_row.society_id
         AND o.unit_id = delivery_row.unit_id
         AND COALESCE(o.is_current, true) = true
         AND (o.end_date IS NULL OR o.end_date >= CURRENT_DATE)
       LIMIT 1;
    END IF;

    SELECT id INTO gate_id FROM gates
     WHERE society_id = delivery_row.society_id
     ORDER BY created_at DESC LIMIT 1;

    IF resident_id IS NULL OR gate_id IS NULL THEN
      CONTINUE;
    END IF;

    profile_id := delivery_row.visitor_profile_id;
    IF profile_id IS NULL THEN
      INSERT INTO visitor_profiles (society_id, name, visitor_type, delivery_company)
      VALUES (
        delivery_row.society_id,
        COALESCE(NULLIF(delivery_row.courier_name, ''), 'Delivery courier'),
        'DELIVERY_PERSON',
        COALESCE(NULLIF(delivery_row.courier_name, ''), 'Delivery courier')
      )
      RETURNING id INTO profile_id;
    END IF;

    INSERT INTO visitor_passes
      (visitor_profile_id, gate_id, pass_no, unit_id, resident_id, status, resident_decision)
    VALUES
      (profile_id, gate_id, 'DEL-' || delivery_row.id::text,
       delivery_row.unit_id, resident_id, delivery_row.status, 'PENDING')
    RETURNING id INTO created_pass_id;

    UPDATE deliveries
       SET visitor_profile_id = COALESCE(deliveries.visitor_profile_id, profile_id),
           visitor_pass_id = created_pass_id,
           updated_at = now()
     WHERE id = delivery_row.id;
  END LOOP;
END $$;
