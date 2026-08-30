export function showToast(
    message,
    type = "success"
) {

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${type}`;

    toast.textContent = message;


    document.body.appendChild(toast);


    // Show

    requestAnimationFrame(() => {

        toast.classList.add(
            "show"
        );

    });


    // Hide

    setTimeout(() => {

        toast.classList.remove(
            "show"
        );


        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3000);
}