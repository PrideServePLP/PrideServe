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
const SEED_SIGNUPS = [
  {
    id: "22222222-2222-4222-8222-000000000001",
    opportunityId: "11111111-1111-4111-8111-000000000001",
    studentKey: "avery",
    status: "completed" as const,
  },
  {
    id: "22222222-2222-4222-8222-000000000002",
    opportunityId: "11111111-1111-4111-8111-000000000003",
    studentKey: "avery",
    status: "registered" as const,
  },
  {
    id: "22222222-2222-4222-8222-000000000003",
    opportunityId: "11111111-1111-4111-8111-000000000002",
    studentKey: "bella",
    status: "registered" as const,
  },
  {
    id: "22222222-2222-4222-8222-000000000004",
    opportunityId: "11111111-1111-4111-8111-000000000005",
    studentKey: "caleb",
    status: "registered" as const,
  },
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
    id: "33333333-3333-4333-8333-000000000001",
    studentKey: "avery",
    opportunityId: "11111111-1111-4111-8111-000000000001",
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
    id: "33333333-3333-4333-8333-000000000002",
    studentKey: "avery",
    opportunityId: "11111111-1111-4111-8111-000000000003",
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
    id: "33333333-3333-4333-8333-000000000003",
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
    id: "33333333-3333-4333-8333-000000000004",
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
    message: "2 student hour logs are waiting on your verification.",
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
