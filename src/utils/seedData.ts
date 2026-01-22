
import { api } from '@/services/api';

const SEED_DATA = [
    {
        name: "Discovery",
        tasks: [
            { name: "Assessment" },
            { name: "Site survey" },
            { name: "Utilities survey" },
            { name: "Lease evaluation" },
            { name: "Kitchen assessment" },
            { name: "Code review" },
            { name: "Budget estimation" },
            { name: "Timeline estimation" },
        ]
    },
    {
        name: "Lease",
        tasks: [
            { name: "Lease negotiation" },
            { name: "Final lease review" },
            { name: "Lease execution" },
            { name: "Signatures" },
            { name: "Security deposit" },
            { name: "First rent payment" },
            { name: "Insurance certificates" },
            { name: "Tenant improvement confirmation" },
        ]
    },
    {
        name: "Design & Permits",
        tasks: [
            { name: "Interior design" },
            { name: "Kitchen design" },
            { name: "Branding integration" },
            { name: "Design revisions" },
            { name: "Final design approval" },
            {
                name: "Permit pro-work",
                subtasks: [
                    "Architectural layouts",
                    "Kitchen layouts",
                    "MEP layouts",
                    "Fire layouts"
                ]
            },
            { name: "Landlord approval" },
            {
                name: "Expeditor processing",
                subtasks: [
                    "Permit submissions",
                    "Revisions",
                    "Permit approval"
                ]
            },
            {
                name: "County permit processing",
                subtasks: [
                    "Permit submissions",
                    "Revisions",
                    "Permit approval"
                ]
            },
            {
                name: "ABC license",
                subtasks: [
                    "Application submission",
                    "Background checks",
                    "Inspection",
                    "License approval"
                ]
            }
        ]
    },
    {
        name: "Ordering",
        tasks: [
            {
                name: "Crockery (China)",
                subtasks: [
                    "Selection",
                    "Quotes",
                    "Final order",
                    "Advance payment",
                    "Production",
                    "Container dispatch",
                    "Container arrival",
                    "Customs clearance",
                    "Delivery to site"
                ]
            },
            {
                name: "Furniture (China)",
                subtasks: [
                    "Selection",
                    "Quotes",
                    "Final order",
                    "Advance payment",
                    "Production",
                    "Container dispatch",
                    "Container arrival",
                    "Customs clearance",
                    "Delivery to site"
                ]
            },
            {
                name: "Packaging (China)",
                subtasks: [
                    "Selection",
                    "Quotes",
                    "Final order",
                    "Advance payment",
                    "Production",
                    "Container dispatch",
                    "Container arrival",
                    "Customs clearance",
                    "Delivery to site"
                ]
            },
            {
                name: "Kitchen equipment (USA)",
                subtasks: [
                    "Equipment list",
                    "Vendor selection",
                    "Quotes",
                    "Final order",
                    "Deposit payment",
                    "Production lead time",
                    "Delivery scheduling",
                    "Delivery to site",
                    "Installation"
                ]
            },
            {
                name: "Smallwares (USA)",
                subtasks: [
                    "Selection",
                    "Ordering",
                    "Delivery"
                ]
            }
        ]
    },
    {
        name: "Construction",
        tasks: [
            { name: "Mobilization" },
            { name: "Demolition" },
            { name: "Framing" },
            { name: "Plumbing rough-in" },
            { name: "Electrical rough-in" },
            { name: "HVAC rough-in" },
            { name: "Fire suppression" },
            { name: "Insulation" },
            { name: "Drywall" },
            { name: "Flooring" },
            { name: "Ceiling" },
            { name: "Tile work" },
            { name: "Painting" },
            { name: "Millwork" },
            { name: "Bar build-out" },
            { name: "Restroom build-out" },
            { name: "Final finishes" },
            {
                name: "Kitchen installation",
                subtasks: [
                    "Hood installation",
                    "Equipment placement",
                    "Gas connections",
                    "Electrical connections"
                ]
            }
        ]
    },
    {
        name: "Inspections",
        tasks: [
            {
                name: "Rough inspections",
                subtasks: [
                    "Plumbing",
                    "Electrical",
                    "Mechanical"
                ]
            },
            { name: "Fire inspection" },
            { name: "Health inspection" },
            { name: "Final building inspection" },
            { name: "Certificate of occupancy" },
        ]
    },
    {
        name: "Pro-Launch",
        tasks: [
            {
                name: "Utility activation",
                subtasks: [
                    "Gas",
                    "Electric",
                    "Water",
                    "Internet"
                ]
            },
            { name: "POS setup" },
            { name: "Menu setup" },
            { name: "Vendor onboarding" },
            { name: "Inventory ordering" },
            { name: "Staff hiring" },
            { name: "Staff training" },
            { name: "Soft opening" },
            { name: "Friends & family launch" },
        ]
    },
    {
        name: "Launch",
        tasks: [
            { name: "Final cleaning" },
            { name: "Final walkthrough" },
            { name: "Marketing launch" },
            { name: "Grand opening" },
            { name: "First service day" }
        ]
    }
];

export async function resetAndSeedDatabase() {
    const proceed = window.confirm("⚠️ DANGER: This will WIPE ALL DATA and replace it with Herndon/Ashburn templates. Are you sure?");
    if (!proceed) return;

    console.log("Starting Database Reset & Seed...");

    try {
        // 1. Delete Existing Projects
        const projects = await api.getProjects();
        console.log(`Found ${projects.length} existing projects. Deleting...`);

        for (const p of projects) {
            await api.deleteProject(p.id);
            console.log(`Deleted project: ${p.name}`);
        }

        // 2. Create Projects
        const projectNames = ["Herndon", "Ashburn"];

        for (const pName of projectNames) {
            console.log(`Creating project: ${pName}...`);
            const project = await api.createProject({ name: pName });
            if (!project || !project.id) throw new Error("Failed to create project");
            const projectId = project.id;

            // 3. Create Phases
            for (let i = 0; i < SEED_DATA.length; i++) {
                const phaseData = SEED_DATA[i];
                console.log(`  Adding Phase: ${phaseData.name}`);

                // Create Phase
                const phase = await api.createPhase({
                    project_id: projectId,
                    name: phaseData.name,
                    status: 'not-started',
                    progress: 0,
                    position: i, // Use index as position
                    tasks: []
                });
                const phaseId = phase.id || (phase as any).data?.id; // Handle typical supabase response if wrapper varies

                if (!phaseId) {
                    console.error("Phase creation failed (no ID)", phase);
                    continue;
                }

                // 4. Create Tasks
                if (phaseData.tasks) {
                    for (let j = 0; j < phaseData.tasks.length; j++) {
                        const taskSource = phaseData.tasks[j];

                        // Create Task
                        // @ts-ignore
                        const task = await api.createTask(phaseId, taskSource.name);

                        if (task && task.id && taskSource.subtasks) {
                            // 5. Create Subtasks
                            for (const subName of taskSource.subtasks) {
                                await api.createSubtask(task.id, subName);
                            }
                        }
                    }
                }
            }
        }

        console.log("Seeding Complete!");
        alert("Database Reset & Seeding Complete! The page will now reload.");
        window.location.reload();
        return true;
    } catch (e) {
        console.error("Seeding Failed:", e);
        alert("Seeding Failed. Check console.");
        return false;
    }
}
