import { db } from "../config/supabase.js";


export async function getScores(
    classId,
    subjectId,
    month,
    year
) {

    const { data, error } = await db
        .from("scores")
        .select(`
            id,
            student_id,
            score
        `)
        .eq("class_id", classId)
        .eq("subject_id", subjectId)
        .eq("month", month)
        .eq("year", year);


    if (error) {

        console.error(
            "Error loading scores:",
            error
        );

        return [];
    }


    return data;
}


export async function saveScores(scores) {

    const {data, error} = await db
        .from("scores")
        .upsert(
            scores,
            {
                onConflict: "student_id, subject_id, month, year"
            }
        )
        .select();

    if (error) {

        console.error("Error saving scores:", error);

        throw error;
    }

    return data;
}