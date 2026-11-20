const {
    normalizeOwnerUnitDates,
    validateCreateOwnerUnit,
    validateUpdateOwnerUnit
} = require("../src/modules/residents/owner-unit/ownerUnit.validation");

const validCreate = {
    societyId: "00000000-0000-4000-8000-000000000001",
    ownerId: "00000000-0000-4000-8000-000000000002",
    unitId: "00000000-0000-4000-8000-000000000003",
    ownershipType: "PRIMARY_OWNER",
    ownershipPercentage: 100,
    status: "ACTIVE"
};

describe("owner-unit effective date validation", () => {
    test("normalizes valid dates and blank effectiveTo to null for create", () => {
        const result = normalizeOwnerUnitDates({ effectiveFrom: "16-11-2026", effectiveTo: "" });
        expect(result).toEqual({
            data: { effectiveFrom: "2026-11-16", effectiveTo: null },
            errors: []
        });
        expect(validateCreateOwnerUnit({ ...validCreate, ...result.data })).toEqual([]);
    });

    test("accepts valid ISO dates and null effectiveTo for update", () => {
        const result = normalizeOwnerUnitDates({ effectiveFrom: "2026-11-16", effectiveTo: null });
        expect(result).toEqual({
            data: { effectiveFrom: "2026-11-16", effectiveTo: null },
            errors: []
        });
        expect(validateUpdateOwnerUnit(result.data)).toEqual([]);
    });

    test.each(["Invalid date", "31-02-2026", "2026-13-01", "2026-02-29"])(
        "rejects invalid or impossible effectiveFrom %s",
        (effectiveFrom) => {
            const result = normalizeOwnerUnitDates({ effectiveFrom, effectiveTo: null });
            expect(result.errors).toContain("effectiveFrom must be a valid date");
        }
    );

    test("rejects invalid effectiveTo rather than passing it through", () => {
        const result = normalizeOwnerUnitDates({ effectiveTo: "Invalid date" });
        expect(result.errors).toContain("effectiveTo must be a valid date");
    });
});
