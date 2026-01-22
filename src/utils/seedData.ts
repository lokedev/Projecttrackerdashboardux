
import { supabase } from '@/lib/supabase';

// Define Data Structure
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
        const { data: projects, error: fetchError } = await supabase.from('projects').select('id, name');
        if (fetchError) throw fetchError;

        console.log(`Found ${projects?.length || 0} existing projects. Deleting...`);

        if (projects) {
            for (const p of projects) {
                const { error: deleteError } = await supabase.from('projects').delete().eq('id', p.id);
                if (deleteError) throw deleteError;
                console.log(`Deleted project: ${p.name}`);
            }
        }

        // 2. Create Projects
        const projectNames = ["Herndon", "Ashburn"];

        for (const pName of projectNames) {
            console.log(`Creating project: ${pName}...`);

            const { data: project, error: projError } = await supabase
                .from('projects')
                .insert({ name: pName })
                .select() // important to return data
                .single();

            if (projError) throw projError;
            if (!project) throw new Error("Project created but no data returned");

            const projectId = project.id;

            // 3. Create Phases
            for (let i = 0; i < SEED_DATA.length; i++) {
                const phaseData = SEED_DATA[i];
                console.log(`  Adding Phase: ${phaseData.name}`);

                const { data: phase, error: phaseError } = await supabase
                    .from('phases')
                    .insert({
                        project_id: projectId,
                        name: phaseData.name,
                        status: 'not-started',
                        progress: 0,
                        position: i
                    })
                    .select()
                    .single();

                if (phaseError) throw phaseError;
                const phaseId = phase.id;

                // 4. Create Tasks
                if (phaseData.tasks) {
                    for (let j = 0; j < phaseData.tasks.length; j++) {
                        const taskSource = phaseData.tasks[j];

                        const { data: task, error: taskError } = await supabase
                            .from('tasks')
                            .insert({
                                phase_id: phaseId,
                                name: taskSource.name,
                                completed: false,
                                position: j // Explicit position
                            })
                            .select()
                            .single();

                        if (taskError) throw taskError;

                        if (taskSource.subtasks && taskSource.subtasks.length > 0) {
                            // 5. Create Subtasks
                            for (let k = 0; k < taskSource.subtasks.length; k++) {
                                const subName = taskSource.subtasks[k];
                                const { error: subError } = await supabase
                                    .from('subtasks')
                                    .insert({
                                        task_id: task.id,
                                        name: subName,
                                        completed: false,
                                        position: k
                                    });

                                if (subError) throw subError;
                            }
                        }
                    }
                }
            }
        }

        console.log("Seeding Complete!");
        alert("Success! The page will now reload.");
        window.location.reload();
        return true;
    } catch (e: any) {
        console.error("Seeding Failed:", e);
        alert(`Seeding Failed:\n${e.message || JSON.stringify(e)}\n\nCheck console for full stack.`);
        return false;
    }
}
