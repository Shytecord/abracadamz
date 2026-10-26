document.getElementById("saveInfo").onclick = async () => {
    const errorEl = document.getElementById("error");
    errorEl.style.color = "red";
    errorEl.textContent = "";

    let req, res;
    try {
        req = await fetch("/api/account/modifyUser", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                displayName: document.getElementById("displayName").value
            })
        });

        res = await req.json().catch(() => ({}));
    } catch (err) {
        errorEl.textContent = "Could not reach the server";
        return;
    }

    if (!req.ok) {
        const errors = {
            "api/unauthorized": "You aren't authorized to use this",
            "server/internal-error": "Internal Server Error",
            "api/nothing-to-update": "Nothing to update",
            "api/displayName-invalid": "Display Name is invalid"
        };

        errorEl.textContent = errors[res.error] || "An unknown error occurred";
        return;
    }

    window.location.reload();
};