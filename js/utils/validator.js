export function validateScore(
    value,
    maxScore
) {

    if (value === "") {
        return {
            valid: true,
            message: ""
        };
    }


    const score = Number(value);


    if (!Number.isFinite(score)) {

        return {
            valid: false,
            message: "Score must be a number."
        };

    }


    if (
        score < 0 ||
        score > maxScore
    ) {

        return {
            valid: false,
            message:
                `Score must be between 0 and ${maxScore}.`
        };

    }


    return {
        valid: true,
        message: ""
    };
}