document.getElementById("signin").onclick = async () => {
    const errorEl = document.getElementById("error");
    errorEl.style.color = "red";
    errorEl.textContent = "";

    let req, res;
    try {
        req = await fetch("/api/account/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: document.getElementById("username").value,
                password: document.getElementById("password").value
            })
        });

        res = await req.json().catch(() => ({}));
    } catch (err) {
        errorEl.textContent = "Could not reach the server";
        return;
    }

    if (!req.ok) {
        const errors = {
            "auth/missing-credentials": "Missing Credentials",
            "auth/invalid-credentials": "Invalid Username or Password",
            "auth/username-invalid": "Username must contain 3-16 characters and can only contain uppercase, lowercase, numbers, and underscores.",
            "auth/password-weak": "Password must contain atleast 8 characters and must have atleast 1 uppercase character and 1 number.",
            "auth/username-exists": "Username already in use",
            "server/internal-error": "Internal Server Error"
        };

        errorEl.textContent = errors[res.error] || "An unknown error occurred";
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");

    const safe = returnTo && /^\/(?![/\\])/.test(returnTo);

    window.location.href = safe ? returnTo : res.redirect;
};