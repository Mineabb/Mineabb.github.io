
import { db } from "./config/supabase.js";
import { 
    loginTeacher
 } from "./services/teacherService.js";
import { getStudentsByClass } from "./services/studentService.js";

import { getScores,
         saveScores
 } from "./services/scoreService.js";

import { validateScore } from "./utils/validator.js";
import { showToast } from "./utils/toast.js";


let currentTeacher = null;

const loginForm = document.getElementById("loginForm");

const loginPage = document.getElementById("loginPage");

const scorePage = document.getElementById("scorePage");

const teacherCodeInput = document.getElementById("teacherCode");

const passwordInput = document.getElementById("password");

const loginMessage = document.getElementById("loginMessage");


loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const teacherCode =
        teacherCodeInput.value.trim();

    const password =
        passwordInput.value.trim();


    loginMessage.textContent = "Logging in...";


    const teacher = await loginTeacher(
        teacherCode,
        password
    );


    if (!teacher) {

        loginMessage.textContent =
            "Invalid teacher code or password.";

        return;
    }

    currentTeacher = teacher;
    loadMonthOptions();

    document.getElementById("className").value =
        teacher.classes.class_name;

    const subjectName = teacher.subjects.subject_name;
    document.getElementById("subjectName")
            .value = getKhmerSubjectName(subjectName);

        const today = new Date();

        const year = today.getFullYear();

        const month = String(
            today.getMonth() + 1
        ).padStart(2, "0");

        document.getElementById("scoreMonth").value =
            `${year}-${month}`;

        const students =
            await getStudentsByClass(
                teacher.class_id
            );

    const scores = await getScores(
        teacher.class_id,
        teacher.subject_id,
        Number(month),
        Number(year)
    );

    renderStudents(
        students,
        scores

    );


    loginPage.classList.add("hidden");

    scorePage.classList.remove("hidden");

    document.getElementById(
    "scoreHeader"
        ).innerHTML = `
            <i class="fa-solid fa-pen-to-square"></i>
            Score
            <small>
                (0-${currentTeacher.max_score})
            </small>
        `;
});


document.getElementById("scoreMonth")
        .addEventListener("change", async () =>{

            await reloadStudentTable();
        })


const photoPopup =
    document.getElementById("photoPopup");

const photoPopupImage =
    document.getElementById("photoPopupImage");

const photoPopupInitials =
    document.getElementById("photoPopupInitials");

const photoPopupName =
    document.getElementById("photoPopupName");

const photoPopupClose =
    document.getElementById("photoPopupClose");



function renderStudents(students, scores) {

    const tableBody =
        document.getElementById("studentTableBody");

    tableBody.innerHTML = "";


    // Create score lookup
    const scoreMap = new Map();

    scores.forEach(score => {

        scoreMap.set(
            score.student_id,
            score.score
        );

    });


    // Create student rows
    students.forEach(student => {

        const row =
            document.createElement("tr");


        const existingScore =
            scoreMap.get(student.id);


        const scoreValue =
            existingScore !== undefined &&
            existingScore !== null
                ? existingScore
                : "";


        row.innerHTML = `

            <td>

                ${
                    student.photo_url

                    ? `
                        <img
                            src="${student.photo_url}"
                            class="student-photo zoomable-student-photo"
                            alt="Student Photo"
                            data-name="${student.student_name}"
                            data-photo="${student.photo_url}"
                        >
                    `

                    : `
                        <div
                            class="no-photo zoomable-student-photo"
                            style="
                                background-color:
                                ${getAvatarColor(
                                    student.student_name
                                )};
                            "
                            data-name="${student.student_name}"
                            data-initials="${getInitials(
                                student.student_name
                            )}"
                        >
                            ${getInitials(
                                student.student_name
                            )}
                        </div>
                    `
                }

            </td>


            <td>
                ${student.student_id}
            </td>


            <td>
                ${student.student_name}
            </td>


            <td>

                <input
                    type="number"
                    class="score-input"
                    data-student-id="${student.id}"
                    value="${scoreValue}"
                    min="0"
                    max="${currentTeacher.max_score}"
                    step="1"
                    placeholder="0-${currentTeacher.max_score}"
                >

            </td>

        `;


        tableBody.appendChild(row);

    });


    const zoomableElements =
    tableBody.querySelectorAll(
        ".zoomable-student-photo"
    );


    zoomableElements.forEach(element => {

        element.addEventListener(
            "click",
            () => {

                // Remove zoom from all other photos/avatars

                zoomableElements.forEach(item => {

                    if (item !== element) {

                        item.classList.remove(
                            "photo-zoomed"
                        );

                    }

                });


                // Toggle clicked photo/avatar

                element.classList.toggle(
                    "photo-zoomed"
                );

            }
        );

    });

}

document.addEventListener("input", (event) => {

    if (
        !event.target.classList.contains(
            "score-input"
        )
    ) {
        return;
    }


    const input = event.target;


    const result =
        validateScore(
            input.value,
            currentTeacher.max_score
        );


    if (!result.valid) {

        input.classList.add(
            "invalid-score"
        );

    } else {

        input.classList.remove(
            "invalid-score"
        );

    }

});


const saveScoresButton = document.getElementById("saveScoreButton");
saveScoresButton.addEventListener(
    "click",
    async () => {

        saveScoresButton.disabled = true;

        saveScoresButton.textContent =
            "Saving...";


        try {

            const scores =
                collectScores();


            // Validation failed

            if (scores === null) {
                return;
            }


            // No scores

            if (scores.length === 0) {

                showToast(
                    "Please enter at least one score.",
                    "warning"
                );

                return;
            }


            console.log(
                "Scores to save:",
                scores
            );


            await saveScores(scores);


            showToast(
                "Scores saved successfully!",
                "success"
            );

            setTimeout(() => {
                
                returnToLogin();
            }, 1000);


        } catch (error) {

            console.error(
                "Save scores error:",
                error
            );


            showToast(
                "Failed to save scores.",
                "error"
            );


        } finally {

            saveScoresButton.disabled = false;

            saveScoresButton.textContent =
                "Save Scores";

        }

    }
);


function collectScores() {

    const inputs =
        document.querySelectorAll(
            ".score-input"
        );


    const scores = [];


    // Get selected month and year once

    const monthYear =
        document.getElementById(
            "scoreMonth"
        ).value;


    const [year, month] =
        monthYear.split("-");


    for (const input of inputs) {

        const value =
            input.value.trim();

        if(value === "") {
            input.focus(); 
            input.classList.add("invalid-score");

            showToast("Please enter scores for all students.", "warning");

            return null;
        }

        // Validate score

        const validation =
            validateScore(
                value,
                currentTeacher.max_score
            );


        if (!validation.valid) {

            input.focus();

            showToast(
                validation.message,
                "error"
            );

            return null;

        }


        // Ignore empty scores

        if (value === "") {
            continue;
        }


        scores.push({

            student_id:
                Number(
                    input.dataset.studentId
                ),

            subject_id:
                currentTeacher.subject_id,

            class_id:
                currentTeacher.class_id,

            month:
                Number(month),

            year:
                Number(year),

            score:
                Number(value)

        });

    }


    return scores;
}


const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", logout);

function logout() {

    returnToLogin()

    showToast("You have been logged out.", "info");

}

function returnToLogin() {

    currentTeacher = null;

    document.getElementById(
        "studentTableBody"
    ).innerHTML = "";

    document.getElementById(
        "loginForm"
    ).reset()

    document.getElementById(
        "loginMessage"
    ).textContent = "";

    scorePage.classList.add(
        "hidden"
    );

    loginPage.classList.remove(
        "hidden"
    );

    document.getElementById(
        "teacherCode"
    ).focus();

}


async function reloadStudentTable() {

    try {

        if (!currentTeacher) {
            return;
        }


        const monthYear =
            document.getElementById(
                "scoreMonth"
            ).value;


        if (!monthYear) {
            return;
        }


        const [year, month] =
            monthYear.split("-");


        console.log(
            "Reloading scores:",
            {
                classId:
                    currentTeacher.class_id,

                subjectId:
                    currentTeacher.subject_id,

                month:
                    Number(month),

                year:
                    Number(year)
            }
        );


        // Load students

        const students =
            await getStudentsByClass(
                currentTeacher.class_id
            );


        // Load scores for selected month

        const scores =
            await getScores(
                currentTeacher.class_id,
                currentTeacher.subject_id,
                Number(month),
                Number(year)
            );


        console.log(
            "Reloaded scores:",
            scores
        );


        // Render table again

        renderStudents(
            students,
            scores
        );


    } catch (error) {

        console.error(
            "Error reloading student table:",
            error
        );


        showToast(
            "Failed to reload scores.",
            "error"
        );

    }

}


function loadMonthOptions() {

    const select =
        document.getElementById("scoreMonth");

    const khmerMonths = [
        "មករា",
        "កុម្ភៈ",
        "មីនា",
        "មេសា",
        "ឧសភា",
        "មិថុនា",
        "កក្កដា",
        "សីហា",
        "កញ្ញា",
        "តុលា",
        "វិច្ឆិកា",
        "ធ្នូ"
    ];

    select.innerHTML = "";

    for (let year = 2025; year <= 2026; year++) {

        let startMonth = 1;
        let endMonth = 12;

        if (year === 2025) {
            startMonth = 11;
        }

        if (year === 2026) {
            endMonth = 9;
        }

        for (
            let month = startMonth;
            month <= endMonth;
            month++
        ) {

            const option =
                document.createElement("option");

            const monthValue =
                String(month).padStart(2, "0");

            option.value =
                `${year}-${monthValue}`;

            option.textContent =
                `${khmerMonths[month - 1]} ${year}`;

            select.appendChild(option);
        }
    }

    // Select current month

    const today = new Date();

    const currentValue =
        `${today.getFullYear()}-${String(
            today.getMonth() + 1
        ).padStart(2, "0")}`;

    select.value = currentValue;
}


function getKhmerSubjectName(subjectName) {

    const subjects = {

        "Khmer":
            "ភាសាខ្មែរ",

        "Mathematics":
            "គណិតវិទ្យា",

        "English":
            "ភាសាអង់គ្លេស",

        "Physics":
            "រូបវិទ្យា",

        "Chemistry":
            "គីមីវិទ្យា",

        "Biology":
            "ជីវវិទ្យា",

        "Earth Science":
            "វិទ្យាសាស្ត្រផែនដី",

        "History":
            "ប្រវត្តិវិទ្យា",

        "Geography":
            "ភូមិវិទ្យា"
    };


    return subjects[subjectName]
        || subjectName;
}


function getInitials(name) {

    if (!name) {
        return "";
    }


    const parts =
        name.trim().split(/\s+/);


    if (parts.length === 1) {

        return parts[0]
            .charAt(0)
            .toUpperCase();

    }


    const first =
        parts[0]
            .charAt(0)
            .toUpperCase();


    const last =
        parts[parts.length - 1]
            .charAt(0)
            .toUpperCase();


    return first + last;
}


function getAvatarColor(name) {

    const colors = [
        "#DBEAFE",
        "#DCFCE7",
        "#FEF3C7",
        "#FCE7F3",
        "#EDE9FE",
        "#CFFAFE",
        "#FDE68A",
        "#D1FAE5"
    ];


    let hash = 0;


    for (let i = 0; i < name.length; i++) {

        hash =
            name.charCodeAt(i) +
            ((hash << 5) - hash);

    }


    const index =
        Math.abs(hash) % colors.length;


    return colors[index];
}


