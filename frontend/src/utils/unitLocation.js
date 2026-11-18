const valueOf = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");

export const unitLocationLabel = (unit, floorsById = new Map(), towersById = new Map()) => {
    const floorId = valueOf(unit?.floorId, unit?.floor_id);
    const floor = valueOf(unit?.floor, floorId ? floorsById.get(String(floorId)) : null);
    const towerId = valueOf(floor?.towerId, floor?.tower_id, unit?.towerId, unit?.tower_id);
    const tower = valueOf(unit?.tower, towerId ? towersById.get(String(towerId)) : null);
    const towerName = valueOf(tower?.name, tower?.towerName, unit?.towerName, unit?.tower_name);
    const floorName = valueOf(floor?.name, floor?.floorName, floor?.floor_name,
        floor?.floorNumber != null ? `Floor ${floor.floorNumber}` : null,
        floor?.floor_number != null ? `Floor ${floor.floor_number}` : null,
        unit?.floorName, unit?.floor_name);
    const unitName = valueOf(unit?.unitNumber, unit?.unit_number, unit?.name, unit?.id) || "Unit";
    return [towerName, floorName, `Unit ${unitName}`].filter(Boolean).join(" / ");
};

export default unitLocationLabel;
