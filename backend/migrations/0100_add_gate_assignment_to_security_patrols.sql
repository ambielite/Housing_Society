ALTER TABLE security_patrols
    ADD COLUMN gate_id UUID NULL REFERENCES gates(id) ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX security_patrols_gate_id_idx ON security_patrols(gate_id);
