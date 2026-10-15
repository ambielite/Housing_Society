const choices = {
    role: ["ADMIN", "MODERATOR", "MEMBER"],
    visibility: ["PUBLIC", "PRIVATE"],
    status: ["ACTIVE", "INACTIVE"],
    postStatus: ["PENDING", "PUBLISHED", "HIDDEN"],
    classifiedCategory: ["FOR_SALE", "FOR_RENT", "WANTED", "SERVICES", "FREE"],
    eventCategory: ["SOCIAL", "SPORTS", "CULTURAL", "EDUCATIONAL", "FESTIVAL", "MEETING", "WORKSHOP", "OTHER"],
    meetingType: ["GENERAL", "COMMITTEE", "BOARD", "AGM", "SGM", "EMERGENCY", "OTHER"],
    governanceType: ["AGM", "SGM"],
    attendanceStatus: ["PRESENT", "ABSENT", "LATE", "EXCUSED"],
    priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    ruleType: ["QUORUM", "ELIGIBILITY", "VOTING", "NOTICE", "TERM", "OTHER"],
    votingType: ["RESOLUTION", "ELECTION", "POLL", "AGM", "SGM", "OTHER"],
    ballotType: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "YES_NO", "ELECTION"],
    secrecy: ["SECRET", "OPEN"]
};

const labels = {
    societyId: "Society", sellerId: "Seller", residentId: "Resident", userId: "Resident",
    forumId: "Forum", meetingId: "Meeting", agendaId: "Agenda item", assignedTo: "Assigned to",
    governanceType: "Meeting type", meetingType: "Meeting type", ruleName: "Rule name", ruleCode: "Rule code",
    attendanceStatus: "Attendance status", agendaOrder: "Agenda order", isFree: "Free event",
    isNegotiable: "Price negotiable", effectiveFrom: "Effective from", effectiveTo: "Effective to",
    startAt: "Starts at", endAt: "Ends at", ticketPrice: "Ticket price", totalTickets: "Tickets",
    guestCount: "Guests", quorumRequired: "Required quorum", financialYear: "Financial year",
    isActive: "Active", votingType: "Voting type", ballotType: "Ballot type",
    secrecy: "Ballot secrecy", startAt: "Voting opens at", endAt: "Voting closes at",
    governanceMeetingId: "AGM / SGM record"
};

const titleCase = (value) => String(value).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const societyName = (item) => item.name || item.societyName || `Society ${item.id}`;
const residentName = (item) => item.displayName || [item.firstName, item.middleName, item.lastName].filter(Boolean).join(" ") || item.name || `Resident ${item.id}`;
const itemId = (item) => item?.id ?? item?.uuid ?? item?._id;

function optionsFor(field, resource, options) {
    if (field === "societyId") return options.societies || [];
    if (["sellerId", "residentId", "userId", "assignedTo", "preparedBy", "chairmanId", "secretaryId"].includes(field)) return options.residents || [];
    if (field === "forumId") return options.forums || [];
    if (field === "meetingId") return options.meetings || [];
    if (field === "governanceMeetingId") return options.governanceMeetings || [];
    if (field === "agendaId") return options.agendas || [];
    if (field === "eventId") return options.events || [];
    if (field === "role") return choices.role;
    if (field === "visibility") return choices.visibility;
    if (field === "status" && ["groups", "forums"].includes(resource)) return choices.status;
    if (field === "status" && resource === "posts") return choices.postStatus;
    if (field === "category" && resource === "classifieds") return choices.classifiedCategory;
    if (field === "category" && resource === "events") return choices.eventCategory;
    if (field === "meetingType") return choices.meetingType;
    if (field === "governanceType") return choices.governanceType;
    if (field === "attendanceStatus") return choices.attendanceStatus;
    if (field === "priority") return choices.priority;
    if (field === "ruleType") return choices.ruleType;
    if (["votingType", "ballotType", "secrecy"].includes(field)) return choices[field];
    if (["isFree", "isNegotiable", "isActive", "discussionRequired", "decisionRequired"].includes(field)) return ["true", "false"];
    return null;
}

function optionValue(field, item) {
    if (typeof item === "string") return item;
    if (field === "userId" || field === "sellerId" || field === "residentId" || field === "assignedTo" || field === "preparedBy" || field === "chairmanId" || field === "secretaryId") return item.userId || itemId(item);
    return itemId(item);
}

function optionLabel(field, item) {
    if (typeof item === "string") return titleCase(item);
    if (field === "societyId") return societyName(item);
    if (["userId", "sellerId", "residentId", "assignedTo", "preparedBy", "chairmanId", "secretaryId"].includes(field)) return `${residentName(item)}${item.unit?.unitNumber ? ` · ${item.unit.unitNumber}` : ""}`;
    return item.title || item.name || item.subject || item.ruleName || item.meetingNumber || `Record ${itemId(item)}`;
}

export default function CommunityRecordForm({ resource, fields, value = {}, options = {}, onChange, onSocietyChange }) {
    const inputType = (field) => field === "description" || field === "content" || field === "summary" || field === "discussionSummary" || field === "configuration" ? "textarea" : /At$/.test(field) ? "datetime-local" : /Date$/.test(field) ? "date" : /price|capacity|quorum|order|tickets|guestCount|noticePeriod/i.test(field) ? "number" : field === "contactEmail" ? "email" : field === "contactPhone" ? "tel" : "text";
    const setValue = (field, nextValue) => onChange((current) => ({ ...current, [field]: nextValue }));
    return <div className="security-form-grid community-form-grid">
        {fields.map((field) => {
            const label = labels[field] || titleCase(field);
            const selectOptions = optionsFor(field, resource, options);
            const isOptional = ["capacity", "ticketPrice", "contactPhone", "contactEmail", "agendaId", "effectiveFrom", "effectiveTo", "discussionSummary", "venue", "meetingLink", "noticeDate", "noticePeriodDays", "financialYear", "quorumRequired", "chairmanId", "secretaryId", "isNegotiable", "isFree", "isActive", "governanceMeetingId"].includes(field)
                || (field === "description" && !["classifieds", "events"].includes(resource))
                || (field === "endAt" && resource !== "events")
                || (field === "category" && !["classifieds", "events"].includes(resource));
            if (selectOptions) {
                const list = selectOptions;
                const emptyLabel = field === "societyId" ? "Select society" : ["sellerId", "assignedTo", "preparedBy"].includes(field) ? `Select ${label.toLowerCase()}` : `Select ${label.toLowerCase()}`;
                return <label key={field}>{label}<select value={value[field] ?? ""} required={!isOptional} disabled={!list.length} onChange={(event) => { setValue(field, event.target.value); if (field === "societyId") onSocietyChange?.(event.target.value); }}>
                    <option value="">{list.length ? emptyLabel : `No ${label.toLowerCase()} options available`}</option>
                    {list.map((item) => <option key={typeof item === "string" ? item : itemId(item)} value={optionValue(field, item)}>{optionLabel(field, item)}</option>)}
                </select></label>;
            }
            const type = inputType(field);
            return <label key={field}>{label}{type === "textarea" ? <textarea rows={field === "configuration" ? 4 : 3} required={!isOptional} value={value[field] ?? (field === "configuration" ? "{}" : "")} onChange={(event) => setValue(field, event.target.value)} placeholder={field === "configuration" ? '{"quorumPercentage": 50}' : ""}/> : <input type={type} min={type === "number" ? 0 : undefined} step={field === "price" || field === "ticketPrice" ? "0.01" : undefined} required={!isOptional} value={value[field] ?? ""} onChange={(event) => setValue(field, event.target.value)}/>}</label>;
        })}
    </div>;
}
