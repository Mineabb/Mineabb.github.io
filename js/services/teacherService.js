import { db } from "../config/supabase.js";


export async function loginTeacher(
    teacherCode,
    password
) {

    try {

        // ==========================================
        // 1. Get auth email from Edge Function
        // ==========================================

        const {
            data: lookupData,
            error: lookupError
        } = await db.functions.invoke(
            "teacher-login-lookup",
            {
                body: {
                    teacherCode: teacherCode.trim()
                }
            }
        );

        if (lookupError || !lookupData?.auth_email) {

            console.error(
                "Teacher lookup error:",
                lookupError || "Teacher not found"
            );

            return null;
        }

        const authEmail = lookupData.auth_email;

        console.log("Auth email:", authEmail);


        // ==========================================
        // 2. Sign in with Supabase Auth
        // ==========================================

        const {
            data: authData,
            error: authError
        } = await db.auth.signInWithPassword({
            email: authEmail,
            password: password
        });

        if (authError) {

            console.error(
                "Teacher authentication error:",
                authError
            );

            return null;
        }


        // ==========================================
        // 3. Get teacher details AFTER authentication
        // ==========================================

        const {
            data: teacher,
            error: teacherError
        } = await db
            .from("teachers")
            .select(`
                id,
                teacher_code,
                auth_email,
                auth_user_id,
                class_id,
                subject_id,

                classes (
                    class_name
                ),

                subjects (
                    subject_name
                )
            `)
            .eq("auth_user_id", authData.user.id)
            .single();


        if (teacherError || !teacher) {

            console.error(
                "Teacher details error:",
                teacherError
            );

            await db.auth.signOut();

            return null;
        }


        // ==========================================
        // 4. Verify Auth user matches teacher
        // ==========================================

        if (authData.user.id !== teacher.auth_user_id) {

            console.error(
                "Authenticated user does not match teacher."
            );

            await db.auth.signOut();

            return null;
        }


        // ==========================================
        // 5. Get score rule
        // ==========================================

        const {
            data: scoreRule,
            error: scoreRuleError
        } = await db
            .from("subject_score_rules")
            .select("max_score")
            .eq("class_id", teacher.class_id)
            .eq("subject_id", teacher.subject_id)
            .single();


        if (scoreRuleError || !scoreRule) {

            console.error(
                "Score rule error:",
                scoreRuleError
            );

            await db.auth.signOut();

            return null;
        }


        // ==========================================
        // 6. Add max score
        // ==========================================

        teacher.max_score = scoreRule.max_score;


        // ==========================================
        // 7. Return teacher
        // ==========================================

        return teacher;


    } catch (error) {

        console.error(
            "Teacher login error:",
            error
        );

        return null;
    }
}

