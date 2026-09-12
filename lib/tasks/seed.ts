import type { ServiceTask, StudentOption } from "./types";

/**
 * Local demo content used until Supabase credentials are configured.
 * Creator and assignee ids line up with the development role personas.
 */
const STUDENT_ID = "dev-student_nhs_beta";
const TEACHER_ID = "dev-teacher_advisor";
const ORG_ID = "dev-outside_org";

export const SEED_STUDENTS: StudentOption[] = [
  {
    id: STUDENT_ID,
    fullName: "Avery Chen",
    email: "avery.chen@pinelakeprep.org",
    gradeLevel: "11th",
    honorSocieties: ["NHS", "Beta Club"],
  },
  {
    id: "student-bella-ortiz",
    fullName: "Bella Ortiz",
    email: "bella.ortiz@pinelakeprep.org",
    gradeLevel: "12th",
    honorSocieties: ["NHS", "Spanish Honor Society"],
  },
  {
    id: "student-caleb-nguyen",
    fullName: "Caleb Nguyen",
    email: "caleb.nguyen@pinelakeprep.org",
    gradeLevel: "10th",
    honorSocieties: ["NJHS"],
  },
  {
    id: "student-dara-patel",
    fullName: "Dara Patel",
    email: "dara.patel@pinelakeprep.org",
    gradeLevel: "12th",
    honorSocieties: ["Science National Honor Society", "NHS"],
  },
  {
    id: "student-eli-brooks",
    fullName: "Eli Brooks",
    email: "eli.brooks@pinelakeprep.org",
    gradeLevel: "9th",
    honorSocieties: [],
  },
  {
    id: "student-farrah-diallo",
    fullName: "Farrah Diallo",
    email: "farrah.diallo@pinelakeprep.org",
    gradeLevel: "11th",
    honorSocieties: ["Beta Club", "Spanish Honor Society"],
  },
];

type SeedTask = Pick<
  ServiceTask,
  | "id"
  | "title"
  | "description"
  | "requestedBy"
  | "category"
  | "location"
  | "eventDate"
  | "hoursValue"
  | "createdBy"
> &
  Partial<ServiceTask>;

function task(seed: SeedTask): ServiceTask {
  return {
    organizationName: null,
    honorSociety: null,
    serviceScope: "community_external",
    blockTime: null,
    requiredVolunteers: null,
    assignedStudentId: null,
    isRecurring: false,
    recurrencePattern: null,
    status: "approved",
    reviewNotes: null,
    ...seed,
  };
}

export const SEED_TASKS: ServiceTask[] = [
  // --- Public general feed -------------------------------------------------
  task({
    id: "seed-book-fair",
    title: "Library Book Fair Setup",
    description:
      "Help unpack, label, and display titles before the spring book fair opens to families.",
    requestedBy: "Media Center",
    category: "General",
    location: "in_school",
    blockTime: "After School",
    eventDate: "2026-09-11T20:00:00.000Z",
    hoursValue: 1.5,
    requiredVolunteers: 6,
    createdBy: TEACHER_ID,
  }),
  task({
    id: "seed-carpool-greeters",
    title: "Morning Carpool Greeters",
    description:
      "Welcome families at the front loop, direct traffic flow, and hold doors for late arrivals.",
    requestedBy: "Student Council",
    category: "General",
    location: "in_school",
    blockTime: "Morning · Block A",
    eventDate: "2026-09-14T11:30:00.000Z",
    hoursValue: 0.5,
    requiredVolunteers: 4,
    createdBy: TEACHER_ID,
    isRecurring: true,
    recurrencePattern: "daily",
  }),
  task({
    id: "seed-garden-workday",
    title: "Community Garden Workday",
    description:
      "Weed beds, water seedlings, and restock the compost bins at the Pine Lake community plot.",
    requestedBy: "Green Pride Club",
    category: "General",
    location: "out_of_school",
    blockTime: "After School",
    eventDate: "2026-09-13T14:00:00.000Z",
    hoursValue: 2,
    requiredVolunteers: 10,
    createdBy: TEACHER_ID,
  }),
  task({
    id: "seed-note-packets",
    title: "Peer Note Packets — Block C Biology",
    description:
      "Copy and organize lecture notes for students returning from absences. Must be available during Block C.",
    requestedBy: "Science Department",
    category: "Tutoring",
    location: "in_school",
    blockTime: "Morning · Block C",
    eventDate: "2026-09-12T14:00:00.000Z",
    hoursValue: 1,
    requiredVolunteers: 2,
    createdBy: TEACHER_ID,
  }),
  task({
    id: "seed-ticket-table",
    title: "Athletic Event Ticket Table",
    description:
      "Staff the ticket table for the home soccer match. Collect cash/QR tickets and greet visiting fans.",
    requestedBy: "Athletics Boosters",
    category: "General",
    location: "in_school",
    blockTime: "After School",
    eventDate: "2026-09-16T22:00:00.000Z",
    hoursValue: 2,
    requiredVolunteers: 3,
    createdBy: TEACHER_ID,
  }),
  task({
    id: "seed-reading-buddies",
    title: "Elementary Reading Buddies",
    description:
      "Read with 2nd graders in the media nook. Morning Block B only; background check already on file.",
    requestedBy: "Lower School",
    category: "Tutoring",
    location: "in_school",
    blockTime: "Morning · Block B",
    eventDate: "2026-09-15T13:15:00.000Z",
    hoursValue: 0.75,
    requiredVolunteers: 8,
    createdBy: TEACHER_ID,
    isRecurring: true,
    recurrencePattern: "weekly",
  }),
  task({
    id: "seed-trail-cleanup",
    title: "Trail Cleanup at Lake Park",
    description:
      "Pick up litter along the lakeside trail and log bag counts for the county parks partnership.",
    requestedBy: "Outdoor Education",
    category: "General",
    location: "out_of_school",
    blockTime: "After School · Block E",
    eventDate: "2026-09-19T20:00:00.000Z",
    hoursValue: 2,
    requiredVolunteers: 12,
    createdBy: TEACHER_ID,
  }),

  // --- Honor society chapters ----------------------------------------------
  task({
    id: "seed-nhs-induction",
    title: "NHS Induction Ceremony Setup",
    description:
      "Arrange candles, programs, and chair rows in the auditorium before the fall induction.",
    requestedBy: "NHS Chapter Advisor",
    category: "NHS",
    honorSociety: "NHS",
    serviceScope: "club_internal",
    location: "in_school",
    blockTime: "After School",
    eventDate: "2026-09-24T21:00:00.000Z",
    hoursValue: 2,
    requiredVolunteers: 6,
    createdBy: TEACHER_ID,
  }),
  task({
    id: "seed-nhs-food-pantry",
    title: "Food Pantry Sort & Pack",
    description:
      "Sort donated goods, check expiration dates, and assemble weekend bags for partner families.",
    requestedBy: "Lakeside Food Bank",
    organizationName: "Lakeside Food Bank",
    category: "NHS",
    honorSociety: "NHS",
    location: "out_of_school",
    eventDate: "2026-09-26T19:00:00.000Z",
    hoursValue: 2.5,
    requiredVolunteers: 15,
    createdBy: TEACHER_ID,
  }),
  task({
    id: "seed-njhs-supply-drive",
    title: "Middle School Supply Drive Sorting",
    description:
      "Count and box donated notebooks and pencils for the middle school supply closet.",
    requestedBy: "NJHS Officers",
    category: "General",
    honorSociety: "NJHS",
    serviceScope: "club_internal",
    location: "in_school",
    blockTime: "Block D",
    eventDate: "2026-09-18T19:30:00.000Z",
    hoursValue: 1,
    requiredVolunteers: 5,
    createdBy: TEACHER_ID,
  }),
  task({
    id: "seed-njhs-park-cleanup",
    title: "Lake Park Shoreline Cleanup",
    description:
      "Collect litter along the shoreline trail and log bag counts for the county parks partnership.",
    requestedBy: "Mooresville Parks Department",
    organizationName: "Mooresville Parks Department",
    category: "General",
    honorSociety: "NJHS",
    location: "out_of_school",
    eventDate: "2026-10-03T14:00:00.000Z",
    hoursValue: 3,
    requiredVolunteers: 20,
    createdBy: TEACHER_ID,
  }),
  task({
    id: "seed-beta-officer-meeting",
    title: "Beta Club Officer Planning Session",
    description:
      "Draft the spring convention agenda and assign committee leads for each service project.",
    requestedBy: "Beta Club Advisor",
    category: "Beta",
    honorSociety: "Beta Club",
    serviceScope: "club_internal",
    location: "after_school",
    blockTime: "After School",
    eventDate: "2026-09-22T20:15:00.000Z",
    hoursValue: 1.5,
    requiredVolunteers: 8,
    createdBy: TEACHER_ID,
    isRecurring: true,
    recurrencePattern: "monthly",
  }),
  task({
    id: "seed-beta-senior-center",
    title: "Senior Center Bingo Night",
    description:
      "Call numbers, hand out prizes, and sit with residents during the monthly bingo social.",
    requestedBy: "Pine Lake Senior Living",
    organizationName: "Pine Lake Senior Living",
    category: "Beta",
    honorSociety: "Beta Club",
    location: "out_of_school",
    eventDate: "2026-09-29T22:30:00.000Z",
    hoursValue: 2,
    requiredVolunteers: 6,
    createdBy: TEACHER_ID,
  }),
  task({
    id: "seed-spanish-tutoring",
    title: "Spanish I Study Hall Support",
    description:
      "Run conversation drills with Spanish I students during the Block B study hall.",
    requestedBy: "World Languages Department",
    category: "Tutoring",
    honorSociety: "Spanish Honor Society",
    serviceScope: "club_internal",
    location: "in_school",
    blockTime: "Block B",
    eventDate: "2026-09-19T14:45:00.000Z",
    hoursValue: 1,
    requiredVolunteers: 4,
    createdBy: TEACHER_ID,
    isRecurring: true,
    recurrencePattern: "weekly",
  }),
  task({
    id: "seed-spanish-translation",
    title: "Family Night Translation Table",
    description:
      "Translate enrollment paperwork for Spanish-speaking families at the district open house.",
    requestedBy: "Family Engagement Office",
    category: "Outside Org",
    honorSociety: "Spanish Honor Society",
    location: "out_of_school",
    eventDate: "2026-10-08T23:00:00.000Z",
    hoursValue: 2.5,
    requiredVolunteers: 6,
    createdBy: TEACHER_ID,
  }),
  task({
    id: "seed-snhs-lab-prep",
    title: "Chemistry Lab Prep & Glassware Reset",
    description:
      "Wash, dry, and restock glassware and label reagent bottles for next week's labs.",
    requestedBy: "Science Department",
    category: "General",
    honorSociety: "Science National Honor Society",
    serviceScope: "club_internal",
    location: "after_school",
    blockTime: "After School",
    eventDate: "2026-09-23T20:00:00.000Z",
    hoursValue: 1.5,
    requiredVolunteers: 4,
    createdBy: TEACHER_ID,
    isRecurring: true,
    recurrencePattern: "weekly",
  }),
  task({
    id: "seed-snhs-stem-night",
    title: "Elementary STEM Night Demos",
    description:
      "Run hands-on physics demo stations for elementary families at the district STEM night.",
    requestedBy: "Pine Lake Elementary",
    organizationName: "Pine Lake Elementary",
    category: "General",
    honorSociety: "Science National Honor Society",
    location: "out_of_school",
    eventDate: "2026-10-15T23:00:00.000Z",
    hoursValue: 3,
    requiredVolunteers: 10,
    createdBy: TEACHER_ID,
  }),

  // --- Private assignments --------------------------------------------------
  task({
    id: "seed-private-lab-inventory",
    title: "Private: Biology Lab Inventory Audit",
    description:
      "Count and log remaining dissection kits and microscope slides. Report totals to Ms. Rivera.",
    requestedBy: "Morgan Rivera",
    category: "General",
    location: "in_school",
    blockTime: "Block C",
    eventDate: "2026-09-17T19:00:00.000Z",
    hoursValue: 1.5,
    createdBy: TEACHER_ID,
    assignedStudentId: STUDENT_ID,
  }),
  task({
    id: "seed-private-nhs-mentor",
    title: "Private: Mentor a New NHS Inductee",
    description:
      "Meet weekly with a new inductee to walk through hour logging and chapter expectations.",
    requestedBy: "NHS Chapter Advisor",
    category: "NHS",
    honorSociety: "NHS",
    serviceScope: "club_internal",
    location: "after_school",
    blockTime: "After School",
    eventDate: "2026-09-30T20:30:00.000Z",
    hoursValue: 1,
    createdBy: TEACHER_ID,
    assignedStudentId: STUDENT_ID,
    isRecurring: true,
    recurrencePattern: "weekly",
  }),

  // --- Awaiting Tech Manager certification ----------------------------------
  task({
    id: "seed-pending-habitat",
    title: "Habitat Build Day — Framing Crew",
    description:
      "Students assist the site supervisor with framing, painting, and cleanup on a new build. Closed-toe shoes required; all tools provided.",
    requestedBy: "Habitat for Humanity Lake Norman",
    organizationName: "Habitat for Humanity Lake Norman",
    category: "Outside Org",
    location: "out_of_school",
    eventDate: "2026-10-10T13:00:00.000Z",
    blockTime: "8:00 AM – 1:00 PM",
    hoursValue: 5,
    requiredVolunteers: 12,
    createdBy: ORG_ID,
    status: "pending_certification",
  }),
  task({
    id: "seed-pending-shelter",
    title: "Weekend Dog Walking & Kennel Care",
    description:
      "Walk shelter dogs, refresh water bowls, and help socialize new arrivals. Volunteers must be 14 or older.",
    requestedBy: "Lake Norman Animal Rescue",
    organizationName: "Lake Norman Animal Rescue",
    category: "Outside Org",
    location: "out_of_school",
    eventDate: "2026-10-04T15:00:00.000Z",
    blockTime: "Saturday mornings",
    hoursValue: 2,
    requiredVolunteers: 6,
    createdBy: ORG_ID,
    isRecurring: true,
    recurrencePattern: "weekly",
    status: "pending_certification",
  }),
  task({
    id: "seed-pending-coat-drive",
    title: "Winter Coat Drive Collection Table",
    description:
      "Staff the lobby collection table before school, sort donations by size, and log bag counts.",
    requestedBy: "Student Services",
    category: "General",
    location: "in_school",
    blockTime: "Morning · Block A",
    eventDate: "2026-11-02T12:30:00.000Z",
    hoursValue: 1,
    requiredVolunteers: 4,
    createdBy: TEACHER_ID,
    status: "pending_certification",
  }),
  task({
    id: "seed-rejected-fundraiser",
    title: "Weekend Retail Fundraiser Staffing",
    description:
      "Staff a merchandise booth at the outlet mall and process card payments for the fundraiser.",
    requestedBy: "Lakeside Food Bank",
    organizationName: "Lakeside Food Bank",
    category: "Outside Org",
    location: "out_of_school",
    eventDate: "2026-09-27T16:00:00.000Z",
    hoursValue: 4,
    requiredVolunteers: 5,
    createdBy: ORG_ID,
    status: "rejected",
    reviewNotes:
      "Handling cash and card payments is not eligible for verified service hours. Resubmit with a non-transactional volunteer role.",
  }),
];
