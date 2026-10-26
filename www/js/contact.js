document.getElementById("send").onclick = async () => {
    const errorEl = document.getElementById("error");
    errorEl.style.color = "red";
    errorEl.textContent = "";

    let req, res;
    try {
        req = await fetch("/api/submit/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: document.getElementById("name").value,
                email: document.getElementById("email").value,
                message: document.getElementById("message").value
            })
        });

        res = await req.json().catch(() => ({}));
    } catch (err) {
        errorEl.textContent = "Could not reach the server";
        return;
    }

    if (!req.ok) {
        const errors = {
            "missing-name": "Missing Name",
            "missing-email": "Missing Email",
            "missing-message": "Missing Message",
            "name-too-long": "Name is too long",
            "email-too-long": "Email is too long",
            "message-too-long": "Message is too long",
            "invalid-name": "Invalid Name",
            "invalid-email": "Invalid Email",
            "invalid-message": "Invalid Message",
            "too-many-requests": "Too many submissions, try again later",
            "email-error": "Failed to submit message"
        };

        errorEl.textContent = errors[res.error] || "An unknown error occurred";
        return;
    }

    errorEl.style.color = "green";
    errorEl.textContent = "Message Submitted";
};