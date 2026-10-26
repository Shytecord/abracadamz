(async () => {
    const req = await fetch("/api/account/me");
    const res = await req.json();

    if (req.ok)
    {
        document.getElementById("account-dn").innerHTML = res.user.displayName;
        document.getElementById("account-ava").src = res.user.avatar;
    }
})();

document.getElementById("account").onclick = () => {
    window.location.href = "/account";
}