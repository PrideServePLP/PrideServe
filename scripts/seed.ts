/**
 * Populates a Supabase project with mock PLP data for local testing.
 *
 *   npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. The service
 * role key bypasses RLS, so this only ever belongs in a development project —
 * never point it at production.
 *
 * Apply supabase/schema.sql first (copy the whole file into the SQL editor).
 * Re-running this seed is safe: every row uses a fixed id and is upserted.
 */
import { createClient } from "@supabase/supabase-js";
import type {
  Database,
  HonorSociety,
  HourLogStatus,
  OpportunityCategory,
  OpportunityLocation,
  OpportunityStatus,
  RecurrencePattern,
  ServiceScope,
  UserRole,
} from "@/lib/database.types";

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const password = process.env.SEED_PASSWORD ?? "PrideServe!Dev2026";

if (url === "" || serviceRoleKey === "") {
  console.error(
    [
      "Missing Supabase credentials.",
      "",
      "Add these to .env.local (the service role key is under",
      "Project Settings → API → service_role in the Supabase dashboard):",
      "",
      "  NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co",
      "  SUPABASE_SERVICE_ROLE_KEY=<service-role-key>",
      "",
      "Optional: SEED_PASSWORD=<shared password for the test accounts>",
    ].join("\n"),
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Throws with context instead of letting a Supabase error pass silently. */
function must(step: string, result: { error: { message: string } | null }) {
  if (result.error) {
    throw new Error(`${step}: ${result.error.message}`);
  }
}

function at(dayOffset: number, hourUtc: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hourUtc, 0, 0, 0);
  return date.toISOString();
}

// ---------------------------------------------------------------------------
// 1. Users
// ---------------------------------------------------------------------------
type SeedUser = {
  key: string;
  email: string;
  fullName: string;
  role: UserRole;
  isTechManager?: boolean;
  gradeLevel?: string;
  honorSocieties?: HonorSociety[];
  classes?: string[];
};

const SEED_USERS: SeedUser[] = [
  {
    key: "admin",
    email: "admin@pinelakeprep.org",
    fullName: "Jordan Ellis",
    role: "admin",
  },
  {
    // A teacher rather than an admin, so the tech-manager bypass in the route
    // guards gets exercised on its own.
    key: "techManager",
    email: "tech@pinelakeprep.org",
    fullName: "Priya Raman",
    role: "teacher",
    isTechManager: true,
  },
  {
    key: "advisor",
    email: "advisor@pinelakeprep.org",
    fullName: "Morgan Rivera",
    role: "teacher",
  },
  {
    key: "teacher2",
    email: "m.alvarez@pinelakeprep.org",
    fullName: "Mateo Alvarez",
    role: "teacher",
  },
  {
    key: "outsideOrg",
    email: "volunteers@lakesidefoodbank.org",
    fullName: "Lakeside Food Bank",
    role: "outside_org",
  },
  {
    key: "avery",
    email: "avery.chen@pinelakeprep.org",
    fullName: "Avery Chen",
    role: "student",
    gradeLevel: "11th",
    honorSocieties: ["NHS", "Beta Club"],
    classes: ["A", "C", "E"],
  },
  {
    key: "bella",
    email: "bella.ortiz@pinelakeprep.org",
    fullName: "Bella Ortiz",
    role: "student",
    gradeLevel: "12th",
    honorSocieties: ["NHS", "Spanish Honor Society"],
    classes: ["B", "D"],
  },
  {
    key: "caleb",
    email: "caleb.nguyen@pinelakeprep.org",
    fullName: "Caleb Nguyen",
    role: "student",
    gradeLevel: "10th",
    honorSocieties: ["NJHS"],
    classes: ["A", "F"],
  },
  {
    key: "dara",
    email: "dara.patel@pinelakeprep.org",
    fullName: "Dara Patel",
    role: "student",
    gradeLevel: "12th",
    honorSocieties: ["Science National Honor Society", "NHS"],
    classes: ["B", "E"],
  },
  {
    key: "eli",
    email: "eli.brooks@pinelakeprep.org",
    fullName: "Eli Brooks",
    role: "student",
    gradeLevel: "9th",
    honorSocieties: [],
    classes: ["A", "C"],
  },
  {
    key: "farrah",
    email: "farrah.diallo@pinelakeprep.org",
    fullName: "Farrah Diallo",
    role: "student",
    gradeLevel: "11th",
    honorSocieties: ["Beta Club", "Spanish Honor Society"],
    classes: ["C", "F"],
  },
  {
    key: "gabe",
    email: "gabe.kim@pinelakeprep.org",
    fullName: "Gabe Kim",
    role: "student",
    gradeLevel: "10th",
    honorSocieties: ["NJHS"],
    classes: ["B", "D"],
  },
  {
    key: "hana",
    email: "hana.ross@pinelakeprep.org",
    fullName: "Hana Ross",
    role: "student",
    gradeLevel: "12th",
    honorSocieties: ["NHS"],
    classes: ["A", "E"],
  },
  {
    key: "isaac",
    email: "isaac.wright@pinelakeprep.org",
    fullName: "Isaac Wright",
    role: "student",
    gradeLevel: "9th",
    honorSocieties: ["NJHS"],
    classes: ["C", "F"],
  },
  {
    key: "jada",
    email: "jada.mills@pinelakeprep.org",
    fullName: "Jada Mills",
    role: "student",
    gradeLevel: "11th",
    honorSocieties: ["Spanish Honor Society"],
    classes: ["B", "E"],
  },
  {
    key: "kai",
    email: "kai.sato@pinelakeprep.org",
    fullName: "Kai Sato",
    role: "student",
    gradeLevel: "10th",
    honorSocieties: ["Beta Club"],
    classes: ["A", "D"],
  },
  {
    key: "leila",
    email: "leila.hassan@pinelakeprep.org",
    fullName: "Leila Hassan",
    role: "student",
    gradeLevel: "12th",
    honorSocieties: ["Science National Honor Society"],
    classes: ["C", "F"],
  },
  {
    key: "miles",
    email: "miles.owens@pinelakeprep.org",
    fullName: "Miles Owens",
    role: "student",
    gradeLevel: "11th",
    honorSocieties: ["NHS"],
    classes: ["B", "F"],
  },
  {
    key: "nia",
    email: "nia.carter@pinelakeprep.org",
    fullName: "Nia Carter",
    role: "student",
    gradeLevel: "9th",
    honorSocieties: [],
    classes: ["A", "D"],
  },
  {
    key: "omar",
    email: "omar.reza@pinelakeprep.org",
    fullName: "Omar Reza",
    role: "student",
    gradeLevel: "10th",
    honorSocieties: ["NJHS", "Spanish Honor Society"],
    classes: ["E", "F"],
  },
];

async function existingAuthUsers(): Promise<Map<string, string>> {
  const byEmail = new Map<string, string>();
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      throw new Error(`list auth users: ${error.message}`);
    }
    data.users.forEach((user) => {
      if (user.email) {
        byEmail.set(user.email.toLowerCase(), user.id);
      }
    });
    if (data.users.length < 200) {
      return byEmail;
    }
  }
}

async function seedUsers(): Promise<Record<string, string>> {
  const existing = await existingAuthUsers();
  const ids: Record<string, string> = {};
  let created = 0;

  for (const user of SEED_USERS) {
    let id = existing.get(user.email.toLowerCase());

    if (!id) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true,
        // handle_new_user() reads this to pick the initial role, which keeps
        // the school-domain check happy for staff accounts.
        user_metadata: { full_name: user.fullName, intended_role: user.role },
      });
      if (error || !data.user) {
        throw new Error(
          `create auth user ${user.email}: ${error?.message ?? "no user returned"}`,
        );
      }
      id = data.user.id;
      created += 1;
    }

    must(
      `upsert profile ${user.email}`,
      await supabase
        .from("users")
        .update({
          email: user.email,
          full_name: user.fullName,
          role: user.role,
          grade_level: user.gradeLevel ?? null,
          honor_societies: user.honorSocieties ?? [],
          classes: user.classes ?? [],
          is_tech_manager: user.isTechManager ?? false,
          onboarding_completed: true,
        })
        .eq("id", id)
        .select("id")
        .single(),
    );

    ids[user.key] = id;
  }

  console.log(
    `  users: ${SEED_USERS.length} profiles (${created} new auth accounts)`,
  );
  return ids;
}

// ---------------------------------------------------------------------------
// 2. Opportunities
// ---------------------------------------------------------------------------
type SeedOpportunity = {
  id: string;
  title: string;
  description: string;
  category: OpportunityCategory;
  honorSociety: HonorSociety | null;
  serviceScope: ServiceScope;
  location: OpportunityLocation;
  eventDate: string;
  blockTime: string | null;
  hoursValue: number;
  requiredVolunteers: number | null;
  createdByKey: string;
  organizationName?: string;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  status: OpportunityStatus;
};

const SEED_OPPORTUNITIES: SeedOpportunity[] = [
  {
    id: "11111111-1111-4111-8111-000000000001",
    title: "NHS Food Pantry Sort & Pack",
    description:
      "Sort donated produce and pack weekend meal bags with the NHS service committee.",
    category: "NHS",
    honorSociety: "NHS",
    serviceScope: "community_external",
    location: "out_of_school",
    eventDate: at(4, 14),
    blockTime: "After School · Block E",
    hoursValue: 2.5,
    requiredVolunteers: 12,
    createdByKey: "advisor",
    status: "approved",
  },
  {
    id: "11111111-1111-4111-8111-000000000002",
    title: "Beta Club Senior Center Bingo Night",
    description:
      "Call numbers, hand out prizes, and sit with residents during the monthly bingo social.",
    category: "Beta",
    honorSociety: "Beta Club",
    serviceScope: "community_external",
    location: "out_of_school",
    eventDate: at(6, 22),
    blockTime: "After School",
    hoursValue: 2,
    requiredVolunteers: 8,
    createdByKey: "advisor",
    status: "approved",
  },
  {
    id: "11111111-1111-4111-8111-000000000003",
    title: "In-School Peer Tutoring — Algebra I",
    description:
      "Support Algebra I students during Block B study hall. Bring your own notes and worked examples.",
    category: "Tutoring",
    honorSociety: null,
    serviceScope: "community_external",
    location: "in_school",
    eventDate: at(2, 15),
    blockTime: "Morning · Block B",
    hoursValue: 1,
    requiredVolunteers: 5,
    createdByKey: "teacher2",
    status: "approved",
  },
  {
    id: "11111111-1111-4111-8111-000000000004",
    title: "Outside Food Drive — Lakeside Food Bank",
    description:
      "Staff collection tables at the Lakeside Food Bank fall drive. Lifting boxes up to 25 lbs required.",
    category: "Outside Org",
    honorSociety: null,
    serviceScope: "community_external",
    location: "out_of_school",
    eventDate: at(11, 15),
    blockTime: "Morning",
    hoursValue: 3,
    requiredVolunteers: 20,
    createdByKey: "outsideOrg",
    organizationName: "Lakeside Food Bank",
    // Left unreviewed on purpose so the certification queue has work waiting.
    status: "pending_certification",
  },
  {
    id: "11111111-1111-4111-8111-000000000005",
    title: "Recurring Campus Cleanup",
    description:
      "Weekly sweep of the courtyard, bus loop, and athletic fields. Gloves and bags provided.",
    category: "General",
    honorSociety: null,
    serviceScope: "community_external",
    location: "in_school",
    eventDate: at(3, 20),
    blockTime: "After School · Block F",
    hoursValue: 1.5,
    requiredVolunteers: 15,
    createdByKey: "advisor",
    isRecurring: true,
    recurrencePattern: "weekly",
    status: "approved",
  },
  {
    id: "11111111-1111-4111-8111-000000000006",
    title: "Library Book Fair Setup",
    description:
      "Unpack, label, and display new titles before the book fair opens to families.",
    category: "General",
    honorSociety: null,
    serviceScope: "community_external",
    location: "in_school",
    eventDate: at(5, 19),
    blockTime: "After School · Block E",
    hoursValue: 1.5,
    requiredVolunteers: 6,
    createdByKey: "teacher2",
    status: "approved",
  },
  {
    id: "11111111-1111-4111-8111-000000000007",
    title: "Morning Carpool Greeters",
    description:
      "Welcome families at the front loop, direct traffic flow, and hold doors for late arrivals.",
    category: "General",
    honorSociety: null,
    serviceScope: "community_external",
    location: "in_school",
    eventDate: at(1, 11),
    blockTime: "Morning",
    hoursValue: 0.5,
    requiredVolunteers: 8,
    createdByKey: "advisor",
    isRecurring: true,
    recurrencePattern: "daily",
    status: "approved",
  },
  {
    id: "11111111-1111-4111-8111-000000000008",
    title: "Athletic Event Ticket Table",
    description:
      "Staff the ticket table for the home soccer match. Collect cash/QR tickets and greet visiting fans.",
    category: "General",
    honorSociety: null,
    serviceScope: "community_external",
    location: "after_school",
    eventDate: at(8, 22),
    blockTime: "After School",
    hoursValue: 2,
    requiredVolunteers: 6,
    createdByKey: "teacher2",
    status: "approved",
  },
  {
    id: "11111111-1111-4111-8111-000000000009",
    title: "Spanish I Study Hall Support",
    description:
      "Tutor Spanish I students during Block D study hall. Conversation practice preferred.",
    category: "Tutoring",
    honorSociety: "Spanish Honor Society",
    serviceScope: "club_internal",
    location: "in_school",
    eventDate: at(3, 16),
    blockTime: "After School · Block D",
    hoursValue: 1,
    requiredVolunteers: 4,
    createdByKey: "advisor",
    status: "approved",
  },
  {
    id: "11111111-1111-4111-8111-000000000010",
    title: "Middle School Supply Drive Sorting",
    description:
      "Sort donated notebooks, pencils, and backpacks for the NJHS fall supply drive.",
    category: "General",
    honorSociety: "NJHS",
    serviceScope: "club_internal",
    location: "in_school",
    eventDate: at(4, 19),
    blockTime: "After School · Block F",
    hoursValue: 1,
    requiredVolunteers: 10,
    createdByKey: "advisor",
    status: "approved",
  },
  {
    id: "11111111-1111-4111-8111-000000000011",
    title: "Robotics club outreach at the public library",
    description:
      "Run a hands-on robotics demo table for families at the Mooresville library STEM night.",
    category: "General",
    honorSociety: "Science National Honor Society",
    serviceScope: "community_external",
    location: "out_of_school",
    eventDate: at(9, 18),
    blockTime: "After School",
    hoursValue: 2.5,
    requiredVolunteers: 6,
    createdByKey: "teacher2",
    status: "approved",
  },
  {
    id: "11111111-1111-4111-8111-000000000012",
    title: "Trail Cleanup at Lake Park",
    description:
      "Pick up litter along the lakeside trail and log bag counts for the county parks partnership.",
    category: "General",
    honorSociety: null,
    serviceScope: "community_external",
    location: "out_of_school",
    eventDate: at(7, 14),
    blockTime: "Morning",
    hoursValue: 2,
    requiredVolunteers: 12,
    createdByKey: "advisor",
    status: "approved",
  },
  {
    id: "11111111-1111-4111-8111-000000000013",
    title: "Community Garden Workday",
    description:
      "Weed beds, water seedlings, and restock the compost bins at the Pine Lake community plot.",
    category: "General",
    honorSociety: null,
    serviceScope: "community_external",
    location: "out_of_school",
    eventDate: at(5, 13),
    blockTime: "Morning",
    hoursValue: 2,
    requiredVolunteers: 10,
    createdByKey: "advisor",
    status: "approved",
  },
  {
    id: "11111111-1111-4111-8111-000000000014",
    title: "Elementary Reading Buddies",
    description:
      "Read with 2nd graders in the media nook. Morning Block B only; background check already on file.",
    category: "Tutoring",
    honorSociety: null,
    serviceScope: "community_external",
    location: "in_school",
    eventDate: at(2, 14),
    blockTime: "Morning · Block B",
    hoursValue: 0.75,
    requiredVolunteers: 6,
    createdByKey: "teacher2",
    isRecurring: true,
    recurrencePattern: "weekly",
    status: "approved",
  },
];

async function seedOpportunities(userIds: Record<string, string>) {
  must(
    "upsert opportunities",
    await supabase
      .from("opportunities")
      .upsert(
        SEED_OPPORTUNITIES.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          category: task.category,
          honor_society: task.honorSociety,
          service_scope: task.serviceScope,
          location: task.location,
          event_date: task.eventDate,
          block_time: task.blockTime,
          hours_value: task.hoursValue,
          required_volunteers: task.requiredVolunteers,
          created_by: userIds[task.createdByKey],
          organization_name: task.organizationName ?? null,
          is_recurring: task.isRecurring ?? false,
          recurrence_pattern: task.recurrencePattern ?? null,
          status: task.status,
        })),
        { onConflict: "id" },
      )
      .select("id"),
  );

  const pending = SEED_OPPORTUNITIES.filter(
    (task) => task.status === "pending_certification",
  ).length;
  console.log(
    `  opportunities: ${SEED_OPPORTUNITIES.length} tasks (${pending} awaiting certification)`,
  );
}

// ---------------------------------------------------------------------------
// 3. Signups and hour logs
// ---------------------------------------------------------------------------
const OPP = {
  pantry: "11111111-1111-4111-8111-000000000001",
  bingo: "11111111-1111-4111-8111-000000000002",
  tutoring: "11111111-1111-4111-8111-000000000003",
  foodDrive: "11111111-1111-4111-8111-000000000004",
  cleanup: "11111111-1111-4111-8111-000000000005",
  bookFair: "11111111-1111-4111-8111-000000000006",
  carpool: "11111111-1111-4111-8111-000000000007",
  tickets: "11111111-1111-4111-8111-000000000008",
  spanish: "11111111-1111-4111-8111-000000000009",
  supplies: "11111111-1111-4111-8111-000000000010",
  robotics: "11111111-1111-4111-8111-000000000011",
  trail: "11111111-1111-4111-8111-000000000012",
  garden: "11111111-1111-4111-8111-000000000013",
  reading: "11111111-1111-4111-8111-000000000014",
} as const;

function signupId(n: number): string {
  return `22222222-2222-4222-8222-${String(n).padStart(12, "0")}`;
}

function logId(n: number): string {
  return `33333333-3333-4333-8333-${String(n).padStart(12, "0")}`;
}

const SEED_SIGNUPS: Array<{
  id: string;
  opportunityId: string;
  studentKey: string;
  status: "registered" | "completed";
}> = [
  { id: signupId(1), opportunityId: OPP.pantry, studentKey: "avery", status: "completed" },
  { id: signupId(2), opportunityId: OPP.tutoring, studentKey: "avery", status: "registered" },
  { id: signupId(3), opportunityId: OPP.bingo, studentKey: "bella", status: "registered" },
  { id: signupId(4), opportunityId: OPP.cleanup, studentKey: "caleb", status: "registered" },
  { id: signupId(5), opportunityId: OPP.spanish, studentKey: "bella", status: "completed" },
  { id: signupId(6), opportunityId: OPP.supplies, studentKey: "caleb", status: "completed" },
  { id: signupId(7), opportunityId: OPP.robotics, studentKey: "dara", status: "completed" },
  { id: signupId(8), opportunityId: OPP.tutoring, studentKey: "dara", status: "registered" },
  { id: signupId(9), opportunityId: OPP.carpool, studentKey: "eli", status: "completed" },
  { id: signupId(10), opportunityId: OPP.cleanup, studentKey: "eli", status: "registered" },
  { id: signupId(11), opportunityId: OPP.bingo, studentKey: "farrah", status: "completed" },
  { id: signupId(12), opportunityId: OPP.spanish, studentKey: "farrah", status: "registered" },
  { id: signupId(13), opportunityId: OPP.supplies, studentKey: "gabe", status: "completed" },
  { id: signupId(14), opportunityId: OPP.bookFair, studentKey: "gabe", status: "registered" },
  { id: signupId(15), opportunityId: OPP.pantry, studentKey: "hana", status: "completed" },
  { id: signupId(16), opportunityId: OPP.bookFair, studentKey: "hana", status: "registered" },
  { id: signupId(17), opportunityId: OPP.carpool, studentKey: "isaac", status: "completed" },
  { id: signupId(18), opportunityId: OPP.reading, studentKey: "isaac", status: "registered" },
  { id: signupId(19), opportunityId: OPP.spanish, studentKey: "jada", status: "completed" },
  { id: signupId(20), opportunityId: OPP.garden, studentKey: "jada", status: "registered" },
  { id: signupId(21), opportunityId: OPP.bingo, studentKey: "kai", status: "completed" },
  { id: signupId(22), opportunityId: OPP.tickets, studentKey: "kai", status: "registered" },
  { id: signupId(23), opportunityId: OPP.robotics, studentKey: "leila", status: "completed" },
  { id: signupId(24), opportunityId: OPP.trail, studentKey: "leila", status: "registered" },
  { id: signupId(25), opportunityId: OPP.pantry, studentKey: "miles", status: "completed" },
  { id: signupId(26), opportunityId: OPP.tickets, studentKey: "miles", status: "registered" },
  { id: signupId(27), opportunityId: OPP.carpool, studentKey: "nia", status: "completed" },
  { id: signupId(28), opportunityId: OPP.garden, studentKey: "nia", status: "registered" },
  { id: signupId(29), opportunityId: OPP.supplies, studentKey: "omar", status: "completed" },
  { id: signupId(30), opportunityId: OPP.spanish, studentKey: "omar", status: "registered" },
  { id: signupId(31), opportunityId: OPP.cleanup, studentKey: "omar", status: "registered" },
  { id: signupId(32), opportunityId: OPP.trail, studentKey: "eli", status: "registered" },
  { id: signupId(33), opportunityId: OPP.reading, studentKey: "nia", status: "registered" },
  { id: signupId(34), opportunityId: OPP.garden, studentKey: "avery", status: "registered" },
];

type SeedHourLog = {
  id: string;
  studentKey: string;
  opportunityId: string | null;
  activityTitle: string;
  honorSociety: HonorSociety | null;
  serviceDate: string;
  hours: number;
  reflection: string;
  supervisorName: string;
  supervisorEmail: string;
  supervisorPhone?: string;
  proofPhotoUrl?: string;
  status: HourLogStatus;
  verifiedByKey?: string;
  reviewNotes?: string;
};

const SEED_HOUR_LOGS: SeedHourLog[] = [
  {
    id: logId(1),
    studentKey: "avery",
    opportunityId: OPP.pantry,
    activityTitle: "NHS Food Pantry Sort & Pack",
    honorSociety: "NHS",
    serviceDate: at(-14, 14),
    hours: 2.5,
    reflection:
      "Sorted produce donations and packed 60 weekend bags with the Saturday crew.",
    supervisorName: "Dana Whitfield",
    supervisorEmail: "dana@lakesidefoodbank.org",
    supervisorPhone: "704-555-0142",
    status: "verified",
    verifiedByKey: "advisor",
  },
  {
    id: logId(2),
    studentKey: "avery",
    opportunityId: OPP.tutoring,
    activityTitle: "In-School Peer Tutoring — Algebra I",
    honorSociety: null,
    serviceDate: at(-5, 15),
    hours: 1,
    reflection: "Worked through factoring practice with three Algebra I students.",
    supervisorName: "Mateo Alvarez",
    supervisorEmail: "m.alvarez@pinelakeprep.org",
    status: "pending",
  },
  {
    id: logId(3),
    studentKey: "bella",
    opportunityId: null,
    activityTitle: "Neighborhood shoreline cleanup (self-organized)",
    honorSociety: "NHS",
    serviceDate: at(-4, 14),
    hours: 3,
    reflection:
      "Organized six neighbors to clear litter from the cove. Filled nine bags.",
    supervisorName: "Marcus Webb",
    supervisorEmail: "mwebb@lakenormanhoa.org",
    supervisorPhone: "704-555-0119",
    proofPhotoUrl: "https://example.org/proof/shoreline.jpg",
    status: "pending",
  },
  {
    id: logId(4),
    studentKey: "caleb",
    opportunityId: null,
    activityTitle: "Babysitting for a family friend",
    honorSociety: null,
    serviceDate: at(-20, 23),
    hours: 4,
    reflection: "Watched two children for the evening.",
    supervisorName: "Karen Liu",
    supervisorEmail: "karen.liu@example.com",
    status: "rejected",
    verifiedByKey: "advisor",
    reviewNotes:
      "Paid or personal childcare does not qualify as community service. Try a partner organization from the task feed.",
  },
  {
    id: logId(5),
    studentKey: "bella",
    opportunityId: OPP.spanish,
    activityTitle: "Spanish I Study Hall Support",
    honorSociety: "Spanish Honor Society",
    serviceDate: at(-8, 16),
    hours: 1,
    reflection: "Ran verb drills and conversation stations for six Spanish I students.",
    supervisorName: "Morgan Rivera",
    supervisorEmail: "advisor@pinelakeprep.org",
    status: "verified",
    verifiedByKey: "advisor",
  },
  {
    id: logId(6),
    studentKey: "caleb",
    opportunityId: OPP.supplies,
    activityTitle: "Middle School Supply Drive Sorting",
    honorSociety: "NJHS",
    serviceDate: at(-10, 19),
    hours: 1,
    reflection: "Sorted backpacks and labeled grade-level supply kits.",
    supervisorName: "Morgan Rivera",
    supervisorEmail: "advisor@pinelakeprep.org",
    status: "verified",
    verifiedByKey: "advisor",
  },
  {
    id: logId(7),
    studentKey: "dara",
    opportunityId: OPP.robotics,
    activityTitle: "Robotics club outreach at the public library",
    honorSociety: "Science National Honor Society",
    serviceDate: at(-12, 18),
    hours: 2.5,
    reflection: "Ran the robot demo table and explained sensors to visiting families.",
    supervisorName: "Mateo Alvarez",
    supervisorEmail: "m.alvarez@pinelakeprep.org",
    status: "verified",
    verifiedByKey: "teacher2",
  },
  {
    id: logId(8),
    studentKey: "dara",
    opportunityId: null,
    activityTitle: "Hospital waiting-room reading cart",
    honorSociety: "NHS",
    serviceDate: at(-3, 17),
    hours: 2,
    reflection: "Restocked the pediatric waiting room cart and read with two patients.",
    supervisorName: "Elena Brooks",
    supervisorEmail: "e.brooks@lakenormanhospital.org",
    status: "pending",
  },
  {
    id: logId(9),
    studentKey: "eli",
    opportunityId: OPP.carpool,
    activityTitle: "Morning Carpool Greeters",
    honorSociety: null,
    serviceDate: at(-6, 11),
    hours: 0.5,
    reflection: "Held the front doors and directed late arrivals to the office.",
    supervisorName: "Morgan Rivera",
    supervisorEmail: "advisor@pinelakeprep.org",
    status: "verified",
    verifiedByKey: "advisor",
  },
  {
    id: logId(10),
    studentKey: "eli",
    opportunityId: OPP.cleanup,
    activityTitle: "Recurring Campus Cleanup",
    honorSociety: null,
    serviceDate: at(-2, 20),
    hours: 1.5,
    reflection: "Swept the bus loop and filled two bags from the courtyard.",
    supervisorName: "Morgan Rivera",
    supervisorEmail: "advisor@pinelakeprep.org",
    status: "pending",
  },
  {
    id: logId(11),
    studentKey: "farrah",
    opportunityId: OPP.bingo,
    activityTitle: "Beta Club Senior Center Bingo Night",
    honorSociety: "Beta Club",
    serviceDate: at(-11, 22),
    hours: 2,
    reflection: "Called numbers and sat with residents who needed help marking cards.",
    supervisorName: "Patrice Holloway",
    supervisorEmail: "pholloway@lakenormanseniors.org",
    status: "verified",
    verifiedByKey: "advisor",
  },
  {
    id: logId(12),
    studentKey: "gabe",
    opportunityId: OPP.supplies,
    activityTitle: "Middle School Supply Drive Sorting",
    honorSociety: "NJHS",
    serviceDate: at(-9, 19),
    hours: 1,
    reflection: "Packed 20 kits and carried boxes to the middle school lobby.",
    supervisorName: "Morgan Rivera",
    supervisorEmail: "advisor@pinelakeprep.org",
    status: "verified",
    verifiedByKey: "advisor",
  },
  {
    id: logId(13),
    studentKey: "gabe",
    opportunityId: OPP.bookFair,
    activityTitle: "Library Book Fair Setup",
    honorSociety: null,
    serviceDate: at(-1, 19),
    hours: 1.5,
    reflection: "Unpacked two publisher boxes and built the middle-grade display.",
    supervisorName: "Mateo Alvarez",
    supervisorEmail: "m.alvarez@pinelakeprep.org",
    status: "pending",
  },
  {
    id: logId(14),
    studentKey: "hana",
    opportunityId: OPP.pantry,
    activityTitle: "NHS Food Pantry Sort & Pack",
    honorSociety: "NHS",
    serviceDate: at(-14, 14),
    hours: 2.5,
    reflection: "Packed weekend bags and restocked the canned-goods shelves.",
    supervisorName: "Dana Whitfield",
    supervisorEmail: "dana@lakesidefoodbank.org",
    status: "verified",
    verifiedByKey: "advisor",
  },
  {
    id: logId(15),
    studentKey: "isaac",
    opportunityId: OPP.carpool,
    activityTitle: "Morning Carpool Greeters",
    honorSociety: "NJHS",
    serviceDate: at(-7, 11),
    hours: 0.5,
    reflection: "Directed traffic at the front loop with the safety patrol.",
    supervisorName: "Morgan Rivera",
    supervisorEmail: "advisor@pinelakeprep.org",
    status: "verified",
    verifiedByKey: "advisor",
  },
  {
    id: logId(16),
    studentKey: "jada",
    opportunityId: OPP.spanish,
    activityTitle: "Spanish I Study Hall Support",
    honorSociety: "Spanish Honor Society",
    serviceDate: at(-8, 16),
    hours: 1,
    reflection: "Helped four students write short dialogues for their oral quiz.",
    supervisorName: "Morgan Rivera",
    supervisorEmail: "advisor@pinelakeprep.org",
    status: "verified",
    verifiedByKey: "advisor",
  },
  {
    id: logId(17),
    studentKey: "jada",
    opportunityId: OPP.garden,
    activityTitle: "Community Garden Workday",
    honorSociety: null,
    serviceDate: at(-2, 13),
    hours: 2,
    reflection: "Weeded the tomato beds and hauled compost to the far plot.",
    supervisorName: "Chris Lang",
    supervisorEmail: "clang@pinelakegarden.org",
    status: "pending",
  },
  {
    id: logId(18),
    studentKey: "kai",
    opportunityId: OPP.bingo,
    activityTitle: "Beta Club Senior Center Bingo Night",
    honorSociety: "Beta Club",
    serviceDate: at(-11, 22),
    hours: 2,
    reflection: "Handed out prizes and reset tables after the last round.",
    supervisorName: "Patrice Holloway",
    supervisorEmail: "pholloway@lakenormanseniors.org",
    status: "verified",
    verifiedByKey: "advisor",
  },
  {
    id: logId(19),
    studentKey: "leila",
    opportunityId: OPP.robotics,
    activityTitle: "Robotics club outreach at the public library",
    honorSociety: "Science National Honor Society",
    serviceDate: at(-12, 18),
    hours: 2.5,
    reflection: "Led the circuit-building station for visiting 4th graders.",
    supervisorName: "Mateo Alvarez",
    supervisorEmail: "m.alvarez@pinelakeprep.org",
    status: "verified",
    verifiedByKey: "teacher2",
  },
  {
    id: logId(20),
    studentKey: "miles",
    opportunityId: OPP.pantry,
    activityTitle: "NHS Food Pantry Sort & Pack",
    honorSociety: "NHS",
    serviceDate: at(-14, 14),
    hours: 2.5,
    reflection: "Loaded the van and labeled allergen-free weekend bags.",
    supervisorName: "Dana Whitfield",
    supervisorEmail: "dana@lakesidefoodbank.org",
    status: "verified",
    verifiedByKey: "advisor",
  },
  {
    id: logId(21),
    studentKey: "nia",
    opportunityId: OPP.carpool,
    activityTitle: "Morning Carpool Greeters",
    honorSociety: null,
    serviceDate: at(-6, 11),
    hours: 0.5,
    reflection: "Held signs at the bus loop and greeted late families.",
    supervisorName: "Morgan Rivera",
    supervisorEmail: "advisor@pinelakeprep.org",
    status: "verified",
    verifiedByKey: "advisor",
  },
  {
    id: logId(22),
    studentKey: "omar",
    opportunityId: OPP.supplies,
    activityTitle: "Middle School Supply Drive Sorting",
    honorSociety: "NJHS",
    serviceDate: at(-10, 19),
    hours: 1,
    reflection: "Counted pencils and taped grade labels onto 15 kits.",
    supervisorName: "Morgan Rivera",
    supervisorEmail: "advisor@pinelakeprep.org",
    status: "verified",
    verifiedByKey: "advisor",
  },
  {
    id: logId(23),
    studentKey: "hana",
    opportunityId: null,
    activityTitle: "Church clothing closet shift",
    honorSociety: "NHS",
    serviceDate: at(-3, 15),
    hours: 3,
    reflection: "Sorted donated coats by size and helped two families check out.",
    supervisorName: "Rev. Anita Cole",
    supervisorEmail: "acole@lakesideumc.org",
    status: "pending",
  },
  {
    id: logId(24),
    studentKey: "miles",
    opportunityId: OPP.tickets,
    activityTitle: "Athletic Event Ticket Table",
    honorSociety: null,
    serviceDate: at(-1, 22),
    hours: 2,
    reflection: "Took QR tickets at gate 2 and directed visitors to the home stands.",
    supervisorName: "Mateo Alvarez",
    supervisorEmail: "m.alvarez@pinelakeprep.org",
    status: "pending",
  },
  {
    id: logId(25),
    studentKey: "farrah",
    opportunityId: null,
    activityTitle: "Paid car wash for a neighbor",
    honorSociety: null,
    serviceDate: at(-18, 15),
    hours: 2,
    reflection: "Washed two cars and was paid $20.",
    supervisorName: "Tom Greene",
    supervisorEmail: "tgreene@example.com",
    status: "rejected",
    verifiedByKey: "advisor",
    reviewNotes:
      "Paid work is not community service. Log a partner task from the feed instead.",
  },
];

async function seedSignupsAndLogs(userIds: Record<string, string>) {
  must(
    "upsert event signups",
    await supabase
      .from("event_signups")
      .upsert(
        SEED_SIGNUPS.map((signup) => ({
          id: signup.id,
          opportunity_id: signup.opportunityId,
          student_id: userIds[signup.studentKey],
          status: signup.status,
        })),
        { onConflict: "id" },
      )
      .select("id"),
  );

  must(
    "upsert hour logs",
    await supabase
      .from("hour_logs")
      .upsert(
        SEED_HOUR_LOGS.map((log) => ({
          id: log.id,
          student_id: userIds[log.studentKey],
          opportunity_id: log.opportunityId,
          activity_title: log.activityTitle,
          honor_society: log.honorSociety,
          service_date: log.serviceDate,
          hours_logged: log.hours,
          reflection_text: log.reflection,
          proof_photo_url: log.proofPhotoUrl ?? null,
          supervisor_name: log.supervisorName,
          supervisor_email: log.supervisorEmail,
          supervisor_phone: log.supervisorPhone ?? null,
          supervisor_signature_status: log.status === "verified",
          status: log.status,
          verified_by: log.verifiedByKey
            ? userIds[log.verifiedByKey]
            : null,
          review_notes: log.reviewNotes ?? null,
          reviewed_at: log.verifiedByKey ? at(-1, 16) : null,
        })),
        { onConflict: "id" },
      )
      .select("id"),
  );

  const counts = SEED_HOUR_LOGS.reduce<Record<string, number>>((acc, log) => {
    acc[log.status] = (acc[log.status] ?? 0) + 1;
    return acc;
  }, {});
  const summary = Object.entries(counts)
    .map(([status, count]) => `${count} ${status}`)
    .join(", ");
  console.log(
    `  signups: ${SEED_SIGNUPS.length} · hour logs: ${SEED_HOUR_LOGS.length} (${summary})`,
  );
}

// ---------------------------------------------------------------------------
// 4. Notifications
// ---------------------------------------------------------------------------
const SEED_NOTIFICATIONS = [
  {
    id: "44444444-4444-4444-8444-000000000001",
    userKey: "avery",
    category: "hours" as const,
    title: "Hours verified",
    message:
      '2.5 hours for "NHS Food Pantry Sort & Pack" were verified by Morgan Rivera.',
    href: "/my-hours",
    isRead: false,
  },
  {
    id: "44444444-4444-4444-8444-000000000002",
    userKey: "avery",
    category: "signup" as const,
    title: "You are signed up",
    message:
      'Your spot for "In-School Peer Tutoring — Algebra I" is reserved. Log your hours once you have served.',
    href: "/my-hours",
    isRead: false,
  },
  {
    id: "44444444-4444-4444-8444-000000000003",
    userKey: "caleb",
    category: "hours" as const,
    title: "Hours rejected",
    message:
      'Your log for "Babysitting for a family friend" was rejected. Paid or personal childcare does not qualify as community service.',
    href: "/my-hours",
    isRead: false,
  },
  {
    id: "44444444-4444-4444-8444-000000000004",
    userKey: "advisor",
    category: "hours" as const,
    title: "Hour claims waiting",
    message: "Several student hour logs are waiting on your verification.",
    href: "/admin/approvals",
    isRead: false,
  },
  {
    id: "44444444-4444-4444-8444-000000000005",
    userKey: "techManager",
    category: "certification" as const,
    title: "Certification queue",
    message: '"Outside Food Drive — Lakeside Food Bank" is waiting on review.',
    href: "/admin/certification",
    isRead: false,
  },
  {
    id: "44444444-4444-4444-8444-000000000006",
    userKey: "outsideOrg",
    category: "certification" as const,
    title: "Request submitted",
    message:
      'A Tech Manager will certify "Outside Food Drive — Lakeside Food Bank" before it reaches the public feed.',
    href: "/org-dashboard",
    isRead: true,
  },
];

async function seedNotifications(userIds: Record<string, string>) {
  must(
    "upsert notifications",
    await supabase
      .from("notifications")
      .upsert(
        SEED_NOTIFICATIONS.map((item) => ({
          id: item.id,
          user_id: userIds[item.userKey],
          category: item.category,
          title: item.title,
          message: item.message,
          href: item.href,
          is_read: item.isRead,
        })),
        { onConflict: "id" },
      )
      .select("id"),
  );

  console.log(`  notifications: ${SEED_NOTIFICATIONS.length} delivered`);
}

// ---------------------------------------------------------------------------
async function main() {
  console.log(`Seeding ${url}\n`);

  const userIds = await seedUsers();
  await seedOpportunities(userIds);
  await seedSignupsAndLogs(userIds);
  await seedNotifications(userIds);

  console.log(`\nDone. Sign in with any seeded address, password: ${password}`);
}

main().catch((error: unknown) => {
  console.error(`\nSeed failed. ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
