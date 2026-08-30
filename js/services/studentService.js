import { db } from "../config/supabase.js";


export async function getStudentsByClass(classId) {

    const { data, error } = await db
        .from("students")
        .select(`
            id,
            student_id,
            student_name,
            photo_url
        `)
        .eq("class_id", classId)
        .order("student_id");


    if (error) {

        console.error(
            "Error loading students:",
            error
        );

        return [];

    }


    return data;
}