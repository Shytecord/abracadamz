const hamburger = document.getElementById("openMobile");
let burgerOpen = false;

hamburger.onclick = () => {
    burgerOpen = !burgerOpen;

    hamburger.style.transform = burgerOpen ? "rotate(90deg)" : "rotate(0)";
    document.getElementById("mlinks").style.transform = burgerOpen ? "translateY(0)" : "translateY(-50vh)";
}

document.addEventListener("DOMContentLoaded", async () => {
    const req = await fetch("/api/youtube/latest");
    const res = await req.json();

    document.getElementById("latest-vid").src = `https://www.youtube.com/embed/${res.id}`;
});